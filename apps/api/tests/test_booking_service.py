from datetime import timedelta

import pytest
from django.db import IntegrityError
from django.utils import timezone

from apps.bookings.models import Booking, BookingStatus, InvalidTransition
from apps.bookings.services import (
    IdempotencyConflict,
    InsufficientSeats,
    InvalidTripSelection,
    cancel_booking,
    confirm_booking,
    create_booking,
    expire_stale_holds,
    get_booking_with_token,
    hash_token,
)
from apps.core.exceptions import ConflictError, DomainError
from apps.schedules.models import TripStatus
from apps.schedules.services import search_trips, seats_booked

from .conftest import booking_request, make_trip, new_key

pytestmark = pytest.mark.django_db


def test_create_booking_holds_seats_and_prices_server_side(trip):
    booking, token, created = create_booking(booking_request(trip, adults=2, children=1), idempotency_key=new_key())
    assert created
    assert booking.status == BookingStatus.HELD
    assert booking.hold_expires_at and booking.hold_expires_at > timezone.now()
    assert str(booking.total_amount) == "119.00"
    assert booking.is_paid is False
    assert booking.booking_reference.startswith("TB-")
    assert booking.access_token_hash == hash_token(token)
    assert token not in booking.access_token_hash
    assert seats_booked(trip) == 3
    assert booking.passengers.get().is_lead


def test_capacity_cannot_be_exceeded(routes):
    trip = make_trip(routes["out"], capacity=3)
    create_booking(booking_request(trip, adults=2), idempotency_key=new_key())
    with pytest.raises(InsufficientSeats):
        create_booking(booking_request(trip, adults=2), idempotency_key=new_key())
    create_booking(booking_request(trip, adults=1), idempotency_key=new_key())
    assert seats_booked(trip) == 3


def test_expired_holds_release_seats(routes):
    trip = make_trip(routes["out"], capacity=2)
    booking, _, _ = create_booking(booking_request(trip, adults=2), idempotency_key=new_key())
    Booking.objects.filter(pk=booking.pk).update(hold_expires_at=timezone.now() - timedelta(minutes=1))
    assert seats_booked(trip) == 0
    create_booking(booking_request(trip, adults=2), idempotency_key=new_key())
    assert expire_stale_holds() == 1
    booking.refresh_from_db()
    assert booking.status == BookingStatus.EXPIRED


def test_idempotent_replay_returns_same_booking_and_token(trip):
    key = new_key()
    b1, t1, c1 = create_booking(booking_request(trip, adults=2), idempotency_key=key)
    b2, t2, c2 = create_booking(booking_request(trip, adults=2), idempotency_key=key)
    assert (c1, c2) == (True, False)
    assert b1.pk == b2.pk and t1 == t2
    assert Booking.objects.count() == 1
    assert seats_booked(trip) == 2


def test_idempotency_key_reuse_with_different_body_conflicts(trip):
    key = new_key()
    create_booking(booking_request(trip, adults=2), idempotency_key=key)
    with pytest.raises(IdempotencyConflict):
        create_booking(booking_request(trip, adults=3), idempotency_key=key)


def test_round_trip_consumes_both_legs(trip, return_trip):
    booking, _, _ = create_booking(booking_request(trip, adults=2, return_trip=return_trip), idempotency_key=new_key())
    assert booking.trip_type == "ROUND_TRIP"
    assert seats_booked(trip) == 2
    assert seats_booked(return_trip) == 2
    remaining = {t.pk: getattr(t, "seats_remaining") for t in search_trips()}  # noqa: B009 - annotated field
    assert remaining[return_trip.pk] == return_trip.capacity - 2


def test_return_must_be_reverse_route(trip, routes):
    wrong = make_trip(routes["out"], days=3)
    with pytest.raises(InvalidTripSelection):
        create_booking(booking_request(trip, return_trip=wrong), idempotency_key=new_key())


def test_return_must_depart_after_outbound_arrival(routes):
    out = make_trip(routes["out"], days=3)
    back = make_trip(routes["back"], days=1)
    with pytest.raises(InvalidTripSelection):
        create_booking(booking_request(out, return_trip=back), idempotency_key=new_key())


def test_cannot_book_past_or_cancelled_trip(routes):
    past = make_trip(routes["out"], days=-1)
    with pytest.raises(InvalidTripSelection):
        create_booking(booking_request(past), idempotency_key=new_key())
    cancelled = make_trip(routes["out"], days=2)
    cancelled.status = TripStatus.CANCELLED
    cancelled.save()
    with pytest.raises(InvalidTripSelection):
        create_booking(booking_request(cancelled), idempotency_key=new_key())


def test_drop_off_only_location_cannot_be_pickup(routes):
    from_airport = make_trip(routes["from_airport"])
    with pytest.raises(InvalidTripSelection):
        create_booking(booking_request(from_airport), idempotency_key=new_key())
    to_airport = make_trip(routes["airport"])
    booking, _, _ = create_booking(booking_request(to_airport), idempotency_key=new_key())
    assert booking.pk


def test_passenger_limit(trip):
    with pytest.raises(DomainError):
        create_booking(booking_request(trip, adults=10, children=5), idempotency_key=new_key())


def test_state_machine_transitions(trip):
    booking, _, _ = create_booking(booking_request(trip), idempotency_key=new_key())
    booking = confirm_booking(booking)
    assert booking.status == BookingStatus.CONFIRMED and booking.confirmed_at
    booking = cancel_booking(booking)
    assert booking.status == BookingStatus.CANCELLED
    with pytest.raises(InvalidTransition):
        booking.transition_to(BookingStatus.CONFIRMED)
    assert seats_booked(trip) == 0


def test_cannot_confirm_lapsed_hold(trip):
    booking, _, _ = create_booking(booking_request(trip), idempotency_key=new_key())
    Booking.objects.filter(pk=booking.pk).update(hold_expires_at=timezone.now() - timedelta(seconds=1))
    with pytest.raises(ConflictError):
        confirm_booking(booking)
    booking.refresh_from_db()
    assert booking.status == BookingStatus.EXPIRED


def test_token_lookup(trip):
    booking, token, _ = create_booking(booking_request(trip), idempotency_key=new_key())
    assert get_booking_with_token(booking.booking_reference, token) == booking
    assert get_booking_with_token(booking.booking_reference.lower(), token) == booking
    assert get_booking_with_token(booking.booking_reference, "wrong") is None
    assert get_booking_with_token(booking.booking_reference, "") is None
    assert get_booking_with_token("TB-ZZZZZZ", token) is None


def test_db_constraint_rejects_inconsistent_passenger_sum(trip):
    booking, _, _ = create_booking(booking_request(trip, adults=2), idempotency_key=new_key())
    with pytest.raises(IntegrityError):
        Booking.objects.filter(pk=booking.pk).update(passenger_count=5)
