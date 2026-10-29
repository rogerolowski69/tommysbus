"""Server-side fare calculation. The frontend never supplies prices."""

from dataclasses import dataclass, field
from decimal import ROUND_HALF_UP, Decimal

from apps.core.exceptions import DomainError
from apps.pricing.models import Fare, FareType, PricingPolicy
from apps.routes.models import Route

CENT = Decimal("0.01")


def money(value: Decimal) -> Decimal:
    return value.quantize(CENT, rounding=ROUND_HALF_UP)


class FareUnavailable(DomainError):
    default_detail = "No active fare is configured for this route."
    default_code = "fare_unavailable"


class BaggageLimitExceeded(DomainError):
    default_detail = "Too many bags for this number of passengers."
    default_code = "baggage_limit"


@dataclass(frozen=True)
class LineItem:
    label: str
    quantity: int
    unit_amount: Decimal
    amount: Decimal
    kind: str  # fare | discount | baggage

    def as_dict(self) -> dict[str, object]:
        return {
            "label": self.label,
            "quantity": self.quantity,
            "unit_amount": str(self.unit_amount),
            "amount": str(self.amount),
            "kind": self.kind,
        }


@dataclass
class Quote:
    currency: str
    line_items: list[LineItem] = field(default_factory=list)
    subtotal: Decimal = Decimal("0")
    discount: Decimal = Decimal("0")
    baggage: Decimal = Decimal("0")

    @property
    def total(self) -> Decimal:
        return money(self.subtotal - self.discount + self.baggage)


def get_active_policy() -> PricingPolicy:
    policy = PricingPolicy.objects.filter(is_active=True).order_by("-updated_at").first()
    # Fall back to model defaults so pricing works on an empty database.
    return policy or PricingPolicy()


def active_fares(route: Route) -> dict[str, Fare]:
    return {f.fare_type: f for f in Fare.objects.filter(route=route, is_active=True)}


def round_trip_price(route: Route, fare_type: str, policy: PricingPolicy | None = None) -> Decimal | None:
    """Price of one passenger travelling ``route`` and back, via the same rules as bookings."""
    reverse = Route.objects.filter(origin=route.destination, destination=route.origin, is_active=True).first()
    if reverse is None:
        return None
    try:
        quote = calculate_quote(
            outbound=route,
            inbound=reverse,
            adults=1 if fare_type == FareType.ADULT else 0,
            children=1 if fare_type == FareType.CHILD else 0,
            bags=0,
            policy=policy,
        )
    except FareUnavailable:
        return None
    return quote.total


def calculate_quote(
    *,
    outbound: Route,
    inbound: Route | None,
    adults: int,
    children: int,
    bags: int,
    policy: PricingPolicy | None = None,
) -> Quote:
    policy = policy or get_active_policy()
    passengers = adults + children
    if bags > passengers * policy.max_bags_per_passenger:
        raise BaggageLimitExceeded(
            f"A maximum of {policy.max_bags_per_passenger} checked bags per passenger is allowed."
        )

    legs = [("Outbound", outbound)] + ([("Return", inbound)] if inbound else [])
    quote = Quote(currency=policy.currency)

    for leg_label, route in legs:
        fares = active_fares(route)
        for fare_type, count in ((FareType.ADULT, adults), (FareType.CHILD, children)):
            if count == 0:
                continue
            fare = fares.get(fare_type)
            if fare is None:
                raise FareUnavailable(f"No active {fare_type.label} fare for {route.name}.")
            amount = money(fare.amount * count)
            quote.line_items.append(
                LineItem(f"{leg_label} · {route.name} · {fare_type.label}", count, fare.amount, amount, "fare")
            )
            quote.subtotal += amount

    if inbound and policy.round_trip_discount_percent:
        rt = money(quote.subtotal * policy.round_trip_discount_percent / 100)
        quote.line_items.append(
            LineItem(f"Round-trip discount ({policy.round_trip_discount_percent}%)", 1, -rt, -rt, "discount")
        )
        quote.discount += rt
    if passengers >= policy.group_min_passengers and policy.group_discount_percent:
        grp = money(quote.subtotal * policy.group_discount_percent / 100)
        quote.line_items.append(
            LineItem(
                f"Group rate ({policy.group_min_passengers}+ passengers, {policy.group_discount_percent}%)",
                1,
                -grp,
                -grp,
                "discount",
            )
        )
        quote.discount += grp
    quote.discount = min(quote.discount, quote.subtotal)

    extra_bags = max(0, bags - passengers * policy.free_bags_per_passenger)
    if extra_bags:
        fee = money(policy.extra_bag_fee * extra_bags * len(legs))
        quote.line_items.append(
            LineItem(
                f"Additional checked bags ({extra_bags} × {len(legs)} leg{'s' if len(legs) > 1 else ''})",
                extra_bags * len(legs),
                policy.extra_bag_fee,
                fee,
                "baggage",
            )
        )
        quote.baggage = fee

    quote.subtotal = money(quote.subtotal)
    quote.discount = money(quote.discount)
    return quote
