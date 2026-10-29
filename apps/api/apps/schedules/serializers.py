from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from apps.pricing.models import FareType
from apps.pricing.serializers import fare_amount
from apps.routes.serializers import RouteSummarySerializer
from apps.schedules.models import Trip


class TripSearchSerializer(serializers.Serializer):
    origin = serializers.SlugField(required=False)
    destination = serializers.SlugField(required=False)
    date = serializers.DateField(required=False)
    passengers = serializers.IntegerField(required=False, min_value=1, max_value=14)


class TripSerializer(serializers.ModelSerializer):
    route = RouteSummarySerializer(read_only=True)
    duration_minutes = serializers.IntegerField(read_only=True)
    seats_remaining = serializers.SerializerMethodField()
    adult_fare = serializers.SerializerMethodField()
    child_fare = serializers.SerializerMethodField()
    currency = serializers.SerializerMethodField()

    class Meta:
        model = Trip
        fields = [
            "id",
            "route",
            "departure_datetime",
            "arrival_datetime",
            "duration_minutes",
            "capacity",
            "seats_remaining",
            "status",
            "adult_fare",
            "child_fare",
            "currency",
        ]

    def get_seats_remaining(self, obj: Trip) -> int:
        return max(0, int(getattr(obj, "seats_remaining", obj.capacity)))

    @extend_schema_field(serializers.DecimalField(max_digits=8, decimal_places=2, allow_null=True))
    def get_adult_fare(self, obj: Trip) -> str | None:
        return fare_amount(list(obj.route.fares.all()), FareType.ADULT)

    @extend_schema_field(serializers.DecimalField(max_digits=8, decimal_places=2, allow_null=True))
    def get_child_fare(self, obj: Trip) -> str | None:
        return fare_amount(list(obj.route.fares.all()), FareType.CHILD)

    def get_currency(self, obj: Trip) -> str:
        return "USD"
