from django.db import models

from apps.core.models import TimeStampedModel


class Location(TimeStampedModel):
    """A pickup / drop-off point. Seeded values are DEMO placeholders."""

    name = models.CharField(max_length=120)
    slug = models.SlugField(max_length=60, unique=True)
    city = models.CharField(max_length=80, db_index=True)
    state = models.CharField(max_length=2, default="FL")
    address = models.CharField(max_length=200)
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)
    pickup_instructions = models.TextField(blank=True)
    allows_pickup = models.BooleanField(
        default=True, help_text="Uncheck for drop-off-only points (e.g. unauthorized airport curbs)."
    )
    is_active = models.BooleanField(default=True, db_index=True)

    class Meta:
        ordering = ["city", "name"]
        constraints = [
            models.CheckConstraint(condition=models.Q(latitude__gte=-90, latitude__lte=90), name="location_lat_range"),
            models.CheckConstraint(
                condition=models.Q(longitude__gte=-180, longitude__lte=180), name="location_lng_range"
            ),
        ]

    def __str__(self) -> str:
        return f"{self.name} ({self.city})"

    @property
    def map_url(self) -> str:
        return f"https://www.google.com/maps/search/?api=1&query={self.latitude},{self.longitude}"
