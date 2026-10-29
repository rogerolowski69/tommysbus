from rest_framework import serializers

from apps.customers.normalize import normalize_phone


def validate_phone(value: str) -> None:
    digits = normalize_phone(value).lstrip("+")
    if not 10 <= len(digits) <= 15:
        raise serializers.ValidationError("Enter a valid phone number (10–15 digits).")


def validate_person_name(value: str) -> None:
    if len(value.strip()) < 2:
        raise serializers.ValidationError("Enter a full name.")
    if any(ch in value for ch in "<>{}"):
        raise serializers.ValidationError("Name contains invalid characters.")
