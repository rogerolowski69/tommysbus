import logging
from dataclasses import dataclass
from datetime import date, time

from apps.charters.models import CharterInquiry, ServiceType
from apps.customers.normalize import normalize_email, normalize_phone

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class CharterRequest:
    contact_name: str
    email: str
    phone: str
    origin: str
    destination: str
    passenger_count: int
    travel_date: date
    return_date: date | None = None
    message: str = ""
    service_type: str = ServiceType.CHARTER
    pickup_time: time | None = None
    hours_requested: int | None = None


def submit_inquiry(req: CharterRequest) -> CharterInquiry:
    inquiry = CharterInquiry.objects.create(
        contact_name=req.contact_name.strip(),
        email=normalize_email(req.email),
        phone=normalize_phone(req.phone),
        origin=req.origin.strip(),
        destination=req.destination.strip(),
        passenger_count=req.passenger_count,
        travel_date=req.travel_date,
        return_date=req.return_date,
        service_type=req.service_type,
        pickup_time=req.pickup_time,
        hours_requested=req.hours_requested,
        message=req.message.strip(),
    )
    logger.info("trip request received id=%s type=%s pax=%s", inquiry.pk, inquiry.service_type, inquiry.passenger_count)
    return inquiry
