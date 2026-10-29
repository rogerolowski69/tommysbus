"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

import type { Location, PricingPolicy, Route } from "@/lib/api/types";
import { tripSearchSchema } from "@/lib/validation/booking";
import { useBookingStore } from "@/stores/booking-store";

import { Stepper } from "./stepper";
import { StepDepartures } from "./steps/step-departures";
import { StepPassenger } from "./steps/step-passenger";
import { StepReview } from "./steps/step-review";
import { StepTrip } from "./steps/step-trip";

export type WizardData = { locations: Location[]; routes: Route[]; policy: PricingPolicy; today: string };

export function BookingWizard(props: WizardData) {
  const step = useBookingStore((s) => s.step);
  const setSearch = useBookingStore((s) => s.setSearch);
  const reset = useBookingStore((s) => s.reset);
  const params = useSearchParams();
  const applied = useRef(false);

  // Deep links from the homepage search (/book?from=&to=&date=&adults=) skip straight to departures.
  useEffect(() => {
    if (applied.current) return;
    applied.current = true;
    reset();
    const parsed = tripSearchSchema.safeParse({
      tripType: "ONE_WAY",
      origin: params.get("from") ?? "",
      destination: params.get("to") ?? "",
      departDate: params.get("date") ?? "",
      returnDate: "",
      adults: params.get("adults") ?? 1,
      children: 0,
    });
    if (parsed.success && parsed.data.departDate >= props.today) setSearch(parsed.data);
  }, [params, props.today, reset, setSearch]);

  useEffect(() => {
    document.getElementById("wizard-top")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [step]);

  return (
    <div id="wizard-top" className="scroll-mt-28">
      <Stepper current={step} />
      <div className="mt-8">
        {step === 1 && <StepTrip {...props} />}
        {step === 2 && <StepDepartures {...props} />}
        {step === 3 && <StepPassenger {...props} />}
        {step === 4 && <StepReview />}
      </div>
    </div>
  );
}
