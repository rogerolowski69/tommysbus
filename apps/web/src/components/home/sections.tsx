import {
  ArrowRightIcon,
  BusFrontIcon,
  CalendarCheckIcon,
  LuggageIcon,
  MapPinnedIcon,
  QuoteIcon,
  ShieldCheckIcon,
  UsersIcon,
} from "lucide-react";
import Link from "next/link";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { faqs, testimonials } from "@/lib/content";
import { localServices } from "@/lib/services";

const benefits = [
  { icon: CalendarCheckIcon, title: "Reserve in minutes", body: "Pick a departure, see live seat counts and get a booking reference right away." },
  { icon: MapPinnedIcon, title: "Clear pickup points", body: "Every stop lists an address, map link and boarding instructions." },
  { icon: LuggageIcon, title: "Simple baggage rules", body: "A checked bag and a personal item are included with every fare." },
  { icon: UsersIcon, title: "Group friendly", body: "Group rates for six or more, and private charters for bigger plans." },
];

export function Benefits() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {benefits.map(({ icon: Icon, title, body }) => (
        <div key={title} className="rounded-2xl border bg-white p-6 shadow-sm">
          <span className="grid size-11 place-items-center rounded-xl bg-lagoon-100 text-lagoon-600">
            <Icon className="size-6" aria-hidden />
          </span>
          <h3 className="mt-4 font-bold text-navy-900">{title}</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{body}</p>
        </div>
      ))}
    </div>
  );
}

export function CharterPromo() {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-navy-900 px-6 py-10 text-white sm:px-10 lg:flex lg:items-center lg:justify-between lg:gap-10">
      <div aria-hidden className="absolute -right-10 -top-10 size-64 rounded-full bg-sunset-500/25 blur-2xl" />
      <div className="relative max-w-2xl">
        <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-sunset-500">
          <BusFrontIcon className="size-4" /> Private charters
        </p>
        <h2 className="mt-2 text-3xl font-extrabold">Moving a team, a congregation or a wedding party?</h2>
        <p className="mt-3 text-navy-100">
          Tell us where and when. We&rsquo;ll follow up with availability and a custom quote for your group — school
          trips, corporate events, game days and more.
        </p>
      </div>
      <Button asChild size="lg" className="relative mt-6 h-12 bg-sunset-500 px-6 font-bold text-navy-950 hover:bg-sunset-600 lg:mt-0">
        <Link href="/charters">Request a Charter Quote <ArrowRightIcon /></Link>
      </Button>
    </div>
  );
}

export function LocalTripsPromo() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {localServices.map(({ type, icon: Icon, title, summary, destinations }) => (
        <Link
          key={type}
          href={`/services?type=${type}#request`}
          className="group flex flex-col rounded-2xl border bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
        >
          <span className="grid size-11 place-items-center rounded-xl bg-sunset-100 text-sunset-600">
            <Icon className="size-6" aria-hidden />
          </span>
          <h3 className="mt-4 font-bold text-navy-900">{title}</h3>
          <p className="mt-1.5 text-sm text-slate-600">{summary}</p>
          <p className="mt-3 text-xs font-semibold text-lagoon-600">{destinations.join(" · ")}</p>
          <span className="mt-auto flex items-center gap-1 pt-4 text-sm font-semibold text-navy-900 group-hover:underline">
            Request a ride <ArrowRightIcon className="size-4" />
          </span>
        </Link>
      ))}
    </div>
  );
}

export function Testimonials() {
  return (
    <div>
      <p className="mb-6 inline-flex items-center gap-2 rounded-full bg-sunset-100 px-3 py-1 text-xs font-semibold text-navy-900">
        <ShieldCheckIcon className="size-3.5" /> Fictional demo testimonials — not real customer reviews
      </p>
      <div className="grid gap-6 md:grid-cols-3">
        {testimonials.map((t) => (
          <figure key={t.name} className="rounded-2xl border bg-white p-6 shadow-sm">
            <QuoteIcon className="size-6 text-sunset-500" aria-hidden />
            <blockquote className="mt-3 text-slate-700">{t.quote}</blockquote>
            <figcaption className="mt-4 text-sm">
              <span className="font-semibold text-navy-900">{t.name}</span>
              <span className="block text-muted-foreground">{t.context}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}

export function FaqList({ limit }: { limit?: number }) {
  const items = limit ? faqs.slice(0, limit) : faqs;
  return (
    <Accordion type="single" collapsible className="rounded-2xl border bg-white px-5">
      {items.map((f, i) => (
        <AccordionItem key={f.question} value={`faq-${i}`}>
          <AccordionTrigger className="text-left text-base font-semibold text-navy-900">{f.question}</AccordionTrigger>
          <AccordionContent className="text-slate-600">{f.answer}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

export function SectionHeading({ eyebrow, title, children }: { eyebrow: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="mb-8 max-w-2xl">
      <p className="text-sm font-semibold uppercase tracking-wider text-lagoon-600">{eyebrow}</p>
      <h2 className="mt-1 text-3xl font-extrabold text-navy-900">{title}</h2>
      {children && <p className="mt-3 text-slate-600">{children}</p>}
    </div>
  );
}
