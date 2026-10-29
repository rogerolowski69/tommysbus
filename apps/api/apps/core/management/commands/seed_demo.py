"""Seed clearly-labelled DEMONSTRATION data. Nothing here describes a real, active service.

uv run python manage.py seed_demo            # idempotent: adds missing rows
uv run python manage.py seed_demo --reset    # wipes bookings/trips/fares/routes/locations first
"""

import uuid
from datetime import datetime, time, timedelta
from decimal import Decimal
from typing import Any

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from apps.bookings.models import Booking
from apps.bookings.services import BookingRequest, TripSelection, confirm_booking, create_booking
from apps.charters.models import CharterInquiry
from apps.locations.models import Location
from apps.pricing.models import Fare, FareType, PricingPolicy
from apps.routes.models import Route
from apps.schedules.models import Trip

DEMO = "DEMO placeholder — pending operator validation."

LOCATIONS: list[dict[str, Any]] = [
    {
        "slug": "palatka",
        "name": "Palatka Downtown Stop",
        "city": "Palatka",
        "address": "Placeholder stop — downtown Palatka, FL 32177 (DEMO)",
        "latitude": "29.648600",
        "longitude": "-81.637600",
        "pickup_instructions": "Placeholder: wait at the marked curb 10 minutes before departure. " + DEMO,
    },
    {
        "slug": "ocala",
        "name": "Ocala Downtown Stop",
        "city": "Ocala",
        "address": "Placeholder stop — downtown Ocala, FL 34471 (DEMO)",
        "latitude": "29.187200",
        "longitude": "-82.140100",
        "pickup_instructions": "Placeholder: look for the Tommy's Bus sign near the main entrance. " + DEMO,
    },
    {
        "slug": "orlando",
        "name": "Orlando Downtown Stop",
        "city": "Orlando",
        "address": "Placeholder stop — downtown Orlando, FL 32801 (DEMO)",
        "latitude": "28.538400",
        "longitude": "-81.378900",
        "pickup_instructions": "Placeholder: board at the designated passenger loading zone. " + DEMO,
    },
    {
        "slug": "mco",
        "name": "Orlando International Airport (MCO) area — drop-off only",
        "city": "Orlando",
        "address": "Placeholder drop-off point near MCO, Orlando, FL 32827 (DEMO)",
        "latitude": "28.431200",
        "longitude": "-81.308100",
        "allows_pickup": False,
        "pickup_instructions": "Drop-off only. Airport pickups are NOT offered: no airport ground-transportation "
        "authorization is held. " + DEMO,
    },
]

# (origin, destination, minutes, adult, child, departure times)
ROUTES: list[tuple[str, str, int, str, str, list[str]]] = [
    ("palatka", "ocala", 80, "29.00", "19.00", ["06:30", "12:00", "16:30"]),
    ("ocala", "palatka", 80, "29.00", "19.00", ["08:30", "14:00", "18:30"]),
    ("palatka", "orlando", 120, "45.00", "29.00", ["05:30", "09:30", "14:30"]),
    ("orlando", "palatka", 120, "45.00", "29.00", ["08:30", "13:00", "18:00"]),
    ("ocala", "orlando", 95, "35.00", "22.00", ["06:00", "10:00", "15:00"]),
    ("orlando", "ocala", 95, "35.00", "22.00", ["09:00", "13:30", "18:30"]),
    ("palatka", "mco", 135, "49.00", "32.00", ["04:45", "11:00"]),
    ("ocala", "mco", 110, "39.00", "25.00", ["05:00", "12:30"]),
]

DEMO_CUSTOMERS = [
    ("Avery Demo-Lopez", 1, 0, 1),
    ("Jordan Sample", 2, 1, 2),
    ("Casey Placeholder", 1, 0, 0),
    ("Riley Testcase", 3, 2, 4),
    ("Morgan Example", 1, 1, 2),
    ("Quinn Fictional", 6, 0, 6),
    ("Taylor Mockup", 2, 0, 3),
    ("Drew Demonstration", 1, 0, 1),
]

CAPACITY = 14  # demo vehicle capacity (e.g. a 15-passenger van minus driver)
DAYS = 21


