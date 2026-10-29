"""Booking lifecycle: validation, safe seat allocation, idempotency and access control."""

import hashlib
import json
import logging
import secrets
from dataclasses import asdict, dataclass
from datetime import timedelta

from django.conf import settings
from django.db import IntegrityError, transaction
from django.utils import timezone
from django.utils.crypto import constant_time_compare, salted_hmac

from apps.bookings.models import Booking, BookingStatus, Passenger, TripType
from apps.core.exceptions import ConflictError, DomainError
from apps.customers.normalize import normalize_email, normalize_phone
from apps.pricing.services import Quote, calculate_quote
from apps.schedules.models import Trip, TripStatus
from apps.schedules.services import seats_booked

logger = logging.getLogger(__name__)

REFERENCE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"  # no 0/O/1/I
REFERENCE_LENGTH = 6
_TOKEN_SALT = "tommysbus.bookings.access-token"  # noqa: S105 - HMAC namespace, not a secret


class InvalidTripSelection(DomainError):
    default_detail = "The selected departure is not available."
    default_code = "invalid_trip"


class InsufficientSeats(ConflictError):
    default_detail = "Not enough seats remain on the selected departure."
    default_code = "insufficient_seats"


class IdempotencyConflict(ConflictError):
    default_detail = "This Idempotency-Key was already used with a different request."
    default_code = "idempotency_conflict"


@dataclass(frozen=True)
class TripSelection:
    trip_id: int
    return_trip_id: int | None
    adults: int
    children: int
    bags: int

    @property
    def passengers(self) -> int:
        return self.adults + self.children


@dataclass(frozen=True)
class BookingRequest:
    selection: TripSelection
    customer_name: str
    customer_email: str
    customer_phone: str
    notes: str = ""


# --- tokens & references -------------------------------------------------------------


def generate_reference() -> str:
    return "TB-" + "".join(secrets.choice(REFERENCE_ALPHABET) for _ in range(REFERENCE_LENGTH))


def derive_access_token(reference: str, idempotency_key: str) -> str:
    """Deterministic per-booking secret so an idempotent retry can return the same token.

    Only the SHA-256 of the token is stored. Knowing a reference alone reveals nothing.
    """
    return salted_hmac(_TOKEN_SALT, f"{reference}:{idempotency_key}", algorithm="sha256").hexdigest()


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def _fingerprint(request: BookingRequest) -> str:
    payload = asdict(request)
    payload["customer_email"] = normalize_email(request.customer_email)
    return hashlib.sha256(json.dumps(payload, sort_keys=True, default=str).encode()).hexdigest()


# --- validation ----------------------------------------------------------------------


def _resolve_trips(selection: TripSelection, *, lock: bool) -> tuple[Trip, Trip | None]:
    ids = [selection.trip_id] + ([selection.return_trip_id] if selection.return_trip_id else [])
    qs = Trip.objects.select_related("route__origin", "route__destination").filter(pk__in=ids)
    if lock:
        # Lock in a stable order to avoid deadlocks between concurrent round-trip bookings.
        qs = qs.select_for_update(of=("self",)).order_by("pk")
    trips = {t.pk: t for t in qs}

    outbound = trips.get(selection.trip_id)
    inbound = trips.get(selection.return_trip_id) if selection.return_trip_id else None
    if outbound is None or (selection.return_trip_id and inbound is None):
        raise InvalidTripSelection()
    return outbound, inbound


def validate_selection(selection: TripSelection, outbound: Trip, inbound: Trip | None) -> None:
    if selection.adults < 1:
        raise DomainError("At least one adult is required.")
    if selection.children < 0 or selection.bags < 0:
        raise DomainError("Counts cannot be negative.")
    if selection.passengers > settings.BOOKING_MAX_PASSENGERS:
        raise DomainError(
            f"Online bookings are limited to {settings.BOOKING_MAX_PASSENGERS} passengers. "
            "Please request a charter quote for larger groups."
        )
    now = timezone.now()
    for trip in filter(None, (outbound, inbound)):
        route = trip.route
        if (
            trip.status != TripStatus.SCHEDULED
            or trip.departure_datetime <= now
            or not route.is_active
            or not route.origin.is_active
            or not route.destination.is_active
        ):
            raise InvalidTripSelection()
    if not outbound.route.origin.allows_pickup:
        raise InvalidTripSelection("Pickups are not offered at this location.")
    if inbound is not None:
        if (
            inbound.route.origin_id != outbound.route.destination_id
            or inbound.route.destination_id != outbound.route.origin_id
        ):
            raise InvalidTripSelection("The return departure must travel the reverse route.")
        if inbound.departure_datetime < outbound.arrival_datetime:
            raise InvalidTripSelection("The return departure must leave after the outbound arrival.")
        if not inbound.route.origin.allows_pickup:
            raise InvalidTripSelection("Return pickups are not offered at this location.")


def quote_selection(selection: TripSelection) -> tuple[Quote, Trip, Trip | None]:
    outbound, inbound = _resolve_trips(selection, lock=False)
    validate_selection(selection, outbound, inbound)
    quote = calculate_quote(
        outbound=outbound.route,
        inbound=inbound.route if inbound else None,
        adults=selection.adults,
        children=selection.children,
        bags=selection.bags,
    )
    return quote, outbound, inbound


# --- lifecycle -----------------------------------------------------------------------


def _existing_for_key(key: str, fingerprint: str) -> Booking | None:
    existing = Booking.objects.filter(idempotency_key=key).first()
    if existing is None:
        return None
    if not constant_time_compare(existing.request_fingerprint, fingerprint):
        raise IdempotencyConflict()
    return existing


