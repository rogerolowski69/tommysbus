from decimal import Decimal

import pytest

from apps.pricing.models import Fare, FareType
from apps.pricing.services import BaggageLimitExceeded, FareUnavailable, calculate_quote

pytestmark = pytest.mark.django_db


def test_one_way_adults_and_children(routes):
    q = calculate_quote(outbound=routes["out"], inbound=None, adults=2, children=1, bags=0)
    assert q.subtotal == Decimal("119.00")
    assert q.discount == 0
    assert q.total == Decimal("119.00")


def test_round_trip_discount_applies_to_both_legs(routes):
    q = calculate_quote(outbound=routes["out"], inbound=routes["back"], adults=1, children=0, bags=0)
    assert q.subtotal == Decimal("90.00")
    assert q.discount == Decimal("9.00")  # 10% demo policy
    assert q.total == Decimal("81.00")


def test_group_rate_kicks_in_at_threshold(routes):
    q5 = calculate_quote(outbound=routes["out"], inbound=None, adults=5, children=0, bags=0)
    q6 = calculate_quote(outbound=routes["out"], inbound=None, adults=6, children=0, bags=0)
    assert q5.discount == 0
    assert q6.discount == Decimal("27.00")
    assert q6.total == Decimal("243.00")


def test_extra_bags_charged_per_leg(routes):
    q = calculate_quote(outbound=routes["out"], inbound=routes["back"], adults=1, children=0, bags=3)
    # 1 free bag per passenger → 2 extra bags × 2 legs × $10
    assert q.baggage == Decimal("40.00")


def test_bag_limit_enforced(routes):
    with pytest.raises(BaggageLimitExceeded):
        calculate_quote(outbound=routes["out"], inbound=None, adults=1, children=0, bags=4)


def test_missing_fare_raises(routes):
    Fare.objects.filter(route=routes["out"], fare_type=FareType.CHILD).update(is_active=False)
    with pytest.raises(FareUnavailable):
        calculate_quote(outbound=routes["out"], inbound=None, adults=1, children=1, bags=0)
