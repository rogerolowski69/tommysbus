"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2Icon, Loader2Icon, SendIcon } from "lucide-react";
import { useForm } from "react-hook-form";

import { Field } from "@/components/booking/field";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useSubmitCharter } from "@/features/charters/queries";
import { ApiError } from "@/lib/api/errors";
import { type CharterForm as CharterValues, charterSchema, SERVICE_TYPES, type ServiceType } from "@/lib/validation/charter";
import { nativeSelectClass } from "@/components/booking/field";
import { useWatch } from "react-hook-form";

export function CharterForm({
  today,
  defaultType = "CHARTER",
  hourlyMinimum = 2,
}: {
  today: string;
  defaultType?: ServiceType;
  hourlyMinimum?: number;
}) {
  const submit = useSubmitCharter();
  const form = useForm<CharterValues>({
    resolver: zodResolver(charterSchema),
    defaultValues: {
      service_type: defaultType, contact_name: "", email: "", phone: "", origin: "", destination: "",
      travel_date: "", pickup_time: "", return_date: "", hours_requested: 0,
      passenger_count: defaultType === "CHARTER" ? 20 : 1, message: "",
    },
  });
  const { register, handleSubmit, formState: { errors }, setError, reset, control } = form;
  const serviceType = useWatch({ control, name: "service_type" });
  const isHourly = serviceType === "HOURLY";

  const onSubmit = handleSubmit(async (values) => {
    try {
      await submit.mutateAsync({
        ...values,
        return_date: values.return_date || null,
        pickup_time: values.pickup_time || null,
        hours_requested: values.service_type === "HOURLY" ? values.hours_requested : null,
      });
      reset();
    } catch (err) {
      if (err instanceof ApiError) {
        for (const [field, messages] of Object.entries(err.fields)) {
          if (field in values) setError(field as keyof CharterValues, { message: messages.join(" ") });
        }
      }
    }
  });

  if (submit.isSuccess) {
    return (
      <Alert className="border-lagoon-600 bg-lagoon-100">
        <CheckCircle2Icon className="text-lagoon-600" />
        <AlertTitle>Request received</AlertTitle>
        <AlertDescription>
          <p>Thanks! Your request was saved. In a live service, our team would contact you to confirm availability and price.</p>
          <Button variant="outline" className="mt-3" onClick={() => submit.reset()}>Submit another request</Button>
        </AlertDescription>
      </Alert>
    );
  }

  const err = (k: keyof CharterValues) => errors[k]?.message;
  const aria = (k: keyof CharterValues) => ({ "aria-invalid": !!errors[k], "aria-describedby": errors[k] ? `charter-${k}-error` : undefined });

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-5 rounded-2xl border bg-white p-6 shadow-sm sm:grid-cols-2">
      <Field id="charter-service_type" label="What do you need?" error={err("service_type")} className="sm:col-span-2">
        <select id="charter-service_type" className={nativeSelectClass} {...register("service_type")} {...aria("service_type")}>
          {SERVICE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </Field>
      <Field id="charter-contact_name" label="Contact name" error={err("contact_name")}>
        <Input id="charter-contact_name" autoComplete="name" {...register("contact_name")} {...aria("contact_name")} />
      </Field>
      <Field id="charter-email" label="Email" error={err("email")}>
        <Input id="charter-email" type="email" autoComplete="email" {...register("email")} {...aria("email")} />
      </Field>
      <Field id="charter-phone" label="Phone" error={err("phone")}>
        <Input id="charter-phone" type="tel" autoComplete="tel" {...register("phone")} {...aria("phone")} />
      </Field>
      <Field id="charter-passenger_count" label="Passengers" error={err("passenger_count")}>
        <Input id="charter-passenger_count" type="number" min={1} max={250} inputMode="numeric" {...register("passenger_count")} {...aria("passenger_count")} />
      </Field>
      <Field id="charter-origin" label="Pickup city / area" error={err("origin")} hint="Share your exact address when we call back, not here.">
        <Input id="charter-origin" placeholder="e.g. Crescent City" {...register("origin")} {...aria("origin")} />
      </Field>
      <Field id="charter-destination" label="Destination" error={err("destination")}>
        <Input id="charter-destination" placeholder={serviceType === "MEDICAL" ? "e.g. Gainesville" : serviceType === "HOURLY" ? "e.g. Errands around Palatka" : "e.g. Palatka"} {...register("destination")} {...aria("destination")} />
      </Field>
      <Field id="charter-travel_date" label="Date" error={err("travel_date")}>
        <Input id="charter-travel_date" type="date" min={today} {...register("travel_date")} {...aria("travel_date")} />
      </Field>
      <Field id="charter-pickup_time" label="Pickup time (optional)" error={err("pickup_time")}
        hint={serviceType === "MEDICAL" ? "Allow time to arrive before your appointment." : undefined}>
        <Input id="charter-pickup_time" type="time" {...register("pickup_time")} {...aria("pickup_time")} />
      </Field>
      {isHourly && (
        <Field id="charter-hours_requested" label="Hours needed" error={err("hours_requested")} hint={`${hourlyMinimum}-hour minimum (demo policy)`}>
          <select id="charter-hours_requested" className={nativeSelectClass} {...register("hours_requested")} {...aria("hours_requested")}>
            <option value={0}>Choose hours</option>
            {Array.from({ length: 12 - hourlyMinimum + 1 }, (_, i) => i + hourlyMinimum).map((h) => <option key={h} value={h}>{h} hours</option>)}
          </select>
        </Field>
      )}
      <Field id="charter-return_date" label="Return date (optional)" error={err("return_date")}>
        <Input id="charter-return_date" type="date" min={today} {...register("return_date")} {...aria("return_date")} />
      </Field>
      <Field id="charter-message" label="Special requests (optional)" error={err("message")} className="sm:col-span-2"
        hint="Appointment time, stops, accessibility needs, shopping bags or equipment. No medical details needed.">
        <Textarea id="charter-message" rows={4} {...register("message")} {...aria("message")} />
      </Field>
      {submit.isError && !(submit.error instanceof ApiError && Object.keys(submit.error.fields).length) && (
        <p role="alert" className="text-sm font-medium text-destructive sm:col-span-2">{submit.error.message}</p>
      )}
      <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
        <Button type="submit" size="lg" disabled={submit.isPending} className="bg-sunset-500 font-bold text-navy-950 hover:bg-sunset-600">
          {submit.isPending ? <Loader2Icon className="animate-spin" /> : <SendIcon />} {serviceType === "CHARTER" ? "Request a Charter Quote" : "Request this trip"}
        </Button>
        <p className="text-xs text-muted-foreground">Demo form: requests are stored for review in the admin, never shared.</p>
      </div>
    </form>
  );
}
