"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatMoney } from "@/lib/format";
import { type PassengerDetails, passengerSchema } from "@/lib/validation/booking";
import { useBookingStore } from "@/stores/booking-store";

import type { WizardData } from "../booking-wizard";
import { Field, nativeSelectClass } from "../field";

export function StepPassenger({ policy }: WizardData) {
  const { search, passenger, setPassenger, goTo } = useBookingStore();
  const pax = search ? search.adults + search.children : 1;
  const maxBags = pax * policy.max_bags_per_passenger;
  const { register, handleSubmit, formState: { errors } } = useForm<PassengerDetails>({
    resolver: zodResolver(passengerSchema.refine((v) => v.bags <= maxBags, { path: ["bags"], message: `Maximum ${maxBags} bags` })),
    defaultValues: passenger ?? { fullName: "", email: "", phone: "", bags: pax * policy.free_bags_per_passenger, notes: "" },
  });
  const aria = (k: keyof PassengerDetails) => ({ "aria-invalid": !!errors[k], "aria-describedby": errors[k] ? `pax-${k}-error` : undefined });

  return (
    <form noValidate onSubmit={handleSubmit(setPassenger)} className="grid gap-6 rounded-2xl border bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-xl font-bold text-navy-900">3. Passenger information</h2>
        <p className="mt-1 text-sm text-muted-foreground">Lead passenger contact for all {pax} {pax === 1 ? "traveler" : "travelers"} on this reservation.</p>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="pax-fullName" label="Full name" error={errors.fullName?.message}>
          <Input id="pax-fullName" autoComplete="name" {...register("fullName")} {...aria("fullName")} />
        </Field>
        <Field id="pax-email" label="Email" error={errors.email?.message}>
          <Input id="pax-email" type="email" autoComplete="email" {...register("email")} {...aria("email")} />
        </Field>
        <Field id="pax-phone" label="Mobile phone" error={errors.phone?.message}>
          <Input id="pax-phone" type="tel" autoComplete="tel" {...register("phone")} {...aria("phone")} />
        </Field>
        <Field id="pax-bags" label="Checked bags (total)" error={errors.bags?.message}
          hint={`${policy.free_bags_per_passenger} free per passenger; extra ${formatMoney(policy.extra_bag_fee)} each way`}>
          <select id="pax-bags" className={nativeSelectClass} {...register("bags")} {...aria("bags")}>
            {Array.from({ length: maxBags + 1 }, (_, i) => i).map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </Field>
        <Field id="pax-notes" label="Notes (optional)" error={errors.notes?.message} className="sm:col-span-2"
          hint="Accessibility needs, oversized items, etc. Don't include payment details.">
          <Textarea id="pax-notes" rows={3} {...register("notes")} {...aria("notes")} />
        </Field>
      </div>
      <div className="flex flex-wrap justify-between gap-3">
        <Button type="button" variant="outline" onClick={() => goTo(2)}><ArrowLeftIcon /> Back</Button>
        <Button type="submit" size="lg" className="bg-sunset-500 font-bold text-navy-950 hover:bg-sunset-600">
          Review reservation <ArrowRightIcon />
        </Button>
      </div>
    </form>
  );
}
