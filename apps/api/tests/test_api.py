import pytest
from django.core.cache import cache
from django.test import override_settings
from django.utils import timezone
from rest_framework.settings import api_settings

from apps.bookings.models import Booking
from apps.charters.models import CharterInquiry

from .conftest import make_trip, new_key

pytestmark = pytest.mark.django_db


def booking_payload(trip, **overrides):
    payload = {
        "trip_id": trip.pk,
        "adults": 2,
        "children": 1,
        "bags": 1,
        "full_name": "Demo Person",
        "email": "Demo@Example.com",
        "phone": "(386) 555-0100",
        "notes": "",
        "accept_terms": True,
    }
    payload.update(overrides)
    return payload


def post_booking(api, payload, key=None):
    return api.post("/api/v1/bookings/", payload, format="json", HTTP_IDEMPOTENCY_KEY=key or new_key())


def test_health(api):
    assert api.get("/healthz").json() == {"status": "ok"}
    assert api.get("/readyz").json()["database"] == "up"


def test_locations_and_routes(api, routes):
    locs = api.get("/api/v1/locations/").json()
    assert {loc["slug"] for loc in locs} == {"palatka", "orlando", "mco"}
    assert next(loc for loc in locs if loc["slug"] == "mco")["allows_pickup"] is False
    make_trip(routes["out"])
    data = api.get("/api/v1/routes/", {"search": "Orlando"}).json()
    out = next(r for r in data if r["slug"] == "palatka-to-orlando")
    assert out["adult_fare"] == "45.00" and out["child_fare"] == "29.00"
    assert len(out["departure_times"]) == 1


def test_trip_search_filters_and_availability(api, routes):
    t = make_trip(routes["out"])
    make_trip(routes["back"])
    resp = api.get(
        "/api/v1/trips/",
        {"origin": "palatka", "destination": "orlando", "date": timezone.localtime(t.departure_datetime).date()},
    )
    assert resp.status_code == 200
    rows = resp.json()
    assert [r["id"] for r in rows] == [t.pk]
    assert rows[0]["seats_remaining"] == 14
    assert rows[0]["adult_fare"] == "45.00"
    assert api.get("/api/v1/trips/", {"date": "not-a-date"}).status_code == 400


def test_fares_and_policy(api, routes):
    fares = api.get("/api/v1/fares/").json()
    assert len(fares) == 8
    adult_out = next(f for f in fares if f["route"]["slug"] == "palatka-to-orlando" and f["fare_type"] == "ADULT")
    assert adult_out["round_trip_amount"] == "81.00"  # (45 + 45) less 10% round-trip discount
    policy = api.get("/api/v1/pricing-policy/").json()
    assert policy["round_trip_discount_percent"] == "10.00"


def test_quote(api, trip, return_trip):
    resp = api.post(
        "/api/v1/quotes/", {"trip_id": trip.pk, "return_trip_id": return_trip.pk, "adults": 1}, format="json"
    )
    assert resp.status_code == 200, resp.json()
    assert resp.json()["total"] == "81.00"


def test_create_booking_ignores_client_totals(api, trip):
    resp = post_booking(api, booking_payload(trip, total_amount="0.01", status="CONFIRMED", is_paid=True))
    assert resp.status_code == 201, resp.json()
    body = resp.json()
    assert body["total_amount"] == "119.00"
    assert body["status"] == "HELD"
    assert body["is_paid"] is False and body["is_demo"] is True
    assert body["customer"]["email"] == "demo@example.com"
    assert len(body["access_token"]) == 64
    assert resp["Cache-Control"] == "no-store"


def test_booking_requires_idempotency_key_and_terms(api, trip):
    resp = api.post("/api/v1/bookings/", booking_payload(trip), format="json")
    assert resp.status_code == 400
    resp = post_booking(api, booking_payload(trip, accept_terms=False))
    assert resp.status_code == 400 and "accept_terms" in resp.json()
    resp = post_booking(api, booking_payload(trip, phone="123"))
    assert resp.status_code == 400 and "phone" in resp.json()
    assert Booking.objects.count() == 0


def test_idempotent_create_over_http(api, trip):
    key = new_key()
    r1 = post_booking(api, booking_payload(trip), key)
    r2 = post_booking(api, booking_payload(trip), key)
    assert (r1.status_code, r2.status_code) == (201, 200)
    assert r1.json()["reference"] == r2.json()["reference"]
    assert r1.json()["access_token"] == r2.json()["access_token"]
    r3 = post_booking(api, booking_payload(trip, adults=1), key)
    assert r3.status_code == 409


def test_sold_out_returns_409(api, routes):
    trip = make_trip(routes["out"], capacity=2)
    resp = post_booking(api, booking_payload(trip))
    assert resp.status_code == 409
    assert resp.json()["code"] == "insufficient_seats"


