import { BabyIcon, ClockIcon, LuggageIcon, RepeatIcon, UsersIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { ApiUnavailable } from "@/components/shared/api-error";
import { DemoNote, PageHeader, Section } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { attempt, getFares, getPricingPolicy } from "@/lib/api/server";
import type { Fare } from "@/lib/api/types";
import { formatMoney } from "@/lib/format";

export const metadata: Metadata = {
  title: "Fares & Baggage",
  description: "One-way, round-trip, child and group fares plus baggage allowances for Tommy's Bus (demo pricing).",
  alternates: { canonical: "/fares" },
};

type Row = { slug: string; name: string; adult?: Fare; child?: Fare };

function groupByRoute(fares: Fare[]): Row[] {
  const rows = new Map<string, Row>();
  for (const f of fares) {
    const row = rows.get(f.route.slug) ?? { slug: f.route.slug, name: f.route.name };
    if (f.fare_type === "ADULT") row.adult = f;
    else row.child = f;
    rows.set(f.route.slug, row);
  }
  return [...rows.values()].sort((a, b) => a.name.localeCompare(b.name));
}

async function FareTables() {
  const data = await attempt(Promise.all([getFares(), getPricingPolicy()]));
  if (!data) return <ApiUnavailable what="fares" />;
  const [fares, policy] = data;
  const rows = groupByRoute(fares);
  const pct = (v: string) => `${Number(v)}%`;
  return (
    <>
      <div className="overflow-x-auto rounded-2xl border bg-white">
        <Table>
          <caption className="sr-only">Per-passenger fares by route</caption>
          <TableHeader>
            <TableRow className="bg-navy-50">
              <TableHead scope="col">Route</TableHead>
              <TableHead scope="col" className="text-right">Adult one-way</TableHead>
              <TableHead scope="col" className="text-right">Child one-way</TableHead>
              <TableHead scope="col" className="text-right">Adult round-trip</TableHead>
              <TableHead scope="col" className="text-right">Child round-trip</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.slug}>
                <TableCell className="font-semibold text-navy-900">{r.name}</TableCell>
                <TableCell className="text-right">{formatMoney(r.adult?.amount)}</TableCell>
                <TableCell className="text-right">{formatMoney(r.child?.amount)}</TableCell>
                <TableCell className="text-right">{formatMoney(r.adult?.round_trip_amount)}</TableCell>
                <TableCell className="text-right">{formatMoney(r.child?.round_trip_amount)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Round-trip prices include the {pct(policy.round_trip_discount_percent)} round-trip discount. &ldquo;—&rdquo;
        means no return service is scheduled (e.g. drop-off-only airport area).
      </p>

      <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <PolicyCard icon={RepeatIcon} title="Round-trip savings">
          Book both directions together and save {pct(policy.round_trip_discount_percent)} on fares.
        </PolicyCard>
        <PolicyCard icon={BabyIcon} title="Child fares">
          Children aged 2–11 ride at the child fare. Each reservation needs at least one adult.
        </PolicyCard>
        <PolicyCard icon={UsersIcon} title="Group rates">
          Groups of {policy.group_min_passengers}+ on one reservation get {pct(policy.group_discount_percent)} off
          fares. Bigger group? <Link href="/charters" className="font-semibold text-lagoon-600 underline">Get a charter quote</Link>.
        </PolicyCard>
        <PolicyCard icon={LuggageIcon} title="Baggage">
          {policy.free_bags_per_passenger} checked bag per passenger plus a personal item included. Extra checked
          bags {formatMoney(policy.extra_bag_fee)} each way, up to {policy.max_bags_per_passenger} per passenger.
        </PolicyCard>
        <PolicyCard icon={ClockIcon} title="Hire by the hour">
          {formatMoney(policy.hourly_rate)} per hour with a {policy.hourly_minimum_hours}-hour minimum. Medical,
          grocery and shopping trips are quoted on request —{" "}
          <Link href="/services" className="font-semibold text-lagoon-600 underline">see Local Trips</Link>.
        </PolicyCard>
      </div>
    </>
  );
}

function PolicyCard({ icon: Icon, title, children }: { icon: typeof RepeatIcon; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      <Icon className="size-6 text-sunset-600" aria-hidden />
      <h3 className="mt-3 font-bold text-navy-900">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{children}</p>
    </div>
  );
}

export default function FaresPage() {
  return (
    <>
      <PageHeader eyebrow="Fares" title="Simple, per-seat pricing">
        Prices are per passenger and calculated by our reservations system when you book.
      </PageHeader>
      <Section>
        <div className="mb-8">
          <DemoNote>All prices are sample values for demonstration and are not offers of service.</DemoNote>
        </div>
        <Suspense fallback={<Skeleton className="h-96 w-full rounded-2xl" />}>
          <FareTables />
        </Suspense>
        <div className="mt-12 flex flex-wrap gap-3">
          <Button asChild size="lg" className="bg-sunset-500 font-bold text-navy-950 hover:bg-sunset-600"><Link href="/book">Book a Shuttle</Link></Button>
          <Button asChild size="lg" variant="outline"><Link href="/routes">View Schedules</Link></Button>
        </div>
      </Section>
    </>
  );
}
