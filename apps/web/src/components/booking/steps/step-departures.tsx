"use client";

import { ArrowLeftIcon, ArrowRightIcon, ChevronLeftIcon, ChevronRightIcon, Loader2Icon, UsersIcon } from "lucide-react";

import { ApiUnavailable } from "@/components/shared/api-error";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useTrips } from "@/features/booking/queries";
import type { Trip } from "@/lib/api/types";
import { addDaysIso, formatDuration, formatIsoDate, formatMoney, formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useBookingStore } from "@/stores/booking-store";

import type { WizardData } from "../booking-wizard";

function DepartureList({
  legend, origin, destination, date, today, passengers, selected, onSelect, onDateChange, notBefore,
}: {
  legend: string; origin: string; destination: string; date: string; today: string; passengers: number;
  selected: Trip | null; onSelect: (t: Trip) => void; onDateChange: (d: string) => void; notBefore?: string;
}) {
  const { data, isPending, isError, isFetching } = useTrips({ origin, destination, date });
  const name = `${legend}-departure`;
  return (
    <fieldset className="rounded-2xl border bg-white p-5 shadow-sm">
      <legend className="sr-only">{legend} departure</legend>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-lagoon-600">{legend}</p>
          <h3 className="text-lg font-bold text-navy-900">{formatIsoDate(date)}</h3>
        </div>
        <div className="flex items-center gap-1">
          {isFetching && <Loader2Icon className="size-4 animate-spin text-muted-foreground" aria-label="Loading" />}
          <Button type="button" variant="outline" size="sm" disabled={date <= today} onClick={() => onDateChange(addDaysIso(date, -1))}>
            <ChevronLeftIcon /> Prev day
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => onDateChange(addDaysIso(date, 1))}>
            Next day <ChevronRightIcon />
          </Button>
        </div>
      </div>
      <div className="mt-4 grid gap-3">
        {isPending && [0, 1, 2].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        {isError && <ApiUnavailable what="departures" />}
        {data?.length === 0 && (
          <p className="rounded-xl bg-navy-50 p-4 text-sm text-slate-700">No departures on this date. Try the next day.</p>
        )}
        {data?.map((trip) => {
          const tooFew = trip.seats_remaining < passengers;
          const tooEarly = !!notBefore && trip.departure_datetime < notBefore;
          const disabled = tooFew || tooEarly;
          const checked = selected?.id === trip.id;
          return (
            <label
              key={trip.id}
              className={cn(
                "grid cursor-pointer grid-cols-[auto_1fr] items-center gap-4 rounded-xl border p-4 transition-colors sm:grid-cols-[auto_1fr_auto]",
                checked ? "border-navy-900 bg-navy-50 ring-1 ring-navy-900" : "hover:border-navy-700",
                disabled && "cursor-not-allowed opacity-50 hover:border-border",
              )}
            >
              <input type="radio" name={name} className="size-4 accent-navy-900" checked={checked} disabled={disabled} onChange={() => onSelect(trip)} />
              <div>
                <p className="text-lg font-bold text-navy-900">
                  {formatTime(trip.departure_datetime)} <span className="font-normal text-muted-foreground">→</span> {formatTime(trip.arrival_datetime)}
                </p>
                <p className="text-sm text-slate-600">
                  {formatDuration(trip.duration_minutes)} · {trip.route.origin.name} → {trip.route.destination.name}
                </p>
              </div>
              <div className="col-span-2 flex flex-wrap items-center gap-2 sm:col-span-1 sm:flex-col sm:items-end">
                <p className="font-bold text-navy-900">
                  {formatMoney(trip.adult_fare)} <span className="text-xs font-normal text-muted-foreground">adult</span>
                </p>
                <p className="text-xs text-muted-foreground">{formatMoney(trip.child_fare)} child</p>
                <Badge variant="outline" className={cn(trip.seats_remaining <= 4 && "border-sunset-600 text-sunset-600")}>
                  <UsersIcon className="size-3" />
                  {trip.seats_remaining === 0 ? "Sold out" : `${trip.seats_remaining} seats left`}
                </Badge>
                {tooEarly && <span className="text-xs">Departs before outbound arrives</span>}
              </div>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export function StepDepartures({ today, locations }: WizardData) {
  const { search, outbound, inbound, selectOutbound, selectInbound, setSearch, goTo } = useBookingStore();
  if (!search) return null;
  const passengers = search.adults + search.children;
  const city = (slug: string) => locations.find((l) => l.slug === slug)?.city ?? slug;
  const roundTrip = search.tripType === "ROUND_TRIP";
  const ready = !!outbound && (!roundTrip || !!inbound);

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-navy-900">2. Choose your departure{roundTrip && "s"}</h2>
        <p className="text-sm text-slate-600">
          {city(search.origin)} → {city(search.destination)} · {passengers} {passengers === 1 ? "traveler" : "travelers"}
        </p>
      </div>
      <DepartureList
        legend="Outbound" origin={search.origin} destination={search.destination} date={search.departDate}
        today={today} passengers={passengers} selected={outbound} onSelect={selectOutbound}
        onDateChange={(d) => {
          setSearch({ ...search, departDate: d, returnDate: roundTrip && search.returnDate < d ? d : search.returnDate });
        }}
      />
      {roundTrip && (
        <DepartureList
          legend="Return" origin={search.destination} destination={search.origin} date={search.returnDate}
          today={search.departDate} passengers={passengers} selected={inbound} onSelect={selectInbound}
          notBefore={outbound?.arrival_datetime}
          onDateChange={(d) => setSearch({ ...search, returnDate: d })}
        />
      )}
      <div className="flex flex-wrap justify-between gap-3">
        <Button type="button" variant="outline" onClick={() => goTo(1)}><ArrowLeftIcon /> Change trip</Button>
        <Button type="button" size="lg" disabled={!ready} onClick={() => goTo(3)} className="bg-sunset-500 font-bold text-navy-950 hover:bg-sunset-600">
          Continue to passenger details <ArrowRightIcon />
        </Button>
      </div>
    </div>
  );
}
