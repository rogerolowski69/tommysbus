"use client";

import { useQueryClient } from "@tanstack/react-query";
import { BanIcon, CheckCircle2Icon, PrinterIcon } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useSyncExternalStore } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useBooking, useCancelBooking } from "@/features/booking/queries";
import type { BookingStatus } from "@/lib/api/types";
import { formatDateTime } from "@/lib/format";

import { PriceBreakdown } from "./price-breakdown";
import { Stepper } from "./stepper";
import { TripLeg } from "./trip-leg";

const subscribeHash = (cb: () => void) => {
  window.addEventListener("hashchange", cb);
  return () => window.removeEventListener("hashchange", cb);
};
const readToken = () => new URLSearchParams(window.location.hash.slice(1)).get("token");

const statusStyle: Record<BookingStatus, string> = {
  DRAFT: "bg-slate-200 text-slate-800",
  HELD: "bg-sunset-100 text-navy-900",
  CONFIRMED: "bg-lagoon-100 text-lagoon-600",
  CANCELLED: "bg-red-100 text-red-800",
  EXPIRED: "bg-slate-200 text-slate-700",
};

export function ConfirmationView() {
  const reference = useSearchParams().get("ref");
  const token = useSyncExternalStore(subscribeHash, readToken, () => null);
  const booking = useBooking(reference, token);
  const cancel = useCancelBooking(reference ?? "", token ?? "");
  const queryClient = useQueryClient();

  if (!reference || (token === null && typeof window !== "undefined" && !window.location.hash)) {
    return (
      <div className="rounded-2xl border bg-white p-8 text-center">
        <h2 className="text-xl font-bold text-navy-900">Reservation link incomplete</h2>
        <p className="mt-2 text-slate-600">Open the full private link from your confirmation to view a booking.</p>
        <Button asChild className="mt-4"><Link href="/book">Book a Shuttle</Link></Button>
      </div>
    );
  }
  if (booking.isPending) return <Skeleton className="h-96 rounded-2xl" />;
  if (booking.isError) {
    return (
      <div className="rounded-2xl border bg-white p-8 text-center">
        <h2 className="text-xl font-bold text-navy-900">Reservation not found</h2>
        <p className="mt-2 text-slate-600">The link may be incomplete or the reservation no longer exists.</p>
      </div>
    );
  }

  const b = booking.data;
  const active = b.status === "HELD" || b.status === "CONFIRMED";

  async function onCancel() {
    if (!window.confirm(`Cancel reservation ${b.reference}? Held seats will be released.`)) return;
    const updated = await cancel.mutateAsync();
    queryClient.setQueryData(["booking", reference], updated);
  }

  return (
    <div className="grid gap-6">
      <Stepper current={6} />
      <div className="relative overflow-hidden rounded-2xl border-2 border-dashed border-sunset-500 bg-white p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold text-lagoon-600">
              <CheckCircle2Icon className="size-4" /> {active ? "Reservation received" : "Reservation status"}
            </p>
            <h2 className="mt-1 text-sm text-slate-500">Booking reference</h2>
            <p className="font-mono text-4xl font-extrabold tracking-widest text-navy-900" data-testid="booking-reference">{b.reference}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge className={statusStyle[b.status]} data-testid="booking-status">{b.status_label}</Badge>
            <span className="rotate-[-4deg] rounded border-2 border-red-600 px-3 py-1 text-sm font-black tracking-wider text-red-600">
              DEMO · NOT PAID
            </span>
          </div>
        </div>
        {b.status === "HELD" && b.hold_expires_at && (
          <p className="mt-4 rounded-lg bg-sunset-100 px-4 py-3 text-sm text-navy-900">
            Seats held until <strong>{formatDateTime(b.hold_expires_at)}</strong>. In a live service, payment would
            confirm this reservation. No charge has been made.
          </p>
        )}
        <div className="mt-6 grid gap-6 md:grid-cols-[1.3fr_1fr]">
          <div className="grid gap-4">
            <TripLeg label="Outbound" leg={b.trip} />
            {b.return_trip && <TripLeg label="Return" leg={b.return_trip} />}
            <div className="rounded-xl border p-4 text-sm text-slate-700">
              <p className="text-xs font-semibold uppercase tracking-wider text-lagoon-600">Passengers</p>
              <p className="mt-1">
                {b.adult_count} adult{b.adult_count > 1 && "s"}{b.child_count > 0 && `, ${b.child_count} child${b.child_count > 1 ? "ren" : ""}`} · {b.bag_count} checked bag{b.bag_count !== 1 && "s"}
              </p>
              <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-lagoon-600">Lead passenger</p>
              <p className="mt-1">{b.customer.full_name}<br />{b.customer.email} · {b.customer.phone}</p>
            </div>
          </div>
          <div className="h-fit rounded-xl border bg-navy-50/50 p-4">
            <h3 className="mb-3 font-bold text-navy-900">Price summary</h3>
            <PriceBreakdown items={b.line_items} total={b.total_amount} currency={b.currency} />
            <p className="mt-3 text-xs font-semibold text-red-700">Amount due: not collected (demo)</p>
          </div>
        </div>
        <p className="mt-6 text-xs text-muted-foreground">
          Created {formatDateTime(b.created_at)}. Keep this page&rsquo;s full link private — it is the key to your
          reservation. Arrive 10 minutes before departure.
        </p>
      </div>
      <div className="flex flex-wrap gap-3 print:hidden">
        <Button onClick={() => window.print()}><PrinterIcon /> Print confirmation</Button>
        {active && (
          <Button variant="outline" onClick={onCancel} disabled={cancel.isPending} className="text-destructive">
            <BanIcon /> Cancel reservation
          </Button>
        )}
        <Button asChild variant="ghost"><Link href="/book">Book another trip</Link></Button>
      </div>
      {cancel.isError && <p role="alert" className="text-sm text-destructive">{cancel.error.message}</p>}
    </div>
  );
}