def create_booking(request: BookingRequest, *, idempotency_key: str) -> tuple[Booking, str, bool]:
    """Hold seats and create a booking. Returns ``(booking, access_token, created)``.

    Seat inventory is protected by ``SELECT ... FOR UPDATE`` on the trip rows: concurrent
    requests for the same departure serialize, and each re-counts seats after acquiring the lock.
    """
    fingerprint = _fingerprint(request)
    if existing := _existing_for_key(idempotency_key, fingerprint):
        return existing, derive_access_token(existing.booking_reference, idempotency_key), False

    selection = request.selection
    try:
        with transaction.atomic():
            outbound, inbound = _resolve_trips(selection, lock=True)
            # Another request with the same key may have committed while we waited on the lock.
            if existing := _existing_for_key(idempotency_key, fingerprint):
                return existing, derive_access_token(existing.booking_reference, idempotency_key), False

            validate_selection(selection, outbound, inbound)
            for trip in filter(None, (outbound, inbound)):
                if trip.capacity - seats_booked(trip) < selection.passengers:
                    raise InsufficientSeats()

            quote = calculate_quote(
                outbound=outbound.route,
                inbound=inbound.route if inbound else None,
                adults=selection.adults,
                children=selection.children,
                bags=selection.bags,
            )
            booking = _persist(request, quote, outbound, inbound, idempotency_key, fingerprint)
    except IntegrityError:
        # Unique key race outside the trip lock (different trips, same key) → treat as replay/conflict.
        if existing := _existing_for_key(idempotency_key, fingerprint):
            return existing, derive_access_token(existing.booking_reference, idempotency_key), False
        raise

    logger.info("booking held ref=%s trip=%s pax=%s", booking.booking_reference, outbound.pk, selection.passengers)
    return booking, derive_access_token(booking.booking_reference, idempotency_key), True


def _persist(
    request: BookingRequest,
    quote: Quote,
    outbound: Trip,
    inbound: Trip | None,
    idempotency_key: str,
    fingerprint: str,
) -> Booking:
    selection = request.selection
    email = normalize_email(request.customer_email)
    phone = normalize_phone(request.customer_phone)

    for _ in range(10):
        reference = generate_reference()
        if not Booking.objects.filter(booking_reference=reference).exists():
            break
    else:  # pragma: no cover - 32^6 space makes this practically unreachable
        raise ConflictError("Could not allocate a booking reference; please retry.")

    booking = Booking(
        booking_reference=reference,
        trip=outbound,
        return_trip=inbound,
        trip_type=TripType.ROUND_TRIP if inbound else TripType.ONE_WAY,
        adult_count=selection.adults,
        child_count=selection.children,
        passenger_count=selection.passengers,
        bag_count=selection.bags,
        subtotal_amount=quote.subtotal,
        discount_amount=quote.discount,
        baggage_amount=quote.baggage,
        total_amount=quote.total,
        currency=quote.currency,
        price_breakdown=[li.as_dict() for li in quote.line_items],
        customer_name=request.customer_name.strip(),
        customer_email=email,
        customer_phone=phone,
        notes=request.notes.strip(),
        access_token_hash=hash_token(derive_access_token(reference, idempotency_key)),
        idempotency_key=idempotency_key,
        request_fingerprint=fingerprint,
    )
    booking.transition_to(BookingStatus.HELD)
    booking.hold_expires_at = timezone.now() + timedelta(minutes=settings.BOOKING_HOLD_MINUTES)
    booking.save()
    Passenger.objects.create(booking=booking, full_name=booking.customer_name, email=email, phone=phone, is_lead=True)
    return booking


def get_booking_with_token(reference: str, token: str) -> Booking | None:
    """Return the booking only if the token matches. Same result for unknown ref and bad token."""
    booking = (
        Booking.objects.select_related("trip__route__origin", "trip__route__destination")
        .select_related("return_trip__route__origin", "return_trip__route__destination")
        .prefetch_related("passengers")
        .filter(booking_reference=reference.upper())
        .first()
    )
    expected = booking.access_token_hash if booking else hash_token(secrets.token_hex(32))
    if not constant_time_compare(expected, hash_token(token or "")) or booking is None:
        return None
    if booking.hold_is_expired:
        expire_booking(booking)
    return booking


def expire_booking(booking: Booking) -> None:
    booking.transition_to(BookingStatus.EXPIRED)
    booking.save(update_fields=["status", "updated_at"])


def expire_stale_holds() -> int:
    stale = Booking.objects.filter(status=BookingStatus.HELD, hold_expires_at__lte=timezone.now())
    return stale.update(status=BookingStatus.EXPIRED, updated_at=timezone.now())


def cancel_booking(booking: Booking) -> Booking:
    with transaction.atomic():
        locked = Booking.objects.select_for_update().get(pk=booking.pk)
        locked.transition_to(BookingStatus.CANCELLED)
        locked.save(update_fields=["status", "cancelled_at", "updated_at"])
    logger.info("booking cancelled ref=%s", locked.booking_reference)
    return locked


def confirm_booking(booking: Booking) -> Booking:
    """Staff confirmation (demo — no payment taken). Refuses holds that have lapsed."""
    with transaction.atomic():
        locked = Booking.objects.select_for_update().get(pk=booking.pk)
        lapsed = locked.hold_is_expired
        if lapsed:
            locked.transition_to(BookingStatus.EXPIRED)
            locked.save(update_fields=["status", "updated_at"])
        else:
            locked.transition_to(BookingStatus.CONFIRMED)
            locked.save(update_fields=["status", "confirmed_at", "hold_expires_at", "updated_at"])
    # Raise after commit so the EXPIRED status persists.
    if lapsed:
        raise ConflictError("The hold on this booking has expired; seats may have been released.")
    logger.info("booking confirmed ref=%s", locked.booking_reference)
    return locked
