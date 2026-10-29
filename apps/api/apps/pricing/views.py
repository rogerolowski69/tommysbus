from typing import Any

from drf_spectacular.utils import extend_schema
from rest_framework import generics
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.bookings.services import TripSelection, quote_selection
from apps.pricing.models import Fare
from apps.pricing.serializers import (
    FareSerializer,
    PricingPolicySerializer,
    QuoteRequestSerializer,
    QuoteSerializer,
)
from apps.pricing.services import get_active_policy


class FareListView(generics.ListAPIView):
    serializer_class = FareSerializer
    queryset = Fare.objects.filter(is_active=True, route__is_active=True).select_related(
        "route__origin", "route__destination"
    )
    filterset_fields = {"route__slug": ["exact"], "fare_type": ["exact"]}
    pagination_class = None

    def get_serializer_context(self) -> dict[str, Any]:
        return {**super().get_serializer_context(), "policy": get_active_policy()}


class PricingPolicyView(APIView):
    @extend_schema(responses=PricingPolicySerializer, operation_id="pricing_policy_retrieve")
    def get(self, request: Request) -> Response:
        return Response(PricingPolicySerializer(get_active_policy()).data)


class QuoteView(APIView):
    throttle_scope = "quote"

    @extend_schema(request=QuoteRequestSerializer, responses=QuoteSerializer, operation_id="quotes_create")
    def post(self, request: Request) -> Response:
        ser = QuoteRequestSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        d = ser.validated_data
        quote, _, _ = quote_selection(
            TripSelection(
                trip_id=d["trip_id"],
                return_trip_id=d.get("return_trip_id"),
                adults=d["adults"],
                children=d["children"],
                bags=d["bags"],
            )
        )
        return Response(QuoteSerializer(quote).data)
