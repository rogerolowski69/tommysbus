from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.charters.serializers import CharterInquiryCreateSerializer, CharterInquiryReceiptSerializer
from apps.charters.services import CharterRequest, submit_inquiry


class CharterInquiryCreateView(APIView):
    throttle_scope = "charter_inquiry"

    @extend_schema(
        request=CharterInquiryCreateSerializer,
        responses={201: CharterInquiryReceiptSerializer},
        operation_id="charter_inquiries_create",
    )
    def post(self, request: Request) -> Response:
        ser = CharterInquiryCreateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        submit_inquiry(CharterRequest(**ser.validated_data))
        return Response(
            {"status": "received", "detail": "Thanks — your charter request was received (demo)."},
            status=status.HTTP_201_CREATED,
        )
