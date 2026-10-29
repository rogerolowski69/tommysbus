"""Seat inventory under real concurrent transactions (requires PostgreSQL)."""

import threading

import pytest
from django.db import connection, connections

from apps.bookings.models import Booking
from apps.bookings.services import InsufficientSeats, create_booking
from apps.schedules.services import seats_booked

from .conftest import booking_request, make_trip, new_key

pytestmark = pytest.mark.django_db(transaction=True)

WORKERS = 12


def _run_concurrently(fn, n: int) -> list[object]:
    barrier = threading.Barrier(n)
    results: list[object] = []
    lock = threading.Lock()

    def worker(i: int) -> None:
        try:
            barrier.wait()
            out: object = fn(i)
        except Exception as exc:  # noqa: BLE001
            out = exc
        finally:
            connections.close_all()
        with lock:
            results.append(out)

    threads = [threading.Thread(target=worker, args=(i,)) for i in range(n)]
    for t in threads:
        t.start()
    for t in threads:
        t.join(timeout=60)
    return results


def test_concurrent_bookings_never_oversell(routes):
    assert connection.vendor == "postgresql"
    trip = make_trip(routes["out"], capacity=5)

    results = _run_concurrently(
        lambda i: create_booking(booking_request(trip, adults=2), idempotency_key=new_key()), WORKERS
    )

    successes = [r for r in results if isinstance(r, tuple)]
    sold_out = [r for r in results if isinstance(r, InsufficientSeats)]
    unexpected = [r for r in results if not isinstance(r, tuple | InsufficientSeats)]
    assert not unexpected, unexpected
    assert len(successes) == 2  # 2 × 2 seats fit in 5; a third would oversell
    assert len(sold_out) == WORKERS - 2
    assert seats_booked(trip) == 4


def test_concurrent_round_trips_do_not_deadlock_or_oversell(routes):
    out = make_trip(routes["out"], capacity=6)
    back = make_trip(routes["back"], days=3, capacity=6)

    def book(i: int):
        # Alternate directions so lock acquisition order would conflict without ordering.
        a, b = (out, back) if i % 2 == 0 else (back, out)
        if a is back:
            # reverse direction booking: back then out (a later departure)
            later = make_trip(routes["out"], days=5 + i, capacity=6)
            return create_booking(booking_request(back, adults=1, return_trip=later), idempotency_key=new_key())
        return create_booking(booking_request(a, adults=1, return_trip=b), idempotency_key=new_key())

    results = _run_concurrently(book, WORKERS)
    assert all(isinstance(r, tuple | InsufficientSeats) for r in results), results
    assert seats_booked(out) <= 6
    assert seats_booked(back) <= 6


def test_concurrent_retries_with_same_key_create_one_booking(routes):
    trip = make_trip(routes["out"], capacity=10)
    key = new_key()
    results = _run_concurrently(lambda i: create_booking(booking_request(trip, adults=2), idempotency_key=key), 8)
    assert all(isinstance(r, tuple) for r in results), results
    assert len({r[0].pk for r in results if isinstance(r, tuple)}) == 1
    assert Booking.objects.count() == 1
    assert seats_booked(trip) == 2
