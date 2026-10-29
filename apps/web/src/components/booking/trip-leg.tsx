import { ArrowRightIcon } from "lucide-react";

import { formatDate, formatDuration, formatTime } from "@/lib/format";

type Leg = {
  departure_datetime: string;
  arrival_datetime: string;
  route: { name: string; origin: { city: string; name: string }; destination: { city: string; name: string; slug: string } };
};

export function TripLeg({ label, leg }: { label: string; leg: Leg }) {
  const minutes = Math.round((Date.parse(leg.arrival_datetime) - Date.parse(leg.departure_datetime)) / 60000);
  return (
    <div className="rounded-xl border bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-lagoon-600">{label} · {formatDate(leg.departure_datetime)}</p>
      <div className="mt-2 flex items-center gap-3">
        <div>
          <p className="text-lg font-bold text-navy-900">{formatTime(leg.departure_datetime)}</p>
          <p className="text-xs text-slate-600">{leg.route.origin.name}</p>
        </div>
        <div className="flex flex-1 flex-col items-center text-xs text-muted-foreground">
          <ArrowRightIcon className="size-4 text-sunset-600" aria-label="to" />
          {formatDuration(minutes)}
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-navy-900">{formatTime(leg.arrival_datetime)}</p>
          <p className="text-xs text-slate-600">{leg.route.destination.name}</p>
        </div>
      </div>
    </div>
  );
}
