from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from apps.locations.serializers import LocationSummarySerializer
from apps.pricing.models import FareType
from apps.pricing.serializers import fare_amount
from apps.routes.models import Route


class RouteSummarySerializer(serializers.ModelSerializer):
    origin = LocationSummarySerializer(read_only=True)
    destination = LocationSummarySerializer(read_only=True)

    class Meta:
        model = Route
        fields = ["id", "slug", "name", "origin", "destination", "estimated_duration_minutes"]


class RouteSerializer(RouteSummarySerializer):
    adult_fare = serializers.SerializerMethodField()
    child_fare = serializers.SerializerMethodField()
    departure_times = serializers.SerializerMethodField()

    class Meta(RouteSummarySerializer.Meta):
        fields = [*RouteSummarySerializer.Meta.fields, "description", "adult_fare", "child_fare", "departure_times"]

    @extend_schema_field(serializers.DecimalField(max_digits=8, decimal_places=2, allow_null=True))
    def get_adult_fare(self, obj: Route) -> str | None:
        return fare_amount(list(obj.fares.all()), FareType.ADULT)

    @extend_schema_field(serializers.DecimalField(max_digits=8, decimal_places=2, allow_null=True))
    def get_child_fare(self, obj: Route) -> str | None:
        return fare_amount(list(obj.fares.all()), FareType.CHILD)

    @extend_schema_field(serializers.ListField(child=serializers.CharField()))
    def get_departure_times(self, obj: Route) -> list[str]:
        """Typical local departure times (HH:MM), derived from upcoming scheduled trips."""
        times: dict[int, list[str]] = self.context.get("departure_times", {})
        return times.get(obj.pk, [])
