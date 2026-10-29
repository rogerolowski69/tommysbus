from django.contrib import admin
from django.db.models import QuerySet
from django.http import HttpRequest

from apps.schedules.models import Trip, TripStatus
from apps.schedules.services import with_availability


@admin.register(Trip)
class TripAdmin(admin.ModelAdmin):
    list_display = ["route", "departure_datetime", "arrival_datetime", "capacity", "seats_left", "status"]
    list_filter = ["status", "route", "departure_datetime"]
    list_editable = ["capacity", "status"]
    search_fields = ["route__name"]
    date_hierarchy = "departure_datetime"
    autocomplete_fields = ["route"]
    actions = ["cancel_trips"]
    list_per_page = 50

    def get_queryset(self, request: HttpRequest) -> QuerySet[Trip]:
        return with_availability(super().get_queryset(request).select_related("route"))

    @admin.display(description="Seats left")
    def seats_left(self, obj: Trip) -> int:
        return int(getattr(obj, "seats_remaining", obj.capacity))

    @admin.action(description="Mark selected trips as cancelled")
    def cancel_trips(self, request: HttpRequest, queryset: QuerySet[Trip]) -> None:
        updated = queryset.update(status=TripStatus.CANCELLED)
        self.message_user(request, f"{updated} trip(s) cancelled. Notify affected passengers manually (demo).")
