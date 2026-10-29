import { ArrowRightIcon, MapPinIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";

import { CharterForm } from "@/components/charters/charter-form";
import { DemoNote, PageHeader, Section } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { attempt, getPricingPolicy } from "@/lib/api/server";
import { formatMoney, todayIso } from "@/lib/format";
import { localServices } from "@/lib/services";
import { isServiceType } from "@/lib/validation/charter";

export const metadata: Metadata = {
  title: "Local Trips & Hourly Hire",
  description:
    "Medical appointment rides to Gainesville and Jacksonville, grocery and pharmacy runs to Crescent City and Palatka, Walmart shopping trips, and hire by the hour.",
  alternates: { canonical: "/services" },
};

async function HourlyRate() {
  const policy = await attempt(getPricingPolicy());
  if (!policy) return <span>Hourly rate available on request.</span>;
  return (
    <span>
      <strong className="text-2xl font-extrabold text-navy-900">{formatMoney(policy.hourly_rate)}</strong>
      <span className="text-slate-600"> per hour · {policy.hourly_minimum_hours}-hour minimum (demo rate)</span>
    </span>
  );
}

async function RequestFormLoader({ searchParams }: { searchParams: PageProps<"/services">["searchParams"] }) {
  await connection();
  const [{ type }, policy] = await Promise.all([searchParams, attempt(getPricingPolicy())]);
  const defaultType = isServiceType(type) && type !== "CHARTER" ? type : "MEDICAL";
  return <CharterForm today={todayIso()} defaultType={defaultType} hourlyMinimum={policy?.hourly_minimum_hours ?? 2} />;
}

export default function ServicesPage({ searchParams }: PageProps<"/services">) {
  return (
    <>
      <PageHeader eyebrow="Local trips" title="Rides for everyday life">
        Medical appointments, grocery and pharmacy runs, shopping trips, or a driver by the hour, across Putnam
        County and the surrounding area.
      </PageHeader>
      <Section>
        <div className="grid gap-6 md:grid-cols-2">
          {localServices.map(({ type, icon: Icon, title, summary, destinations, details }) => (
            <article key={type} className="flex flex-col rounded-2xl border bg-white p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-lagoon-100 text-lagoon-600">
                  <Icon className="size-6" aria-hidden />
                </span>
                <div>
                  <h2 className="text-lg font-bold text-navy-900">{title}</h2>
                  <p className="mt-1 text-sm text-slate-600">{summary}</p>
                </div>
              </div>
              <p className="mt-4 flex flex-wrap items-center gap-1.5 text-sm">
                <MapPinIcon className="size-4 text-sunset-600" aria-hidden />
                <span className="sr-only">Destinations:</span>
                {destinations.map((d) => (
                  <span key={d} className="rounded-md bg-navy-50 px-2 py-0.5 text-xs font-semibold text-navy-900">{d}</span>
                ))}
              </p>
              <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-slate-700">
                {details.map((d) => <li key={d}>{d}</li>)}
              </ul>
              {type === "HOURLY" && (
                <p className="mt-4 rounded-xl bg-sunset-100 px-4 py-3">
                  <Suspense fallback={<Skeleton className="h-8 w-48" />}><HourlyRate /></Suspense>
                </p>
              )}
              <Button asChild variant="outline" className="mt-5 w-fit">
                {/* Plain anchor: same-page link that changes the query + hash; reload preselects the form server-side. */}
                <a href={`/services?type=${type}#request`}>Request this trip <ArrowRightIcon /></a>
              </Button>
            </article>
          ))}
        </div>
        <div className="mt-8 grid gap-3">
          <DemoNote>
            Local trip availability, service area and prices are placeholders. Medical rides are for non-emergency
            appointments only — in an emergency, call 911. Wheelchair-accessible vehicles are not yet confirmed.
          </DemoNote>
          <p className="text-xs text-muted-foreground">
            Store names are used only to describe destinations. Tommy&rsquo;s Bus is not affiliated with Walmart or any
            retailer, pharmacy or medical provider.
          </p>
        </div>
      </Section>
      <div className="bg-navy-50/60">
        <Section className="grid gap-10 lg:grid-cols-[1fr_1.5fr]">
          <div id="request" className="scroll-mt-28">
            <h2 className="text-3xl font-extrabold text-navy-900">Request a local trip</h2>
            <p className="mt-3 text-slate-600">
              Tell us the date, time and where you&rsquo;re going. We&rsquo;ll call to confirm pickup details and price.
              Requests are not bookings until confirmed.
            </p>
            <p className="mt-4 text-sm text-slate-600">
              Travelling with a larger group? <Link className="font-semibold text-lagoon-600 underline" href="/charters">Request a private charter</Link>.
            </p>
          </div>
          <Suspense fallback={<Skeleton className="h-[36rem] rounded-2xl" />}>
            <RequestFormLoader searchParams={searchParams} />
          </Suspense>
        </Section>
      </div>
    </>
  );
}
