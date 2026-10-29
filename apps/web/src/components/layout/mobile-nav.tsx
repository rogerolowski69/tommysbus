"use client";

import { MenuIcon, PhoneIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { site } from "@/lib/site";

import { NavLinks } from "./nav-links";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="xl:hidden" aria-label="Open menu">
          <MenuIcon className="size-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-80 max-w-[85vw]">
        <SheetHeader>
          <SheetTitle>Tommy&rsquo;s Bus</SheetTitle>
          <SheetDescription>Your Ride Across Central Florida.</SheetDescription>
        </SheetHeader>
        <nav aria-label="Mobile" className="px-4">
          <NavLinks orientation="vertical" onNavigate={() => setOpen(false)} />
        </nav>
        <div className="mt-auto flex flex-col gap-2 p-4">
          <Button asChild size="lg" className="bg-sunset-500 text-navy-950 hover:bg-sunset-600">
            <Link href="/book" onClick={() => setOpen(false)}>Book a Shuttle</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <a href={site.phoneHref}>
              <PhoneIcon /> {site.phone}
            </a>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
