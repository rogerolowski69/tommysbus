from collections.abc import Callable
from typing import TYPE_CHECKING

from django.db import models

from apps.core.models import TimeStampedModel


class CharterStatus(models.TextChoices):
    NEW = "NEW", "New"
    CONTACTED = "CONTACTED", "Contacted"
    QUOTED = "QUOTED", "Quoted"
    CLOSED = "CLOSED", "Closed"


class ServiceType(models.TextChoices):
    CHARTER = "CHARTER", "Private charter"
    MEDICAL = "MEDICAL", "Medical appointment ride (non-emergency)"
    GROCERY_PHARMACY = "GROCERY_PHARMACY", "Grocery / pharmacy run"
    SHOPPING = "SHOPPING", "Walmart / shopping trip"
    HOURLY = "HOURLY", "Hire by the hour"


class CharterInquiry(TimeStampedModel):
    """A request for an on-demand trip: private charter, local errand run or hourly hire."""

    service_type = models.CharField(
        max_length=20, choices=ServiceType.choices, default=ServiceType.CHARTER, db_index=True
    )
    contact_name = models.CharField(max_length=120)
    email = models.EmailField()
    phone = models.CharField(max_length=20)
    origin = models.CharField(max_length=120, help_text="Pickup city")
    destination = models.CharField(max_length=120)
    passenger_count = models.PositiveSmallIntegerField()
    travel_date = models.DateField()
    return_date = models.DateField(null=True, blank=True)
    pickup_time = models.TimeField(null=True, blank=True)
    hours_requested = models.PositiveSmallIntegerField(null=True, blank=True, help_text="For hourly hire.")
    message = models.TextField(blank=True, max_length=2000)
    status = models.CharField(max_length=10, choices=CharterStatus.choices, default=CharterStatus.NEW, db_index=True)
    internal_notes = models.TextField(blank=True)

    if TYPE_CHECKING:
        get_service_type_display: Callable[[], str]

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "trip / charter request"
        verbose_name_plural = "trip / charter requests"
        constraints = [
            models.CheckConstraint(condition=models.Q(passenger_count__gte=1), name="charter_min_passenger"),
            models.CheckConstraint(
                condition=~models.Q(service_type="HOURLY") | models.Q(hours_requested__gte=1),
                name="charter_hourly_needs_hours",
            ),
            models.CheckConstraint(
                condition=models.Q(return_date__isnull=True) | models.Q(return_date__gte=models.F("travel_date")),
                name="charter_return_after_travel",
            ),
        ]

    def __str__(self) -> str:
        return f"#{self.pk} {self.get_service_type_display()} · {self.origin} → {self.destination} · {self.travel_date}"
