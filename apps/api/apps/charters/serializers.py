from django.utils import timezone
from rest_framework import serializers

from apps.charters.models import ServiceType
from apps.core.validators import validate_person_name, validate_phone


class CharterInquiryCreateSerializer(serializers.Serializer):
    service_type = serializers.ChoiceField(choices=ServiceType.choices, default=ServiceType.CHARTER)
    contact_name = serializers.CharField(max_length=120, validators=[validate_person_name])
    email = serializers.EmailField(max_length=254)
    phone = serializers.CharField(max_length=20, validators=[validate_phone])
    origin = serializers.CharField(max_length=120)
    destination = serializers.CharField(max_length=120)
    passenger_count = serializers.IntegerField(min_value=1, max_value=250)
    travel_date = serializers.DateField()
    return_date = serializers.DateField(required=False, allow_null=True)
    pickup_time = serializers.TimeField(required=False, allow_null=True)
    hours_requested = serializers.IntegerField(required=False, allow_null=True, min_value=1, max_value=12)
    message = serializers.CharField(max_length=2000, required=False, allow_blank=True, default="")

    def validate_travel_date(self, value):  # type: ignore[no-untyped-def]
        if value < timezone.localdate():
            raise serializers.ValidationError("Travel date cannot be in the past.")
        return value

    def validate(self, attrs: dict) -> dict:  # type: ignore[type-arg]
        ret = attrs.get("return_date")
        if ret and ret < attrs["travel_date"]:
            raise serializers.ValidationError({"return_date": "Return date must be on or after the travel date."})
        if attrs.get("service_type") == ServiceType.HOURLY and not attrs.get("hours_requested"):
            raise serializers.ValidationError({"hours_requested": "Tell us how many hours you need."})
        return attrs


class CharterInquiryReceiptSerializer(serializers.Serializer):
    status = serializers.CharField()
    detail = serializers.CharField()
