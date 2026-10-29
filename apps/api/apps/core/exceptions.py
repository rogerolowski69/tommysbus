from typing import Any

from rest_framework import status
from rest_framework.exceptions import APIException
from rest_framework.response import Response
from rest_framework.views import exception_handler


class DomainError(APIException):
    """Base class for business-rule violations raised by services."""

    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = "The request could not be completed."
    default_code = "domain_error"


class ConflictError(DomainError):
    status_code = status.HTTP_409_CONFLICT
    default_code = "conflict"


def api_exception_handler(exc: Exception, context: dict[str, Any]) -> Response | None:
    response = exception_handler(exc, context)
    if response is not None and isinstance(exc, APIException) and isinstance(response.data, dict):
        response.data.setdefault("code", exc.get_codes() if isinstance(exc.get_codes(), str) else "invalid")
    return response
