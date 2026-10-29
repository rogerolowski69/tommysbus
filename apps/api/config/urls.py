from django.conf import settings
from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

from apps.core.views import healthz, readyz

admin.site.site_header = "Tommy's Bus — Operations (DEMO)"
admin.site.site_title = "Tommy's Bus admin"
admin.site.index_title = "Demo data management"

urlpatterns = [
    path(settings.ADMIN_URL, admin.site.urls),
    path("healthz", healthz, name="healthz"),
    path("readyz", readyz, name="readyz"),
    path("api/v1/", include("config.api_urls")),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="docs"),
]
