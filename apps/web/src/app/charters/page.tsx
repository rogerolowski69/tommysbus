import { connection } from "next/server";
import { BriefcaseIcon, GraduationCapIcon, HeartIcon, TrophyIcon } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";

import { CharterForm } from "@/components/charters/charter-form";
import { DemoNote, PageHeader, Section } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { todayIso } from "@/lib/format";

export const metadata: Metadata = {
  title: "Private Charters",
  description: "Request a private charter quote for group travel across Central and Northeast Florida.",
  alternates: { canonical: "/charters" },
};

const uses = [
  { icon: GraduationCapIcon, title: "Schools & youth groups", body: "Field trips, camps and competitions." },
  { icon: BriefcaseIcon, title: "Corporate & events", body: "Conference shuttles, team outings and offsites." },
  { icon: HeartIcon, title: "Weddings & celebrations", body: "Move guests between venues and hotels." },
  { icon: TrophyIcon, title: "Game days & tours", body: "Stadiums, theme parks, beaches and day trips." },
];

async function CharterFormLoader() {
  await connection(); // "today" must be computed per request, not at build time
  return <CharterForm today={todayIso()} />;
}

export default function ChartersPage() {
  return (
    <>
      <PageHeader eyebrow="Private charters" title="A bus for your whole group">
        Tell us about your trip and we&rsquo;ll follow up with availability and a custom quote.
      </PageHeader>
      <Section className="grid gap-12 lg:grid-cols-[1fr_1.5fr]">
        <div>
          <h2 className="text-2xl font-extrabold text-navy-900">Popular charter trips</h2>
          <ul className="mt-6 grid gap-4">
            {uses.map(({ icon: Icon, title, body }) => (
              <li key={title} className="flex gap-4 rounded-2xl border bg-white p-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-sunset-100 text-sunset-600"><Icon className="size-5" aria-hidden /></span>
                <span><span className="block font-semibold text-navy-900">{title}</span><span className="text-sm text-slate-600">{body}</span></span>
              </li>
            ))}
          </ul>
          <div className="mt-6">
            <DemoNote>
              Charter availability, vehicle types and pricing are not yet established. Submitting this form does not
              create a booking or a commitment.
            </DemoNote>
          </div>
        </div>
        <div>
          <h2 className="mb-4 text-2xl font-extrabold text-navy-900">Request a quote</h2>
          <Suspense fallback={<Skeleton className="h-[34rem] rounded-2xl" />}>
            <CharterFormLoader />
          </Suspense>
        </div>
      </Section>
    </>
  );
}
