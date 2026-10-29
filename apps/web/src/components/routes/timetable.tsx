import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Route } from "@/lib/api/types";
import { formatClock, formatDuration } from "@/lib/format";

function addMinutes(hhmm: string, minutes: number): string {
  const [h, m] = hhmm.split(":").map(Number);
  const total = (h * 60 + m + minutes) % (24 * 60);
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

export function Timetable({ route }: { route: Route }) {
  return (
    <div className="overflow-hidden rounded-2xl border bg-white">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b bg-navy-50 px-4 py-3">
        <h3 className="font-bold text-navy-900">{route.name}</h3>
        <p className="text-xs text-muted-foreground">Est. {formatDuration(route.estimated_duration_minutes)}</p>
      </div>
      <Table>
        <caption className="sr-only">Sample daily timetable for {route.name}</caption>
        <TableHeader>
          <TableRow>
            <TableHead scope="col">Departs {route.origin.city}</TableHead>
            <TableHead scope="col">Arrives {route.destination.slug === "mco" ? "MCO area" : route.destination.city}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {route.departure_times.length === 0 ? (
            <TableRow><TableCell colSpan={2} className="text-muted-foreground">No upcoming departures</TableCell></TableRow>
          ) : (
            route.departure_times.map((t) => (
              <TableRow key={t}>
                <TableCell className="font-semibold">{formatClock(t)}</TableCell>
                <TableCell>{formatClock(addMinutes(t, route.estimated_duration_minutes))}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
