from django.contrib import admin

from apps.pricing.models import Fare
from apps.routes.models import Route


class FareInline(admin.TabularInline):
    model = Fare
    extra = 0
    fields = ["fare_type", "amount", "currency", "is_active"]


@admin.register(Route)
class RouteAdmin(admin.ModelAdmin):
    list_display = ["name", "origin", "destination", "estimated_duration_minutes", "is_active"]
    list_filter = ["is_active", "origin__city", "destination__city"]
    list_editable = ["estimated_duration_minutes", "is_active"]
    search_fields = ["name", "origin__name", "destination__name"]
    autocomplete_fields = ["origin", "destination"]
    prepopulated_fields = {"slug": ["name"]}
    inlines = [FareInline]
