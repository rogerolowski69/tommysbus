import { ArrowRightIcon, ClockIcon } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Route } from "@/lib/api/types";
import { formatClock, formatDuration, formatMoney } from "@/lib/format";

export function RouteCard({ route }: { route: Route }) {
  const dropOffOnly = route.destination.slug === "mco";
  return (
    <article className="flex flex-col rounded-2xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-lagoon-600">Scheduled route</p>
          <h3 className="mt-1 flex flex-wrap items-center gap-2 text-lg font-bold text-navy-900">
            {route.origin.city} <ArrowRightIcon className="size-4 text-sunset-600" aria-label="to" />
            {dropOffOnly ? "MCO area" : route.destination.city}
          </h3>
        </div>
        {route.adult_fare && (
          <div className="text-right">
            <p className="text-xs text-muted-foreground">from</p>
            <p className="text-xl font-extrabold text-navy-900">{formatMoney(route.adult_fare)}</p>
          </div>
        )}
      </div>
      <p className="mt-3 flex items-center gap-1.5 text-sm text-slate-600">
        <ClockIcon className="size-4" /> About {formatDuration(route.estimated_duration_minutes)}
        <span className="text-xs">(estimate)</span>
      </p>
      {dropOffOnly && (
        <Badge variant="outline" className="mt-3 w-fit border-sunset-500 text-navy-900">Drop-off only · no airport pickups</Badge>
      )}
      {route.departure_times.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-medium text-slate-500">Daily departures (demo)</p>
          <ul className="mt-1.5 flex flex-wrap gap-1.5" aria-label="Departure times">
            {route.departure_times.map((t) => (
              <li key={t} className="rounded-md bg-navy-50 px-2 py-1 text-xs font-semibold text-navy-900">{formatClock(t)}</li>
            ))}
          </ul>
        </div>
      )}
      <Button asChild className="mt-5 w-full" variant="default">
        <Link href={`/book?from=${route.origin.slug}&to=${route.destination.slug}`}>
          Book this route <ArrowRightIcon />
        </Link>
      </Button>
    </article>
  );
}

export function RouteCardSkeleton() {
  return <div className="h-64 animate-pulse rounded-2xl border bg-navy-50" aria-hidden />;
}
