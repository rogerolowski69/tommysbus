import { ExternalLinkIcon, MapPinIcon } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";

import { ApiUnavailable } from "@/components/shared/api-error";
import { DemoNote, PageHeader, Section } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { attempt, getLocations } from "@/lib/api/server";

export const metadata: Metadata = {
  title: "Pickup Locations",
  description: "Shuttle stops in Palatka, Ocala and Orlando with addresses, map links and boarding instructions.",
  alternates: { canonical: "/locations" },
};

async function LocationCards() {
  const data = await attempt(getLocations());
  if (!data) return <ApiUnavailable what="pickup locations" />;
  const locations = data;
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {locations.map((l) => (
        <article key={l.id} className="flex flex-col rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-lagoon-600">{l.city}, {l.state}</p>
              <h2 className="mt-1 text-lg font-bold text-navy-900">{l.name}</h2>
            </div>
            {l.allows_pickup ? (
              <Badge className="bg-lagoon-100 text-lagoon-600">Pickup & drop-off</Badge>
            ) : (
              <Badge variant="outline" className="border-sunset-500">Drop-off only</Badge>
            )}
          </div>
          <p className="mt-3 flex gap-2 text-sm text-slate-700"><MapPinIcon className="mt-0.5 size-4 shrink-0" />{l.address}</p>
          {l.pickup_instructions && (
            <div className="mt-4 rounded-xl bg-navy-50 p-4 text-sm text-slate-700">
              <p className="font-semibold text-navy-900">{l.allows_pickup ? "Pickup instructions" : "Important"}</p>
              <p className="mt-1">{l.pickup_instructions}</p>
            </div>
          )}
          <Button asChild variant="outline" className="mt-5 w-fit">
            <a href={l.map_url} target="_blank" rel="noopener noreferrer">
              Open approximate area in Maps <ExternalLinkIcon />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          </Button>
        </article>
      ))}
    </div>
  );

}

export default function LocationsPage() {
  return (
    <>
      <PageHeader eyebrow="Pickup locations" title="Where to catch your shuttle">
        Arrive 10 minutes before departure and have your booking reference ready.
      </PageHeader>
      <Section>
        <div className="mb-8">
          <DemoNote>
            Stops below are placeholders until real, authorized boarding locations are confirmed. Map links point to
            the general city area only.
          </DemoNote>
        </div>
        <Suspense fallback={<div className="grid gap-6 md:grid-cols-2">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-64 rounded-2xl" />)}</div>}>
          <LocationCards />
        </Suspense>
      </Section>
    </>
  );
}
