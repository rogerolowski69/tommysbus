from rest_framework import serializers

from apps.locations.models import Location


class LocationSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = Location
        fields = ["id", "slug", "name", "city", "state"]


class LocationSerializer(serializers.ModelSerializer):
    map_url = serializers.CharField(read_only=True)

    class Meta:
        model = Location
        fields = [
            "id",
            "slug",
            "name",
            "city",
            "state",
            "address",
            "latitude",
            "longitude",
            "pickup_instructions",
            "allows_pickup",
            "map_url",
        ]
