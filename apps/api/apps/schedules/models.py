from django.db import models

from apps.core.models import TimeStampedModel
from apps.routes.models import Route


class TripStatus(models.TextChoices):
    SCHEDULED = "SCHEDULED", "Scheduled"
    CANCELLED = "CANCELLED", "Cancelled"
    COMPLETED = "COMPLETED", "Completed"


class Trip(TimeStampedModel):
    """A single dated departure on a route, with a fixed seat capacity."""

    route = models.ForeignKey(Route, on_delete=models.PROTECT, related_name="trips")
    departure_datetime = models.DateTimeField()
    arrival_datetime = models.DateTimeField()
    capacity = models.PositiveSmallIntegerField(help_text="Bookable seats on the vehicle (demo value).")
    status = models.CharField(max_length=12, choices=TripStatus.choices, default=TripStatus.SCHEDULED)

    class Meta:
        ordering = ["departure_datetime"]
        indexes = [models.Index(fields=["route", "departure_datetime", "status"], name="trip_search_idx")]
        constraints = [
            models.UniqueConstraint(fields=["route", "departure_datetime"], name="trip_unique_route_departure"),
            models.CheckConstraint(
                condition=models.Q(arrival_datetime__gt=models.F("departure_datetime")), name="trip_arrival_after"
            ),
            models.CheckConstraint(condition=models.Q(capacity__gt=0), name="trip_capacity_pos"),
        ]

    def __str__(self) -> str:
        return f"{self.route} @ {self.departure_datetime:%Y-%m-%d %H:%M}"

    @property
    def duration_minutes(self) -> int:
        return int((self.arrival_datetime - self.departure_datetime).total_seconds() // 60)
