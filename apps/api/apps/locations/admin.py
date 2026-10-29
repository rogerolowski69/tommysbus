from django.contrib import admin

from apps.locations.models import Location


@admin.register(Location)
class LocationAdmin(admin.ModelAdmin):
    list_display = ["name", "city", "state", "allows_pickup", "is_active", "updated_at"]
    list_filter = ["city", "allows_pickup", "is_active"]
    list_editable = ["is_active"]
    search_fields = ["name", "city", "address"]
    prepopulated_fields = {"slug": ["name"]}
