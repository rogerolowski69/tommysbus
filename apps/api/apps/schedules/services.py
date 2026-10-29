"""Trip search and seat-availability queries."""

from datetime import date, datetime, time, timedelta

from django.conf import settings
from django.db.models import IntegerField, OuterRef, Q, QuerySet, Subquery, Sum, Value
from django.db.models.functions import Coalesce
from django.utils import timezone

from apps.schedules.models import Trip, TripStatus


def seat_consuming_q(prefix: str = "") -> Q:
    """Bookings that occupy seats: CONFIRMED, or HELD with an unexpired hold."""
    from apps.bookings.models import BookingStatus

    now = timezone.now()
    return Q(**{f"{prefix}status": BookingStatus.CONFIRMED}) | Q(
        **{f"{prefix}status": BookingStatus.HELD, f"{prefix}hold_expires_at__gt": now}
    )


def _seats_subquery(field: str) -> Coalesce:
    from apps.bookings.models import Booking

    sub = (
        Booking.objects.filter(seat_consuming_q(), **{field: OuterRef("pk")})
        .order_by()
        .values(field)
        .annotate(total=Sum("passenger_count"))
        .values("total")
    )
    return Coalesce(Subquery(sub, output_field=IntegerField()), Value(0))


def with_availability(qs: QuerySet[Trip]) -> QuerySet[Trip]:
    """Annotate ``seats_booked`` and ``seats_remaining`` (outbound + return legs)."""
    return (
        qs.annotate(
            seats_booked_out=_seats_subquery("trip"),
            seats_booked_return=_seats_subquery("return_trip"),
        )
        .annotate(
            seats_booked=Coalesce("seats_booked_out", 0) + Coalesce("seats_booked_return", 0),
        )
        .annotate(seats_remaining=Coalesce("capacity", 0) - Coalesce("seats_booked", 0))
    )


def seats_booked(trip: Trip) -> int:
    """Exact seat count for one trip. Call inside a transaction after locking the trip row."""
    from apps.bookings.models import Booking

    out = Booking.objects.filter(seat_consuming_q(), trip=trip).aggregate(n=Sum("passenger_count"))["n"] or 0
    ret = Booking.objects.filter(seat_consuming_q(), return_trip=trip).aggregate(n=Sum("passenger_count"))["n"] or 0
    return int(out) + int(ret)


def bookable_trips() -> QuerySet[Trip]:
    return Trip.objects.filter(
        status=TripStatus.SCHEDULED,
        route__is_active=True,
        route__origin__is_active=True,
        route__destination__is_active=True,
        departure_datetime__gt=timezone.now(),
    )


def search_trips(
    *,
    origin: str | None = None,
    destination: str | None = None,
    on_date: date | None = None,
    min_seats: int | None = None,
) -> QuerySet[Trip]:
    qs = bookable_trips().select_related("route__origin", "route__destination").prefetch_related("route__fares")
    if origin:
        qs = qs.filter(route__origin__slug=origin)
    if destination:
        qs = qs.filter(route__destination__slug=destination)

    tz = timezone.get_current_timezone()
    if on_date:
        start = timezone.make_aware(datetime.combine(on_date, time.min), tz)
        qs = qs.filter(departure_datetime__gte=start, departure_datetime__lt=start + timedelta(days=1))
    else:
        horizon = timezone.now() + timedelta(days=7)
        qs = qs.filter(departure_datetime__lt=horizon)

    max_date = timezone.localdate() + timedelta(days=settings.BOOKING_SEARCH_WINDOW_DAYS)
    qs = qs.filter(departure_datetime__date__lte=max_date)

    qs = with_availability(qs).order_by("departure_datetime")
    if min_seats:
        qs = qs.filter(seats_remaining__gte=min_seats)
    return qs
