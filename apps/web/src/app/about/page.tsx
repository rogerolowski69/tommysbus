import type { Metadata } from "next";
import Link from "next/link";

import { DemoNote, PageHeader, Section } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "About",
  description: "Tommy's Bus is a planned regional shuttle and charter service for Central and Northeast Florida.",
  alternates: { canonical: "/about" },
};

const principles = [
  { title: "Connect smaller communities", body: "Give riders in Putnam and Marion counties a straightforward way to reach Orlando and back without a long drive." },
  { title: "Be transparent", body: "Publish schedules, stop locations and per-seat fares up front, with no surprises at checkout." },
  { title: "Make booking easy", body: "Let riders reserve online in minutes on any device, and reach a real person when they need one." },
];

export default function AboutPage() {
  return (
    <>
      <PageHeader eyebrow="About" title="Regional travel, planned around riders">
        Tommy&rsquo;s Bus is a proposed shuttle and charter service for Palatka, Ocala, Orlando and the surrounding
        region.
      </PageHeader>
      <Section className="grid gap-12 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-5 text-lg leading-relaxed text-slate-700">
          <p>
            Many towns between Northeast Florida and Orlando have no direct public transit to the region&rsquo;s
            biggest city and its airport. Tommy&rsquo;s Bus is being planned to fill that gap with scheduled shuttle
            departures and private group charters.
          </p>
          <p>
            This website is an early demonstration of how riders would search departures, reserve seats, check fares
            and request charters. Routes, timetables, stops and prices shown here are working placeholders, and
            will be updated once operations, vehicles and permits are finalized.
          </p>
          <DemoNote>
            We don&rsquo;t publish claims about licensing, insurance, fleet or history until they are verified. Ask us
            directly for current status.
          </DemoNote>
        </div>
        <div className="space-y-4">
          {principles.map((p) => (
            <div key={p.title} className="rounded-2xl border bg-white p-5 shadow-sm">
              <h2 className="font-bold text-navy-900">{p.title}</h2>
              <p className="mt-1 text-sm text-slate-600">{p.body}</p>
            </div>
          ))}
          <div className="flex flex-wrap gap-3 pt-2">
            <Button asChild><Link href="/routes">See planned routes</Link></Button>
            <Button asChild variant="outline"><Link href="/contact">Contact us</Link></Button>
          </div>
        </div>
      </Section>
    </>
  );
}
