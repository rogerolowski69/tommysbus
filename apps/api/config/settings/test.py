from .base import *  # noqa: F403
from .base import MIDDLEWARE, REST_FRAMEWORK

DEBUG = False
PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]
REST_FRAMEWORK = {
    **REST_FRAMEWORK,
    "DEFAULT_THROTTLE_RATES": {
        "anon": "10000/min",
        "booking_create": "10000/min",
        "booking_lookup": "10000/min",
        "charter_inquiry": "10000/min",
        "quote": "10000/min",
    },
}

STORAGES = {
    "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
    "staticfiles": {"BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"},
}

# Static files are not collected in tests.
MIDDLEWARE = [m for m in MIDDLEWARE if "whitenoise" not in m]
