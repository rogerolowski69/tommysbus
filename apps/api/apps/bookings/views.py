import uuid

from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import status
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.bookings.serializers import BookingCreatedSerializer, BookingCreateSerializer, BookingDetailSerializer
from apps.bookings.services import (
    BookingRequest,
    TripSelection,
    cancel_booking,
    create_booking,
    get_booking_with_token,
)

IDEMPOTENCY_HEADER = OpenApiParameter(
    "Idempotency-Key",
    OpenApiTypes.UUID,
    OpenApiParameter.HEADER,
    required=True,
    description="Client-generated UUID. Retrying with the same key and body returns the original booking.",
)
TOKEN_HEADER = OpenApiParameter(
    "X-Booking-Token",
    OpenApiTypes.STR,
    OpenApiParameter.HEADER,
    required=True,
    description="Access token returned when the booking was created.",
)


def _idempotency_key(request: Request) -> str:
    raw = request.headers.get("Idempotency-Key", "")
    try:
        return str(uuid.UUID(raw))
    except ValueError:
        raise ValidationError({"Idempotency-Key": "A UUID Idempotency-Key header is required."}) from None


def _token(request: Request) -> str:
    return request.headers.get("X-Booking-Token", "")[:128]


class BookingCreateView(APIView):
    throttle_scope = "booking_create"

    @extend_schema(
        request=BookingCreateSerializer,
        responses={201: BookingCreatedSerializer, 200: BookingCreatedSerializer},
        parameters=[IDEMPOTENCY_HEADER],
        operation_id="bookings_create",
    )
    def post(self, request: Request) -> Response:
        key = _idempotency_key(request)
        ser = BookingCreateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        d = ser.validated_data
        booking, token, created = create_booking(
            BookingRequest(
                selection=TripSelection(
                    trip_id=d["trip_id"],
                    return_trip_id=d.get("return_trip_id"),
                    adults=d["adults"],
                    children=d["children"],
                    bags=d["bags"],
                ),
                customer_name=d["full_name"],
                customer_email=d["email"],
                customer_phone=d["phone"],
                notes=d["notes"],
            ),
            idempotency_key=key,
        )
        booking.access_token = token  # type: ignore[attr-defined]
        data = BookingCreatedSerializer(booking).data
        response = Response(data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)
        response["Cache-Control"] = "no-store"
        return response


class BookingDetailView(APIView):
    throttle_scope = "booking_lookup"

    @extend_schema(responses=BookingDetailSerializer, parameters=[TOKEN_HEADER], operation_id="bookings_retrieve")
    def get(self, request: Request, reference: str) -> Response:
        booking = get_booking_with_token(reference, _token(request))
        if booking is None:
            raise NotFound("Booking not found.")
        response = Response(BookingDetailSerializer(booking).data)
        response["Cache-Control"] = "no-store"
        return response


class BookingCancelView(APIView):
    throttle_scope = "booking_lookup"

    @extend_schema(
        request=None, responses=BookingDetailSerializer, parameters=[TOKEN_HEADER], operation_id="bookings_cancel"
    )
    def post(self, request: Request, reference: str) -> Response:
        booking = get_booking_with_token(reference, _token(request))
        if booking is None:
            raise NotFound("Booking not found.")
        booking = cancel_booking(booking)
        return Response(BookingDetailSerializer(booking).data)
