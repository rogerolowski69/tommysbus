from typing import Any

from django.core.management.base import BaseCommand

from apps.bookings.services import expire_stale_holds


class Command(BaseCommand):
    help = "Mark HELD bookings whose hold has lapsed as EXPIRED (run from cron in deployment)."

    def handle(self, *args: Any, **opts: Any) -> None:
        self.stdout.write(f"Expired {expire_stale_holds()} booking hold(s).")
