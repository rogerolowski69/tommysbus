import { MailIcon, MapPinIcon, PhoneIcon } from "lucide-react";
import Link from "next/link";

import { mainNav, site } from "@/lib/site";

import { Logo } from "./logo";

export function SiteFooter() {
  return (
    <footer className="mt-auto bg-navy-950 text-navy-100 print:hidden">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo inverted />
          <p className="mt-4 max-w-md text-sm leading-relaxed">
            {site.tagline} Scheduled regional shuttles and private charters across Central and Northeast Florida.
          </p>
          <p className="mt-4 max-w-md rounded-lg border border-white/10 bg-white/5 p-3 text-xs leading-relaxed">
            This is a demonstration website. Schedules, stops, fares, vehicle capacities, testimonials and contact
            details are placeholders and do not describe an active commercial service. No payments are processed.
          </p>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-white">Explore</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {mainNav.slice(1).map((item) => (
              <li key={item.href}>
                <Link className="hover:text-white hover:underline" href={item.href}>{item.label}</Link>
              </li>
            ))}
            <li><Link className="hover:text-white hover:underline" href="/faq">FAQ</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-white">Contact (placeholder)</h2>
          <ul className="mt-3 space-y-3 text-sm">
            <li className="flex gap-2"><PhoneIcon className="size-4 shrink-0" /><a className="hover:text-white" href={site.phoneHref}>{site.phone}</a></li>
            <li className="flex gap-2"><MailIcon className="size-4 shrink-0" /><a className="hover:text-white" href={`mailto:${site.email}`}>{site.email}</a></li>
            <li className="flex gap-2"><MapPinIcon className="size-4 shrink-0" />{site.serviceArea}</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 px-4 py-5 text-center text-xs text-navy-100/70">
        Tommy&rsquo;s Bus · tommysbus.com · Demonstration build
      </div>
    </footer>
  );
}