def test_booking_detail_requires_token(api, trip):
    created = post_booking(api, booking_payload(trip)).json()
    ref, token = created["reference"], created["access_token"]
    url = f"/api/v1/bookings/{ref}/"

    missing = api.get(url)
    wrong = api.get(url, HTTP_X_BOOKING_TOKEN="x" * 64)
    unknown = api.get("/api/v1/bookings/TB-ZZZZZZ/", HTTP_X_BOOKING_TOKEN=token)
    # Indistinguishable responses: no enumeration oracle, no PII.
    for r in (missing, wrong, unknown):
        assert r.status_code == 404
        assert r.json() == {"detail": "Booking not found.", "code": "not_found"}

    ok = api.get(url, HTTP_X_BOOKING_TOKEN=token)
    assert ok.status_code == 200
    assert ok.json()["customer"]["full_name"] == "Demo Person"
    assert "access_token" not in ok.json()
    assert api.get(f"/api/v1/bookings/{ref}/?token={token}").status_code == 404  # header only


def test_cancel_with_token_releases_seats(api, routes):
    trip = make_trip(routes["out"], capacity=3)
    created = post_booking(api, booking_payload(trip)).json()
    url = f"/api/v1/bookings/{created['reference']}/cancel/"
    assert api.post(url).status_code == 404
    resp = api.post(url, HTTP_X_BOOKING_TOKEN=created["access_token"])
    assert resp.status_code == 200 and resp.json()["status"] == "CANCELLED"
    assert post_booking(api, booking_payload(trip)).status_code == 201
    again = api.post(url, HTTP_X_BOOKING_TOKEN=created["access_token"])
    assert again.status_code == 409


def test_charter_inquiry(api):
    today = timezone.localdate()
    payload = {
        "contact_name": "Group Lead",
        "email": "lead@example.com",
        "phone": "352-555-0123",
        "origin": "Ocala",
        "destination": "Tampa",
        "passenger_count": 30,
        "travel_date": str(today),
        "message": "Demo",
    }
    resp = api.post("/api/v1/charter-inquiries/", payload, format="json")
    assert resp.status_code == 201
    assert CharterInquiry.objects.get().status == "NEW"
    bad = api.post(
        "/api/v1/charter-inquiries/",
        {**payload, "travel_date": str(today.replace(year=today.year - 1))},
        format="json",
    )
    assert bad.status_code == 400 and "travel_date" in bad.json()
    bad_return = api.post("/api/v1/charter-inquiries/", {**payload, "return_date": "2000-01-01"}, format="json")
    assert bad_return.status_code == 400 and "return_date" in bad_return.json()


def test_booking_create_is_rate_limited(api, trip, monkeypatch):
    rates = {**api_settings.DEFAULT_THROTTLE_RATES, "booking_create": "2/min"}
    from rest_framework.throttling import ScopedRateThrottle

    monkeypatch.setattr(ScopedRateThrottle, "THROTTLE_RATES", rates)
    cache.clear()
    codes = [post_booking(api, booking_payload(trip, adults=1, children=0)).status_code for _ in range(3)]
    assert codes == [201, 201, 429]


def test_openapi_schema(api):
    resp = api.get("/api/schema/", HTTP_ACCEPT="application/json")
    assert resp.status_code == 200
    assert b"/api/v1/bookings/" in resp.content


@override_settings(DEBUG=False)
def test_admin_requires_login(client):
    resp = client.get("/admin/")
    assert resp.status_code == 302 and "/login/" in resp["Location"]


def test_local_trip_and_hourly_requests(api):
    today = str(timezone.localdate())
    base = {
        "contact_name": "Rider Demo",
        "email": "rider@example.com",
        "phone": "386-555-0124",
        "origin": "Palatka",
        "passenger_count": 1,
        "travel_date": today,
    }
    medical = api.post(
        "/api/v1/charter-inquiries/",
        {**base, "service_type": "MEDICAL", "destination": "Gainesville", "pickup_time": "07:30"},
        format="json",
    )
    assert medical.status_code == 201
    hourly_missing = api.post(
        "/api/v1/charter-inquiries/", {**base, "service_type": "HOURLY", "destination": "Errands"}, format="json"
    )
    assert hourly_missing.status_code == 400 and "hours_requested" in hourly_missing.json()
    hourly = api.post(
        "/api/v1/charter-inquiries/",
        {**base, "service_type": "HOURLY", "destination": "Errands", "hours_requested": 3},
        format="json",
    )
    assert hourly.status_code == 201
    bad_type = api.post(
        "/api/v1/charter-inquiries/", {**base, "service_type": "LIMO", "destination": "X"}, format="json"
    )
    assert bad_type.status_code == 400
    kinds = set(CharterInquiry.objects.values_list("service_type", flat=True))
    assert kinds == {"MEDICAL", "HOURLY"}
    assert CharterInquiry.objects.get(service_type="MEDICAL").pickup_time.strftime("%H:%M") == "07:30"


def test_policy_exposes_hourly_rate(api, policy):
    body = api.get("/api/v1/pricing-policy/").json()
    assert body["hourly_rate"] == "85.00" and body["hourly_minimum_hours"] == 2
