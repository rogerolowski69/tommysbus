from django.contrib import admin, messages
from django.db.models import QuerySet
from django.http import HttpRequest

from apps.bookings.models import Booking, Passenger
from apps.bookings.services import cancel_booking, confirm_booking
from apps.core.exceptions import DomainError


class PassengerInline(admin.TabularInline):
    model = Passenger
    extra = 0
    fields = ["full_name", "email", "phone", "is_lead"]


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = [
        "booking_reference",
        "status",
        "trip",
        "trip_type",
        "passenger_count",
        "total_amount",
        "is_paid",
        "hold_expires_at",
        "created_at",
    ]
    list_filter = ["status", "trip_type", "is_demo", "trip__route", "created_at"]
    search_fields = ["booking_reference", "customer_name", "customer_email", "passengers__full_name"]
    date_hierarchy = "created_at"
    inlines = [PassengerInline]
    actions = ["confirm_selected", "cancel_selected"]
    list_select_related = ["trip__route"]
    readonly_fields = [
        "booking_reference",
        "status",
        "trip",
        "return_trip",
        "trip_type",
        "adult_count",
        "child_count",
        "passenger_count",
        "bag_count",
        "subtotal_amount",
        "discount_amount",
        "baggage_amount",
        "total_amount",
        "currency",
        "price_breakdown",
        "is_demo",
        "is_paid",
        "hold_expires_at",
        "confirmed_at",
        "cancelled_at",
        "created_at",
        "updated_at",
    ]
    exclude = ["access_token_hash", "idempotency_key", "request_fingerprint"]

    def has_add_permission(self, request: HttpRequest) -> bool:
        # Bookings are created through the booking service so inventory and pricing stay consistent.
        return False

    def _apply(self, request: HttpRequest, queryset: QuerySet[Booking], fn, verb: str) -> None:  # type: ignore[no-untyped-def]
        done = 0
        for booking in queryset:
            try:
                fn(booking)
                done += 1
            except DomainError as exc:
                self.message_user(request, f"{booking.booking_reference}: {exc.detail}", messages.WARNING)
        self.message_user(request, f"{done} booking(s) {verb}.")

    @admin.action(description="Confirm selected (demo — no payment collected)")
    def confirm_selected(self, request: HttpRequest, queryset: QuerySet[Booking]) -> None:
        self._apply(request, queryset, confirm_booking, "confirmed")

    @admin.action(description="Cancel selected")
    def cancel_selected(self, request: HttpRequest, queryset: QuerySet[Booking]) -> None:
        self._apply(request, queryset, cancel_booking, "cancelled")
