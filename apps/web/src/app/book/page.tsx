import type { Metadata } from "next";
import { Suspense } from "react";

import { BookingWizard } from "@/components/booking/booking-wizard";
import { ApiUnavailable } from "@/components/shared/api-error";
import { PageHeader, Section } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { attempt, getLocations, getPricingPolicy, getRoutes } from "@/lib/api/server";
import { todayIso } from "@/lib/format";

export const metadata: Metadata = {
  title: "Book a Shuttle",
  description: "Reserve a seat on a Tommy's Bus scheduled shuttle between Palatka, Ocala and Orlando.",
  alternates: { canonical: "/book" },
};

async function WizardLoader() {
  const data = await attempt(Promise.all([getLocations(), getRoutes(), getPricingPolicy()]));
  if (!data) return <ApiUnavailable what="the booking system" />;
  const [locations, routes, policy] = data;
  return <BookingWizard locations={locations} routes={routes} policy={policy} today={todayIso()} />;
}

export default function BookPage() {
  return (
    <>
      <PageHeader eyebrow="Reservations" title="Book a Shuttle">
        Live seat availability and server-calculated fares. Demo reservations are never charged.
      </PageHeader>
      <Section className="max-w-6xl">
        <Suspense fallback={<Skeleton className="h-[32rem] rounded-2xl" />}>
          <WizardLoader />
        </Suspense>
      </Section>
    </>
  );
}
