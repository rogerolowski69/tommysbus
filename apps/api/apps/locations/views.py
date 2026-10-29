from rest_framework import generics

from apps.locations.models import Location
from apps.locations.serializers import LocationSerializer


class LocationListView(generics.ListAPIView):
    serializer_class = LocationSerializer
    queryset = Location.objects.filter(is_active=True)
    filterset_fields = ["city", "allows_pickup"]
    pagination_class = None
