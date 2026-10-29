import uuid
from datetime import timedelta
from decimal import Decimal

import pytest
from django.core.cache import cache
from django.utils import timezone
from rest_framework.test import APIClient

from apps.bookings.services import BookingRequest, TripSelection
from apps.locations.models import Location
from apps.pricing.models import Fare, FareType, PricingPolicy
from apps.routes.models import Route
from apps.schedules.models import Trip


@pytest.fixture(autouse=True)
def _clear_cache():
    cache.clear()  # throttle counters
    yield
    cache.clear()


@pytest.fixture
def api() -> APIClient:
    return APIClient()


def make_location(slug: str, city: str, **kw) -> Location:
    return Location.objects.create(
        slug=slug,
        name=f"{city} Stop",
        city=city,
        address=f"{city} demo address",
        latitude=Decimal("29.0"),
        longitude=Decimal("-81.0"),
        **kw,
    )


@pytest.fixture
def locations() -> dict[str, Location]:
    return {
        "palatka": make_location("palatka", "Palatka"),
        "orlando": make_location("orlando", "Orlando"),
        "mco": make_location("mco", "MCO", allows_pickup=False),
    }


def make_route(o: Location, d: Location, adult: str = "45.00", child: str = "29.00") -> Route:
    route = Route.objects.create(
        origin=o,
        destination=d,
        name=f"{o.city} → {d.city}",
        slug=f"{o.slug}-to-{d.slug}",
        estimated_duration_minutes=120,
    )
    Fare.objects.create(route=route, fare_type=FareType.ADULT, amount=Decimal(adult))
    Fare.objects.create(route=route, fare_type=FareType.CHILD, amount=Decimal(child))
    return route


@pytest.fixture
def policy() -> PricingPolicy:
    return PricingPolicy.objects.create()


@pytest.fixture
def routes(locations, policy) -> dict[str, Route]:
    return {
        "out": make_route(locations["palatka"], locations["orlando"]),
        "back": make_route(locations["orlando"], locations["palatka"]),
        "airport": make_route(locations["palatka"], locations["mco"], "49.00", "32.00"),
        "from_airport": make_route(locations["mco"], locations["palatka"], "49.00", "32.00"),
    }


def make_trip(route: Route, *, days: float = 1, capacity: int = 14) -> Trip:
    dep = timezone.now() + timedelta(days=days)
    return Trip.objects.create(
        route=route, departure_datetime=dep, arrival_datetime=dep + timedelta(minutes=120), capacity=capacity
    )


@pytest.fixture
def trip(routes) -> Trip:
    return make_trip(routes["out"])


@pytest.fixture
def return_trip(routes) -> Trip:
    return make_trip(routes["back"], days=3)


def booking_request(trip: Trip, *, adults: int = 1, children: int = 0, bags: int = 0, return_trip=None, **kw):
    return BookingRequest(
        selection=TripSelection(
            trip_id=trip.pk,
            return_trip_id=return_trip.pk if return_trip else None,
            adults=adults,
            children=children,
            bags=bags,
        ),
        customer_name=kw.get("name", "Demo Person"),
        customer_email=kw.get("email", "demo@example.com"),
        customer_phone=kw.get("phone", "3865550100"),
    )


def new_key() -> str:
    return str(uuid.uuid4())