class Command(BaseCommand):
    help = "Seed fictional demo locations, routes, fares, trips, bookings and charter inquiries."

    def add_arguments(self, parser: Any) -> None:
        parser.add_argument("--reset", action="store_true", help="Delete existing demo data first.")
        parser.add_argument("--days", type=int, default=DAYS)

    @transaction.atomic
    def handle(self, *args: Any, **opts: Any) -> None:
        if opts["reset"]:
            Booking.objects.all().delete()
            CharterInquiry.objects.all().delete()
            Trip.objects.all().delete()
            Fare.objects.all().delete()
            Route.objects.all().delete()
            Location.objects.all().delete()
            PricingPolicy.objects.all().delete()
            self.stdout.write("Cleared existing data.")

        PricingPolicy.objects.get_or_create(is_active=True, defaults={"name": "Demo pricing policy"})

        locs = {}
        for data in LOCATIONS:
            data = dict(data)
            slug = data.pop("slug")
            locs[slug], _ = Location.objects.update_or_create(slug=slug, defaults=data)

        tz = timezone.get_current_timezone()
        today = timezone.localdate()
        trips_created = 0
        for origin, dest, minutes, adult, child, times in ROUTES:
            o, d = locs[origin], locs[dest]
            route, _ = Route.objects.update_or_create(
                origin=o,
                destination=d,
                defaults={
                    "name": f"{o.city} → {'Orlando Airport (MCO area)' if dest == 'mco' else d.city}",
                    "slug": f"{origin}-to-{dest}",
                    "estimated_duration_minutes": minutes,
                    "description": f"Demo scheduled service. {DEMO}",
                },
            )
            for fare_type, amount in ((FareType.ADULT, adult), (FareType.CHILD, child)):
                Fare.objects.update_or_create(
                    route=route, fare_type=fare_type, is_active=True, defaults={"amount": Decimal(amount)}
                )
            for day in range(opts["days"]):
                for hhmm in times:
                    h, m = map(int, hhmm.split(":"))
                    dep = timezone.make_aware(datetime.combine(today + timedelta(days=day), time(h, m)), tz)
                    _, created = Trip.objects.get_or_create(
                        route=route,
                        departure_datetime=dep,
                        defaults={"arrival_datetime": dep + timedelta(minutes=minutes), "capacity": CAPACITY},
                    )
                    trips_created += created

        bookings = self._seed_bookings()
        charters = self._seed_charters(today)
        self.stdout.write(
            self.style.SUCCESS(
                f"Demo data ready: {len(locs)} locations, {len(ROUTES)} routes, {trips_created} new trips, "
                f"{bookings} new bookings, {charters} new charter inquiries. All values are fictional."
            )
        )

    def _seed_bookings(self) -> int:
        if Booking.objects.exists():
            return 0
        now = timezone.now()
        created = 0
        routes = list(Route.objects.filter(destination__allows_pickup=True).order_by("pk"))
        for i, (name, adults, children, bags) in enumerate(DEMO_CUSTOMERS):
            route = routes[i % len(routes)]
            trip = (
                Trip.objects.filter(route=route, departure_datetime__gt=now + timedelta(days=1 + i % 3))
                .order_by("departure_datetime")
                .first()
            )
            if trip is None:
                continue
            return_trip = None
            if i % 3 == 1:
                return_trip = (
                    Trip.objects.filter(
                        route__origin=route.destination,
                        route__destination=route.origin,
                        departure_datetime__gt=trip.arrival_datetime + timedelta(days=2),
                    )
                    .order_by("departure_datetime")
                    .first()
                )
            slug = name.lower().replace(" ", ".")
            booking, _, _ = create_booking(
                BookingRequest(
                    selection=TripSelection(
                        trip_id=trip.pk,
                        return_trip_id=return_trip.pk if return_trip else None,
                        adults=adults,
                        children=children,
                        bags=bags,
                    ),
                    customer_name=name,
                    customer_email=f"{slug}@example.com",
                    customer_phone=f"(386) 555-01{i:02d}",
                    notes="DEMO booking — fictional passenger.",
                ),
                idempotency_key=str(uuid.uuid4()),
            )
            if i % 2 == 0:
                confirm_booking(booking)
            else:  # keep demo holds visible in admin for a week
                Booking.objects.filter(pk=booking.pk).update(hold_expires_at=now + timedelta(days=7))
            created += 1
        return created

    def _seed_charters(self, today: Any) -> int:
        if CharterInquiry.objects.exists():
            return 0
        CharterInquiry.objects.create(
            contact_name="Sam Placeholder",
            email="sam.placeholder@example.com",
            phone="3865550150",
            origin="Palatka",
            destination="St. Augustine",
            passenger_count=22,
            travel_date=today + timedelta(days=30),
            message="DEMO inquiry — fictional church group outing.",
        )
        CharterInquiry.objects.create(
            contact_name="Lee Example",
            email="lee.example@example.com",
            phone="3525550151",
            origin="Ocala",
            destination="Gainesville",
            passenger_count=12,
            travel_date=today + timedelta(days=45),
            return_date=today + timedelta(days=46),
            message="DEMO inquiry — fictional team trip.",
        )
        CharterInquiry.objects.create(
            service_type="MEDICAL",
            contact_name="Pat Placeholder",
            email="pat.placeholder@example.com",
            phone="3865550152",
            origin="Palatka",
            destination="Gainesville (medical appointment)",
            passenger_count=2,
            travel_date=today + timedelta(days=5),
            pickup_time=time(7, 30),
            return_date=today + timedelta(days=5),
            message="DEMO request — fictional rider and companion, return same day.",
        )
        CharterInquiry.objects.create(
            service_type="GROCERY_PHARMACY",
            contact_name="Robin Sample",
            email="robin.sample@example.com",
            phone="3865550153",
            origin="Interlachen",
            destination="Palatka (grocery & pharmacy)",
            passenger_count=1,
            travel_date=today + timedelta(days=2),
            pickup_time=time(10, 0),
            message="DEMO request.",
        )
        CharterInquiry.objects.create(
            service_type="HOURLY",
            contact_name="Jamie Example",
            email="jamie.example@example.com",
            phone="3865550154",
            origin="Crescent City",
            destination="Errands around Palatka",
            passenger_count=3,
            travel_date=today + timedelta(days=9),
            pickup_time=time(9, 0),
            hours_requested=3,
            message="DEMO request.",
        )
        return 5
