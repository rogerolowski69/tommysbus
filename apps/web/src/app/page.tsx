import { CalendarClockIcon, MailIcon, PhoneIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";

import { HeroSearch } from "@/components/booking/hero-search";
import { Benefits, CharterPromo, FaqList, LocalTripsPromo, SectionHeading, Testimonials } from "@/components/home/sections";
import { RouteCard, RouteCardSkeleton } from "@/components/routes/route-card";
import { ApiUnavailable } from "@/components/shared/api-error";
import { Section } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { attempt, getLocations, getRoutes } from "@/lib/api/server";
import { todayIso } from "@/lib/format";
import { site } from "@/lib/site";

async function HeroSearchLoader() {
  const data = await attempt(Promise.all([getLocations(), getRoutes()]));
  if (!data) return <ApiUnavailable what="the trip search" />;
  const [locations, routes] = data;
  return <HeroSearch locations={locations} routes={routes} today={todayIso()} />;
}

async function FeaturedRoutes() {
  const all = await attempt(getRoutes());
  if (!all) return <ApiUnavailable what="routes" />;
  const routes = all.filter((r) => r.destination.slug !== "mco").slice(0, 6);
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {routes.map((r) => <RouteCard key={r.id} route={r} />)}
    </div>
  );
}

function SearchSkeleton() {
  return <div className="h-[22rem] animate-pulse rounded-2xl bg-white/90 shadow-2xl" aria-label="Loading trip search" />;
}

export default function HomePage() {
  return (
    <>
      <section className="relative overflow-hidden bg-navy-900 text-white">
        <div aria-hidden className="absolute -left-24 top-10 size-96 rounded-full bg-lagoon-600/30 blur-3xl" />
        <div aria-hidden className="absolute -right-24 -top-24 size-96 rounded-full bg-sunset-500/20 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:py-20">
          <div>
            <p className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-sunset-500 ring-1 ring-white/15">
              Palatka · Ocala · Orlando
            </p>
            <h1 className="mt-4 text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">
              Your Ride Across <span className="text-sunset-500">Central Florida.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-navy-100">
              Scheduled regional shuttles between North Central Florida towns and Orlando, plus private charters for
              groups of every size. Search a date, pick a seat, go.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild size="lg" className="h-12 bg-sunset-500 px-6 font-bold text-navy-950 hover:bg-sunset-600">
                <Link href="/book">Book a Shuttle</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 border-white/40 bg-transparent px-6 text-white hover:bg-white/10 hover:text-white">
                <Link href="/routes">View Schedules</Link>
              </Button>
              <Button asChild size="lg" variant="ghost" className="h-12 px-4 text-white underline-offset-4 hover:bg-transparent hover:text-sunset-500 hover:underline">
                <Link href="/charters">Request a Charter Quote</Link>
              </Button>
            </div>
            <Image
              src="/images/hero-shuttle.svg"
              alt="Illustration of a Tommy's Bus shuttle on a Florida highway"
              width={640}
              height={420}
              priority
              className="mt-10 hidden w-full max-w-lg rounded-3xl shadow-2xl lg:block"
            />
          </div>
          <div>
            <Suspense fallback={<SearchSkeleton />}>
              <HeroSearchLoader />
            </Suspense>
          </div>
        </div>
      </section>

      <Section>
        <SectionHeading eyebrow="Featured routes" title="Where we go">
          Daily demo departures connecting Palatka, Ocala and Orlando. Times and fares are placeholders pending operator
          validation.
        </SectionHeading>
        <Suspense fallback={<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map((i) => <RouteCardSkeleton key={i} />)}</div>}>
          <FeaturedRoutes />
        </Suspense>
        <div className="mt-8 text-center">
          <Button asChild variant="outline" size="lg"><Link href="/routes">All routes & schedules</Link></Button>
        </div>
      </Section>

      <div className="bg-navy-50/60">
        <Section>
          <SectionHeading eyebrow="Local trips" title="Rides for everyday errands">
            Medical appointments in Gainesville or Jacksonville, grocery and pharmacy runs to Crescent City or Palatka,
            Walmart trips, or a driver by the hour.
          </SectionHeading>
          <LocalTripsPromo />
        </Section>
      </div>

      <div>
        <Section>
          <SectionHeading eyebrow="Why ride with us" title="Regional travel, without the hassle" />
          <Benefits />
        </Section>
      </div>

      <Section>
        <CharterPromo />
      </Section>

      <Section className="pt-0">
        <SectionHeading eyebrow="Rider feedback" title="What riders could say" />
        <Testimonials />
      </Section>

      <div className="bg-navy-50/60">
        <Section className="grid gap-10 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <SectionHeading eyebrow="FAQ" title="Good to know before you go" />
            <Button asChild variant="outline"><Link href="/faq">See all FAQs</Link></Button>
          </div>
          <FaqList limit={5} />
        </Section>
      </div>

      <Section>
        <div className="grid gap-6 rounded-3xl border bg-white p-6 shadow-sm sm:p-10 md:grid-cols-3">
          <div className="md:col-span-1">
            <h2 className="text-2xl font-extrabold text-navy-900">Questions? Get in touch.</h2>
            <p className="mt-2 text-sm text-muted-foreground">Placeholder contact details for this demo.</p>
          </div>
          <a href={site.phoneHref} className="flex items-center gap-3 rounded-2xl bg-navy-50 p-4 hover:bg-navy-100">
            <PhoneIcon className="size-6 text-lagoon-600" /><span><span className="block text-xs text-muted-foreground">Call</span><span className="font-semibold text-navy-900">{site.phone}</span></span>
          </a>
          <a href={`mailto:${site.email}`} className="flex items-center gap-3 rounded-2xl bg-navy-50 p-4 hover:bg-navy-100">
            <MailIcon className="size-6 text-lagoon-600" /><span><span className="block text-xs text-muted-foreground">Email</span><span className="font-semibold text-navy-900">{site.email}</span></span>
          </a>
          <p className="flex items-center gap-2 text-sm text-slate-600 md:col-span-3">
            <CalendarClockIcon className="size-4" /> {site.hours}
          </p>
        </div>
      </Section>
    </>
  );
}
