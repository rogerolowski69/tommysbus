"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRightIcon } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { destinationsFrom, hasReverseRoute, pickupLocations } from "@/features/booking/route-utils";
import { MAX_PASSENGERS, type TripSearch, tripSearchSchema } from "@/lib/validation/booking";
import { useBookingStore } from "@/stores/booking-store";

import type { WizardData } from "../booking-wizard";
import { Field, nativeSelectClass } from "../field";

export function StepTrip({ locations, routes, today }: WizardData) {
  const params = useSearchParams();
  const saved = useBookingStore((s) => s.search);
  const setSearch = useBookingStore((s) => s.setSearch);
  const origins = pickupLocations(locations, routes);

  const form = useForm<TripSearch>({
    resolver: zodResolver(tripSearchSchema),
    defaultValues: saved ?? {
      tripType: "ONE_WAY",
      origin: params.get("from") ?? origins.find((o) => o.slug === "palatka")?.slug ?? origins[0]?.slug ?? "",
      destination: params.get("to") ?? "",
      departDate: today,
      returnDate: "",
      adults: Number(params.get("adults")) || 1,
      children: 0,
    },
  });
  const { register, control, handleSubmit, setValue, formState: { errors } } = form;
  const [tripType, origin, destination] = useWatch({ control, name: ["tripType", "origin", "destination"] });
  const destinations = destinationsFrom(locations, routes, origin);
  const roundTripPossible = !destination || hasReverseRoute(routes, origin, destination);

  const aria = (k: keyof TripSearch) => ({ "aria-invalid": !!errors[k], "aria-describedby": errors[k] ? `trip-${k}-error` : undefined });

  return (
    <form
      noValidate
      onSubmit={handleSubmit((v) => setSearch(v.tripType === "ONE_WAY" ? { ...v, returnDate: "" } : v))}
      className="grid gap-6 rounded-2xl border bg-white p-6 shadow-sm"
    >
      <h2 className="text-xl font-bold text-navy-900">1. Select your trip</h2>
      <Controller
        control={control}
        name="tripType"
        render={({ field }) => (
          <RadioGroup value={field.value} onValueChange={field.onChange} className="flex flex-wrap gap-4" aria-label="Trip type">
            {([["ONE_WAY", "One-way"], ["ROUND_TRIP", "Round-trip"]] as const).map(([value, label]) => (
              <Label key={value} htmlFor={`tt-${value}`} className="flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2.5 has-[[data-state=checked]]:border-navy-900 has-[[data-state=checked]]:bg-navy-50">
                <RadioGroupItem id={`tt-${value}`} value={value} disabled={value === "ROUND_TRIP" && !roundTripPossible} /> {label}
              </Label>
            ))}
          </RadioGroup>
        )}
      />
      {!roundTripPossible && <p className="-mt-3 text-xs text-muted-foreground">Round-trip isn&rsquo;t available for this destination (drop-off only).</p>}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="trip-origin" label="Pickup location" error={errors.origin?.message}>
          <select
            id="trip-origin"
            className={nativeSelectClass}
            {...register("origin", {
              onChange: (e) => {
                const opts = destinationsFrom(locations, routes, e.target.value);
                if (!opts.some((d) => d.slug === destination)) setValue("destination", opts[0]?.slug ?? "");
              },
            })}
            {...aria("origin")}
          >
            {origins.map((l) => <option key={l.slug} value={l.slug}>{l.city} — {l.name}</option>)}
          </select>
        </Field>
        <Field id="trip-destination" label="Destination" error={errors.destination?.message}>
          <select
            id="trip-destination"
            className={nativeSelectClass}
            {...register("destination", {
              onChange: (e) => {
                if (!hasReverseRoute(routes, origin, e.target.value)) setValue("tripType", "ONE_WAY");
              },
            })}
            {...aria("destination")}
          >
            <option value="">Choose destination</option>
            {destinations.map((l) => <option key={l.slug} value={l.slug}>{l.slug === "mco" ? "Orlando Int'l Airport area (drop-off only)" : `${l.city} — ${l.name}`}</option>)}
          </select>
        </Field>
        <Field id="trip-departDate" label="Departure date" error={errors.departDate?.message}>
          <Input id="trip-departDate" type="date" min={today} {...register("departDate")} {...aria("departDate")} />
        </Field>
        {tripType === "ROUND_TRIP" && (
          <Field id="trip-returnDate" label="Return date" error={errors.returnDate?.message}>
            <Input id="trip-returnDate" type="date" min={today} {...register("returnDate")} {...aria("returnDate")} />
          </Field>
        )}
        <Field id="trip-adults" label="Adults (12+)" error={errors.adults?.message}>
          <select id="trip-adults" className={nativeSelectClass} {...register("adults")} {...aria("adults")}>
            {Array.from({ length: MAX_PASSENGERS }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </Field>
        <Field id="trip-children" label="Children (2–11)" error={errors.children?.message}>
          <select id="trip-children" className={nativeSelectClass} {...register("children")} {...aria("children")}>
            {Array.from({ length: MAX_PASSENGERS }, (_, i) => i).map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </Field>
      </div>
      <Button type="submit" size="lg" className="w-full bg-sunset-500 font-bold text-navy-950 hover:bg-sunset-600 sm:w-fit">
        Find departures <ArrowRightIcon />
      </Button>
    </form>
  );
}
