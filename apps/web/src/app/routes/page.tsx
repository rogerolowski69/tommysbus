import type { Metadata } from "next";
import { Suspense } from "react";

import { RouteCardSkeleton } from "@/components/routes/route-card";
import { RouteExplorer } from "@/components/routes/route-explorer";
import { Timetable } from "@/components/routes/timetable";
import { ApiUnavailable } from "@/components/shared/api-error";
import { DemoNote, PageHeader, Section } from "@/components/shared/page-header";
import { attempt, getRoutes } from "@/lib/api/server";

export const metadata: Metadata = {
  title: "Routes & Schedules",
  description: "Scheduled shuttle routes between Palatka, Ocala and Orlando with sample daily departure times.",
  alternates: { canonical: "/routes" },
};

async function RoutesContent() {
  const data = await attempt(getRoutes());
  if (!data) return <ApiUnavailable what="routes" />;
  const routes = data;
  return (
    <>
      <RouteExplorer routes={routes} />
      <h2 className="mt-16 text-2xl font-extrabold text-navy-900">Sample daily timetables</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Arrival times are estimates and depend on traffic and weather. All times Eastern.
      </p>
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        {routes.map((r) => <Timetable key={r.id} route={r} />)}
      </div>
    </>
  );

}

export default function RoutesPage() {
  return (
    <>
      <PageHeader eyebrow="Routes & Schedules" title="Scheduled service across Central Florida">
        Direct shuttles linking Palatka, Ocala and Orlando, with drop-off service toward the Orlando International
        Airport area.
      </PageHeader>
      <Section>
        <div className="mb-8">
          <DemoNote>
            Schedules, stop locations and travel durations are placeholders pending operator validation. No airport
            pickups are offered.
          </DemoNote>
        </div>
        <Suspense fallback={<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2, 3, 4, 5].map((i) => <RouteCardSkeleton key={i} />)}</div>}>
          <RoutesContent />
        </Suspense>
      </Section>
    </>
  );
}
