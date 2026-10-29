import Link from "next/link";

import { Button } from "@/components/ui/button";
import { DEMO_NOTICE } from "@/lib/site";

import { Logo } from "./logo";
import { MobileNav } from "./mobile-nav";
import { NavLinks } from "./nav-links";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 print:hidden">
      <div className="bg-navy-950 px-4 py-1.5 text-center text-xs text-navy-100">
        <span className="font-semibold text-sunset-500">DEMO</span> · {DEMO_NOTICE}
      </div>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />
        <nav aria-label="Main" className="hidden xl:block">
          <NavLinks />
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild className="hidden bg-sunset-500 font-semibold text-navy-950 hover:bg-sunset-600 sm:inline-flex">
            <Link href="/book">Book a Shuttle</Link>
          </Button>
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
