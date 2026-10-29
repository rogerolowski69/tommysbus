from datetime import timedelta
from typing import Any

from django.db.models import QuerySet
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, generics

from apps.routes.models import Route
from apps.routes.serializers import RouteSerializer
from apps.schedules.services import bookable_trips


class RouteListView(generics.ListAPIView):
    serializer_class = RouteSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = {"origin__slug": ["exact"], "destination__slug": ["exact"]}
    search_fields = ["name", "origin__city", "destination__city", "origin__name", "destination__name"]
    pagination_class = None

    def get_queryset(self) -> QuerySet[Route]:
        return (
            Route.objects.filter(is_active=True, origin__is_active=True, destination__is_active=True)
            .select_related("origin", "destination")
            .prefetch_related("fares")
        )

    def get_serializer_context(self) -> dict[str, Any]:
        ctx = dict(super().get_serializer_context())
        horizon = timezone.now() + timedelta(days=7)
        times: dict[int, set[str]] = {}
        for route_id, dep in (
            bookable_trips().filter(departure_datetime__lt=horizon).values_list("route_id", "departure_datetime")
        ):
            times.setdefault(route_id, set()).add(timezone.localtime(dep).strftime("%H:%M"))
        ctx["departure_times"] = {rid: sorted(ts) for rid, ts in times.items()}
        return ctx
