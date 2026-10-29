from django.contrib import admin

from apps.pricing.models import Fare, PricingPolicy


@admin.register(Fare)
class FareAdmin(admin.ModelAdmin):
    list_display = ["route", "fare_type", "amount", "currency", "is_active", "updated_at"]
    list_filter = ["fare_type", "is_active", "route"]
    list_editable = ["amount", "is_active"]
    search_fields = ["route__name"]
    autocomplete_fields = ["route"]


@admin.register(PricingPolicy)
class PricingPolicyAdmin(admin.ModelAdmin):
    list_display = [
        "name",
        "is_active",
        "round_trip_discount_percent",
        "group_min_passengers",
        "group_discount_percent",
        "free_bags_per_passenger",
        "extra_bag_fee",
    ]
