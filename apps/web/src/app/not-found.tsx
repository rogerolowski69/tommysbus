import Link from "next/link";

import { Section } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <Section className="text-center">
      <p className="text-sm font-semibold uppercase tracking-wider text-lagoon-600">404</p>
      <h1 className="mt-2 text-4xl font-extrabold text-navy-900">This stop isn&rsquo;t on our route</h1>
      <p className="mt-3 text-slate-600">The page you&rsquo;re looking for doesn&rsquo;t exist.</p>
      <div className="mt-6 flex justify-center gap-3">
        <Button asChild><Link href="/">Home</Link></Button>
        <Button asChild variant="outline"><Link href="/routes">View Schedules</Link></Button>
      </div>
    </Section>
  );
}
