from rest_framework import serializers

from apps.bookings.models import Booking
from apps.core.validators import validate_person_name, validate_phone
from apps.pricing.serializers import LineItemSerializer
from apps.routes.serializers import RouteSummarySerializer
from apps.schedules.models import Trip


class BookingCreateSerializer(serializers.Serializer):
    """Client input. Prices/totals are never accepted; any such fields are ignored."""

    trip_id = serializers.IntegerField(min_value=1)
    return_trip_id = serializers.IntegerField(min_value=1, required=False, allow_null=True)
    adults = serializers.IntegerField(min_value=1, max_value=14)
    children = serializers.IntegerField(min_value=0, max_value=13, default=0)
    bags = serializers.IntegerField(min_value=0, max_value=60, default=0)
    full_name = serializers.CharField(max_length=120, validators=[validate_person_name])
    email = serializers.EmailField(max_length=254)
    phone = serializers.CharField(max_length=20, validators=[validate_phone])
    notes = serializers.CharField(max_length=1000, required=False, allow_blank=True, default="")
    accept_terms = serializers.BooleanField()

    def validate_accept_terms(self, value: bool) -> bool:
        if not value:
            raise serializers.ValidationError("You must accept the demo terms to continue.")
        return value


class TripLegSerializer(serializers.ModelSerializer):
    route = RouteSummarySerializer(read_only=True)

    class Meta:
        model = Trip
        fields = ["id", "route", "departure_datetime", "arrival_datetime", "status"]


class BookingCustomerSerializer(serializers.Serializer):
    full_name = serializers.CharField(source="customer_name")
    email = serializers.EmailField(source="customer_email")
    phone = serializers.CharField(source="customer_phone")


class BookingDetailSerializer(serializers.ModelSerializer):
    reference = serializers.CharField(source="booking_reference", read_only=True)
    status_label = serializers.CharField(source="get_status_display", read_only=True)
    trip = TripLegSerializer(read_only=True)
    return_trip = TripLegSerializer(read_only=True, allow_null=True)
    customer = BookingCustomerSerializer(source="*", read_only=True)
    line_items = LineItemSerializer(source="price_breakdown", many=True, read_only=True)

    class Meta:
        model = Booking
        fields = [
            "reference",
            "status",
            "status_label",
            "trip_type",
            "trip",
            "return_trip",
            "adult_count",
            "child_count",
            "passenger_count",
            "bag_count",
            "line_items",
            "subtotal_amount",
            "discount_amount",
            "baggage_amount",
            "total_amount",
            "currency",
            "customer",
            "notes",
            "is_demo",
            "is_paid",
            "hold_expires_at",
            "created_at",
        ]
        read_only_fields = fields


class BookingCreatedSerializer(BookingDetailSerializer):
    access_token = serializers.CharField(
        read_only=True, help_text="Secret required to view or cancel this booking. Shown only to the creator."
    )

    class Meta(BookingDetailSerializer.Meta):
        fields = [*BookingDetailSerializer.Meta.fields, "access_token"]
        read_only_fields = fields
