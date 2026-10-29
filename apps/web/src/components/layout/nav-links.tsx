"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { mainNav } from "@/lib/site";
import { cn } from "@/lib/utils";

export function NavLinks({ orientation = "horizontal", onNavigate }: {
  orientation?: "horizontal" | "vertical";
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  return (
    <ul className={cn("flex", orientation === "horizontal" ? "items-center gap-1" : "flex-col gap-1")}>
      {mainNav.map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "block rounded-md px-2.5 py-2 text-sm font-medium whitespace-nowrap transition-colors",
                orientation === "vertical" && "text-base",
                active ? "bg-navy-50 text-navy-900" : "text-slate-600 hover:bg-navy-50 hover:text-navy-900",
              )}
            >
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
