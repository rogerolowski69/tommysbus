from django.db.models import QuerySet
from drf_spectacular.utils import extend_schema
from rest_framework import generics

from apps.schedules.models import Trip
from apps.schedules.serializers import TripSearchSerializer, TripSerializer
from apps.schedules.services import search_trips


@extend_schema(parameters=[TripSearchSerializer])
class TripListView(generics.ListAPIView):
    """Upcoming bookable departures with live seat availability and fares.

    Without ``date`` the next 7 days are returned.
    """

    serializer_class = TripSerializer
    filter_backends: list[type] = []
    pagination_class = None

    def get_queryset(self) -> QuerySet[Trip]:
        params = TripSearchSerializer(data=self.request.query_params)
        params.is_valid(raise_exception=True)
        d = params.validated_data
        return search_trips(
            origin=d.get("origin"),
            destination=d.get("destination"),
            on_date=d.get("date"),
            min_seats=d.get("passengers"),
        )
