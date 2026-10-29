from collections.abc import Callable
from decimal import Decimal
from typing import TYPE_CHECKING

from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

from apps.core.models import TimeStampedModel
from apps.routes.models import Route


class FareType(models.TextChoices):
    ADULT = "ADULT", "Adult (12+)"
    CHILD = "CHILD", "Child (2–11)"


class Fare(TimeStampedModel):
    """One-way, per-passenger fare for a route. Demo prices, editable in admin."""

    route = models.ForeignKey(Route, on_delete=models.CASCADE, related_name="fares")
    fare_type = models.CharField(max_length=10, choices=FareType.choices)
    amount = models.DecimalField(max_digits=8, decimal_places=2, validators=[MinValueValidator(Decimal("0.00"))])
    currency = models.CharField(max_length=3, default="USD")
    is_active = models.BooleanField(default=True)

    if TYPE_CHECKING:
        get_fare_type_display: Callable[[], str]

    class Meta:
        ordering = ["route__name", "fare_type"]
        constraints = [
            models.UniqueConstraint(
                fields=["route", "fare_type"], condition=models.Q(is_active=True), name="fare_one_active_per_type"
            ),
            models.CheckConstraint(condition=models.Q(amount__gte=0), name="fare_amount_nonneg"),
        ]

    def __str__(self) -> str:
        return f"{self.route} · {self.get_fare_type_display()} · {self.amount} {self.currency}"


class PricingPolicy(TimeStampedModel):
    """Global pricing rules. Exactly one row is used (the most recently updated active one)."""

    name = models.CharField(max_length=80, default="Demo pricing policy")
    is_active = models.BooleanField(default=True)
    round_trip_discount_percent = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal("10.00"),
        validators=[MinValueValidator(Decimal("0")), MaxValueValidator(Decimal("100"))],
    )
    group_min_passengers = models.PositiveSmallIntegerField(default=6)
    group_discount_percent = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal("10.00"),
        validators=[MinValueValidator(Decimal("0")), MaxValueValidator(Decimal("100"))],
    )
    free_bags_per_passenger = models.PositiveSmallIntegerField(default=1)
    extra_bag_fee = models.DecimalField(max_digits=6, decimal_places=2, default=Decimal("10.00"))
    max_bags_per_passenger = models.PositiveSmallIntegerField(default=3)
    hourly_rate = models.DecimalField(
        max_digits=8, decimal_places=2, default=Decimal("85.00"), help_text="Hire-by-the-hour rate (demo)."
    )
    hourly_minimum_hours = models.PositiveSmallIntegerField(default=2)
    currency = models.CharField(max_length=3, default="USD")

    class Meta:
        verbose_name_plural = "pricing policies"
        constraints = [
            models.UniqueConstraint(fields=["is_active"], condition=models.Q(is_active=True), name="one_active_policy"),
        ]

    def __str__(self) -> str:
        return self.name
