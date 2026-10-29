"use client";

import { ArrowRightLeftIcon, SearchIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { destinationsFrom, pickupLocations } from "@/features/booking/route-utils";
import type { Location, Route } from "@/lib/api/types";
import { MAX_PASSENGERS } from "@/lib/validation/booking";

import { Field, nativeSelectClass } from "./field";

export function HeroSearch({ locations, routes, today }: { locations: Location[]; routes: Route[]; today: string }) {
  const router = useRouter();
  const origins = useMemo(() => pickupLocations(locations, routes), [locations, routes]);
  const [origin, setOrigin] = useState(origins.find((o) => o.slug === "palatka")?.slug ?? origins[0]?.slug ?? "");
  const destinations = useMemo(() => destinationsFrom(locations, routes, origin), [locations, routes, origin]);
  const [destination, setDestination] = useState(destinations.find((d) => d.slug === "orlando")?.slug ?? destinations[0]?.slug ?? "");
  const [date, setDate] = useState(today);
  const [passengers, setPassengers] = useState(1);

  function changeOrigin(next: string) {
    setOrigin(next);
    const options = destinationsFrom(locations, routes, next);
    if (!options.some((d) => d.slug === destination)) setDestination(options[0]?.slug ?? "");
  }

  const canSwap = origins.some((o) => o.slug === destination) && destinationsFrom(locations, routes, destination).some((d) => d.slug === origin);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const q = new URLSearchParams({ from: origin, to: destination, date, adults: String(passengers) });
    router.push(`/book?${q}`);
  }

  return (
    <form
      onSubmit={onSubmit}
      aria-label="Search available shuttles"
      className="grid gap-4 rounded-2xl bg-white p-5 text-slate-900 shadow-2xl ring-1 ring-black/5 sm:p-6"
    >
      <div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
        <Field id="hero-origin" label="From">
          <select id="hero-origin" className={nativeSelectClass} value={origin} onChange={(e) => changeOrigin(e.target.value)} required>
            {origins.map((l) => (
              <option key={l.slug} value={l.slug}>{l.city} — {l.name}</option>
            ))}
          </select>
        </Field>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="hidden sm:inline-flex"
          disabled={!canSwap}
          onClick={() => { setOrigin(destination); setDestination(origin); }}
          aria-label="Swap pickup and destination"
        >
          <ArrowRightLeftIcon />
        </Button>
        <Field id="hero-destination" label="To">
          <select id="hero-destination" className={nativeSelectClass} value={destination} onChange={(e) => setDestination(e.target.value)} required>
            {destinations.map((l) => (
              <option key={l.slug} value={l.slug}>{l.city === "Orlando" && l.slug === "mco" ? "MCO area (drop-off)" : `${l.city} — ${l.name}`}</option>
            ))}
          </select>
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field id="hero-date" label="Departure date">
          <Input id="hero-date" type="date" min={today} value={date} onChange={(e) => setDate(e.target.value)} required />
        </Field>
        <Field id="hero-passengers" label="Passengers">
          <select id="hero-passengers" className={nativeSelectClass} value={passengers} onChange={(e) => setPassengers(Number(e.target.value))}>
            {Array.from({ length: MAX_PASSENGERS }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>{n} {n === 1 ? "passenger" : "passengers"}</option>
            ))}
          </select>
        </Field>
      </div>
      <Button type="submit" size="lg" className="h-12 bg-sunset-500 text-base font-bold text-navy-950 hover:bg-sunset-600">
        <SearchIcon /> Search Available Shuttles
      </Button>
      <p className="text-center text-xs text-muted-foreground">Demo schedules · No payment required</p>
    </form>
  );
}
