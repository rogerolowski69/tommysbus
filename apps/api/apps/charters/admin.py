from django.contrib import admin

from apps.charters.models import CharterInquiry


@admin.register(CharterInquiry)
class CharterInquiryAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "service_type",
        "contact_name",
        "origin",
        "destination",
        "travel_date",
        "pickup_time",
        "passenger_count",
        "hours_requested",
        "status",
        "created_at",
    ]
    list_filter = ["service_type", "status", "travel_date", "created_at"]
    list_editable = ["status"]
    search_fields = ["contact_name", "email", "origin", "destination"]
    date_hierarchy = "travel_date"
    readonly_fields = ["created_at", "updated_at"]
