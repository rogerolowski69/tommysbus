from typing import TYPE_CHECKING

from django.db import models
from django.utils import timezone

from apps.core.exceptions import ConflictError
from apps.core.models import TimeStampedModel
from apps.schedules.models import Trip

if TYPE_CHECKING:
    from django.db.models.fields.related_descriptors import RelatedManager


class BookingStatus(models.TextChoices):
    DRAFT = "DRAFT", "Draft"
    HELD = "HELD", "Held (unpaid)"
    CONFIRMED = "CONFIRMED", "Confirmed (demo, unpaid)"
    CANCELLED = "CANCELLED", "Cancelled"
    EXPIRED = "EXPIRED", "Expired"


class TripType(models.TextChoices):
    ONE_WAY = "ONE_WAY", "One-way"
    ROUND_TRIP = "ROUND_TRIP", "Round-trip"


# DRAFT → HELD → CONFIRMED → CANCELLED, with HELD → CANCELLED / EXPIRED.
ALLOWED_TRANSITIONS: dict[str, frozenset[str]] = {
    BookingStatus.DRAFT: frozenset({BookingStatus.HELD, BookingStatus.CANCELLED}),
    BookingStatus.HELD: frozenset({BookingStatus.CONFIRMED, BookingStatus.CANCELLED, BookingStatus.EXPIRED}),
    BookingStatus.CONFIRMED: frozenset({BookingStatus.CANCELLED}),
    BookingStatus.CANCELLED: frozenset(),
    BookingStatus.EXPIRED: frozenset(),
}

# Statuses that consume seat inventory (HELD only while its hold is unexpired).
SEAT_CONSUMING = (BookingStatus.HELD, BookingStatus.CONFIRMED)


class InvalidTransition(ConflictError):
    default_detail = "This booking cannot move to the requested status."
    default_code = "invalid_transition"


class Booking(TimeStampedModel):
    booking_reference = models.CharField(max_length=12, unique=True, editable=False)
    trip = models.ForeignKey(Trip, on_delete=models.PROTECT, related_name="bookings")
    return_trip = models.ForeignKey(
        Trip, on_delete=models.PROTECT, related_name="return_bookings", null=True, blank=True
    )
    trip_type = models.CharField(max_length=10, choices=TripType.choices, default=TripType.ONE_WAY)
    status = models.CharField(max_length=10, choices=BookingStatus.choices, default=BookingStatus.DRAFT)

    adult_count = models.PositiveSmallIntegerField()
    child_count = models.PositiveSmallIntegerField(default=0)
    passenger_count = models.PositiveSmallIntegerField()
    bag_count = models.PositiveSmallIntegerField(default=0)

    subtotal_amount = models.DecimalField(max_digits=10, decimal_places=2)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    baggage_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default="USD")
    price_breakdown = models.JSONField(default=list, help_text="Server-computed line items snapshot.")

    customer_name = models.CharField(max_length=120)
    customer_email = models.EmailField()
    customer_phone = models.CharField(max_length=20)
    notes = models.TextField(blank=True, max_length=1000)

    is_demo = models.BooleanField(default=True)
    is_paid = models.BooleanField(default=False, editable=False, help_text="Always false: no payments in this demo.")

    # Access control: SHA-256 of the per-booking secret token. The raw token is never stored.
    access_token_hash = models.CharField(max_length=64, editable=False)
    idempotency_key = models.CharField(max_length=64, unique=True, null=True, blank=True, editable=False)
    request_fingerprint = models.CharField(max_length=64, blank=True, editable=False)

    hold_expires_at = models.DateTimeField(null=True, blank=True)
    confirmed_at = models.DateTimeField(null=True, blank=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)

    if TYPE_CHECKING:
        passengers: RelatedManager["Passenger"]

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["trip", "status"], name="booking_trip_status_idx"),
            models.Index(fields=["return_trip", "status"], name="booking_return_status_idx"),
            models.Index(fields=["customer_email"], name="booking_email_idx"),
        ]
        constraints = [
            models.CheckConstraint(condition=models.Q(passenger_count__gte=1), name="booking_min_passenger"),
            models.CheckConstraint(
                condition=models.Q(passenger_count=models.F("adult_count") + models.F("child_count")),
                name="booking_passenger_sum",
            ),
            models.CheckConstraint(condition=models.Q(adult_count__gte=1), name="booking_min_adult"),
            models.CheckConstraint(condition=models.Q(total_amount__gte=0), name="booking_total_nonneg"),
            models.CheckConstraint(
                condition=(
                    models.Q(trip_type=TripType.ONE_WAY, return_trip__isnull=True)
                    | models.Q(trip_type=TripType.ROUND_TRIP, return_trip__isnull=False)
                ),
                name="booking_return_matches_type",
            ),
        ]

    def __str__(self) -> str:
        return self.booking_reference

    @property
    def hold_is_expired(self) -> bool:
        return (
            self.status == BookingStatus.HELD
            and self.hold_expires_at is not None
            and self.hold_expires_at <= timezone.now()
        )

    def transition_to(self, new_status: str) -> None:
        if new_status not in ALLOWED_TRANSITIONS[self.status]:
            raise InvalidTransition(f"Cannot change booking from {self.status} to {new_status}.")
        now = timezone.now()
        if new_status == BookingStatus.CONFIRMED:
            self.confirmed_at = now
            self.hold_expires_at = None
        elif new_status == BookingStatus.CANCELLED:
            self.cancelled_at = now
        self.status = new_status


class Passenger(TimeStampedModel):
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name="passengers")
    full_name = models.CharField(max_length=120)
    phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    is_lead = models.BooleanField(default=False)

    class Meta:
        ordering = ["-is_lead", "id"]
        constraints = [
            models.UniqueConstraint(fields=["booking"], condition=models.Q(is_lead=True), name="one_lead_passenger"),
        ]

    def __str__(self) -> str:
        return self.full_name
