from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from apps.pricing.models import Fare, PricingPolicy
from apps.pricing.services import round_trip_price


class FareRouteSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    slug = serializers.CharField()
    name = serializers.CharField()
    origin_city = serializers.CharField(source="origin.city")
    destination_city = serializers.CharField(source="destination.city")


class FareSerializer(serializers.ModelSerializer):
    route = FareRouteSerializer(read_only=True)
    fare_type_label = serializers.CharField(source="get_fare_type_display", read_only=True)
    round_trip_amount = serializers.SerializerMethodField()

    class Meta:
        model = Fare
        fields = ["id", "route", "fare_type", "fare_type_label", "amount", "round_trip_amount", "currency"]

    @extend_schema_field(serializers.DecimalField(max_digits=10, decimal_places=2, allow_null=True))
    def get_round_trip_amount(self, obj: Fare) -> str | None:
        """Per-passenger price for this route and its reverse, round-trip discount applied."""
        amount = round_trip_price(obj.route, obj.fare_type, self.context.get("policy"))
        return None if amount is None else f"{amount:.2f}"


class PricingPolicySerializer(serializers.ModelSerializer):
    class Meta:
        model = PricingPolicy
        fields = [
            "round_trip_discount_percent",
            "group_min_passengers",
            "group_discount_percent",
            "free_bags_per_passenger",
            "extra_bag_fee",
            "max_bags_per_passenger",
            "hourly_rate",
            "hourly_minimum_hours",
            "currency",
        ]


class LineItemSerializer(serializers.Serializer):
    label = serializers.CharField()  # pyright: ignore[reportAssignmentType] - shadows Field.label in stubs
    quantity = serializers.IntegerField()
    unit_amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    kind = serializers.ChoiceField(choices=["fare", "discount", "baggage"])


class QuoteRequestSerializer(serializers.Serializer):
    trip_id = serializers.IntegerField(min_value=1)
    return_trip_id = serializers.IntegerField(min_value=1, required=False, allow_null=True)
    adults = serializers.IntegerField(min_value=1, max_value=14)
    children = serializers.IntegerField(min_value=0, max_value=13, default=0)
    bags = serializers.IntegerField(min_value=0, max_value=60, default=0)


class QuoteSerializer(serializers.Serializer):
    currency = serializers.CharField()
    line_items = LineItemSerializer(many=True)
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2)
    discount = serializers.DecimalField(max_digits=10, decimal_places=2)
    baggage = serializers.DecimalField(max_digits=10, decimal_places=2)
    total = serializers.DecimalField(max_digits=10, decimal_places=2)


def fare_amount(fares: list[Fare], fare_type: str) -> str | None:
    """Active fare for ``fare_type`` as a fixed-point string (matches DecimalField output)."""
    for f in fares:
        if f.fare_type == fare_type and f.is_active:
            return f"{f.amount:.2f}"
    return None
