import { BusFrontIcon, ClockIcon, MailIcon, PhoneIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { DemoNote, PageHeader, Section } from "@/components/shared/page-header";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact Tommy's Bus about reservations, schedules and private charters.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  const cards = [
    { icon: PhoneIcon, title: "Phone", body: <a className="font-semibold text-navy-900 hover:underline" href={site.phoneHref}>{site.phone}</a> },
    { icon: MailIcon, title: "Email", body: <a className="font-semibold text-navy-900 hover:underline" href={`mailto:${site.email}`}>{site.email}</a> },
    { icon: ClockIcon, title: "Hours", body: site.hours },
    { icon: BusFrontIcon, title: "Group travel", body: <Link className="font-semibold text-lagoon-600 underline" href="/charters">Request a charter quote</Link> },
  ];
  return (
    <>
      <PageHeader eyebrow="Contact" title="We’re here to help">
        Questions about a reservation, a route or a group trip? Reach out.
      </PageHeader>
      <Section>
        <div className="mb-8"><DemoNote>Contact details are placeholders (555-01xx numbers are reserved for fictional use).</DemoNote></div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-2xl border bg-white p-6 shadow-sm">
              <Icon className="size-6 text-lagoon-600" aria-hidden />
              <h2 className="mt-3 text-sm font-semibold uppercase tracking-wider text-slate-500">{title}</h2>
              <div className="mt-1 text-sm text-slate-700">{body}</div>
            </div>
          ))}
        </div>
        <p className="mt-10 text-slate-600">
          Have a booking already? Use the private link on your confirmation page to view or cancel it. For quick
          answers, see the <Link className="font-semibold text-lagoon-600 underline" href="/faq">FAQ</Link>.
        </p>
      </Section>
    </>
  );
}
