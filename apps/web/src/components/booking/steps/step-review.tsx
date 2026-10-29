"use client";

import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangleIcon, ArrowLeftIcon, Loader2Icon, TicketCheckIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useCreateBooking, useQuote } from "@/features/booking/queries";
import { ApiError } from "@/lib/api/errors";
import { useBookingStore } from "@/stores/booking-store";

import { PriceBreakdown } from "../price-breakdown";
import { TripLeg } from "../trip-leg";

export function StepReview() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { search, outbound, inbound, passenger, goTo, ensureIdempotencyKey, reset } = useBookingStore();
  const [accepted, setAccepted] = useState(false);
  const create = useCreateBooking();

  const selection = search && outbound && passenger
    ? { trip_id: outbound.id, return_trip_id: inbound?.id ?? null, adults: search.adults, children: search.children, bags: passenger.bags }
    : null;
  const quote = useQuote(selection);

  if (!search || !outbound || !passenger || !selection) return null;

  async function submit() {
    if (!selection || !passenger) return;
    try {
      const booking = await create.mutateAsync({
        idempotencyKey: ensureIdempotencyKey(),
        body: {
          ...selection,
          full_name: passenger.fullName,
          email: passenger.email,
          phone: passenger.phone,
          notes: passenger.notes,
          accept_terms: true,
        },
      });
      // The access token lives in the URL fragment, which browsers never send to servers.
      router.push(`/book/confirmation?ref=${encodeURIComponent(booking.reference)}#token=${booking.access_token}`);
      reset();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) await queryClient.invalidateQueries({ queryKey: ["trips"] });
    }
  }

  const soldOut = create.error instanceof ApiError && create.error.code === "insufficient_seats";

  return (
    <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
      <div className="grid gap-4">
        <h2 className="text-xl font-bold text-navy-900">4. Review your reservation</h2>
        <TripLeg label="Outbound" leg={outbound} />
        {inbound && <TripLeg label="Return" leg={inbound} />}
        <div className="rounded-xl border bg-white p-4 text-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-lagoon-600">Passengers</p>
          <p className="mt-1 text-slate-700">
            {search.adults} adult{search.adults > 1 && "s"}{search.children > 0 && `, ${search.children} child${search.children > 1 ? "ren" : ""}`} · {passenger.bags} checked bag{passenger.bags !== 1 && "s"}
          </p>
          <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-lagoon-600">Lead passenger</p>
          <p className="mt-1 text-slate-700">{passenger.fullName} · {passenger.email} · {passenger.phone}</p>
          {passenger.notes && <p className="mt-1 text-slate-500">Notes: {passenger.notes}</p>}
          <div className="mt-3 flex gap-3">
            <Button variant="link" className="h-auto p-0" onClick={() => goTo(2)}>Change departures</Button>
            <Button variant="link" className="h-auto p-0" onClick={() => goTo(3)}>Edit details</Button>
          </div>
        </div>
      </div>

      <aside className="h-fit rounded-2xl border bg-white p-5 shadow-sm lg:sticky lg:top-28">
        <h3 className="font-bold text-navy-900">Price breakdown</h3>
        <p className="text-xs text-muted-foreground">Calculated by the reservations server.</p>
        <div className="mt-4">
          {quote.isPending && <Skeleton className="h-32" />}
          {quote.isError && <p role="alert" className="text-sm text-destructive">{quote.error.message}</p>}
          {quote.data && <PriceBreakdown items={quote.data.line_items} total={quote.data.total} currency={quote.data.currency} />}
        </div>
        <p className="mt-4 rounded-lg bg-sunset-100 px-3 py-2 text-xs font-semibold text-navy-900">
          DEMO · NOT PAID — no payment is collected. Seats are held temporarily.
        </p>
        <div className="mt-4 flex items-start gap-3">
          <Checkbox id="terms" checked={accepted} onCheckedChange={(v) => setAccepted(v === true)} />
          <Label htmlFor="terms" className="text-sm font-normal leading-snug text-slate-700">
            I understand this is a demonstration reservation, no payment is taken, and it does not guarantee travel.
          </Label>
        </div>
        {create.isError && (
          <Alert variant="destructive" className="mt-4">
            <AlertTriangleIcon />
            <AlertTitle>{soldOut ? "Seats no longer available" : "Couldn't complete the reservation"}</AlertTitle>
            <AlertDescription>
              {create.error.message}
              {soldOut && <Button variant="outline" size="sm" className="mt-2" onClick={() => goTo(2)}>Choose another departure</Button>}
            </AlertDescription>
          </Alert>
        )}
        <Button
          size="lg"
          className="mt-4 w-full bg-sunset-500 font-bold text-navy-950 hover:bg-sunset-600"
          disabled={!accepted || !quote.data || create.isPending}
          onClick={submit}
        >
          {create.isPending ? <Loader2Icon className="animate-spin" /> : <TicketCheckIcon />} Reserve seats (no payment)
        </Button>
        <Button variant="ghost" className="mt-2 w-full" onClick={() => goTo(3)}><ArrowLeftIcon /> Back</Button>
      </aside>
    </div>
  );
}
