from typing import TYPE_CHECKING

from django.db import models

from apps.core.models import TimeStampedModel
from apps.locations.models import Location

if TYPE_CHECKING:
    from django.db.models.fields.related_descriptors import RelatedManager

    from apps.pricing.models import Fare


class Route(TimeStampedModel):
    origin = models.ForeignKey(Location, on_delete=models.PROTECT, related_name="routes_from")
    destination = models.ForeignKey(Location, on_delete=models.PROTECT, related_name="routes_to")
    name = models.CharField(max_length=120)
    slug = models.SlugField(max_length=80, unique=True)
    description = models.TextField(blank=True)
    estimated_duration_minutes = models.PositiveIntegerField()
    is_active = models.BooleanField(default=True, db_index=True)

    if TYPE_CHECKING:
        fares: RelatedManager[Fare]

    class Meta:
        ordering = ["origin__city", "destination__city"]
        constraints = [
            models.UniqueConstraint(fields=["origin", "destination"], name="route_unique_origin_destination"),
            models.CheckConstraint(condition=~models.Q(origin=models.F("destination")), name="route_distinct_ends"),
            models.CheckConstraint(condition=models.Q(estimated_duration_minutes__gt=0), name="route_duration_pos"),
        ]

    def __str__(self) -> str:
        return self.name
