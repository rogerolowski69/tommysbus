from django.urls import path, re_path

from apps.bookings.views import BookingCancelView, BookingCreateView, BookingDetailView
from apps.charters.views import CharterInquiryCreateView
from apps.locations.views import LocationListView
from apps.pricing.views import FareListView, PricingPolicyView, QuoteView
from apps.routes.views import RouteListView
from apps.schedules.views import TripListView

REF = r"(?P<reference>[Tt][Bb]-[A-Za-z0-9]{6})"

urlpatterns = [
    path("locations/", LocationListView.as_view(), name="location-list"),
    path("routes/", RouteListView.as_view(), name="route-list"),
    path("trips/", TripListView.as_view(), name="trip-list"),
    path("fares/", FareListView.as_view(), name="fare-list"),
    path("pricing-policy/", PricingPolicyView.as_view(), name="pricing-policy"),
    path("quotes/", QuoteView.as_view(), name="quote"),
    path("bookings/", BookingCreateView.as_view(), name="booking-create"),
    re_path(rf"^bookings/{REF}/$", BookingDetailView.as_view(), name="booking-detail"),
    re_path(rf"^bookings/{REF}/cancel/$", BookingCancelView.as_view(), name="booking-cancel"),
    path("charter-inquiries/", CharterInquiryCreateView.as_view(), name="charter-inquiry-create"),
]
