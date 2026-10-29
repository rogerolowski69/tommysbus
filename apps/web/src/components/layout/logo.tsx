import Link from "next/link";

import { cn } from "@/lib/utils";

export function BusMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true" className={cn("size-9", className)}>
      <rect width="40" height="40" rx="10" className="fill-sunset-500" />
      <rect x="8" y="10" width="24" height="17" rx="4" className="fill-navy-900" />
      <rect x="11" y="13" width="8" height="6" rx="1.5" fill="white" />
      <rect x="21" y="13" width="8" height="6" rx="1.5" fill="white" />
      <circle cx="14" cy="29" r="3" className="fill-navy-900" />
      <circle cx="26" cy="29" r="3" className="fill-navy-900" />
    </svg>
  );
}

export function Logo({ inverted = false }: { inverted?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5 rounded-lg" aria-label="Tommy's Bus — home">
      <BusMark />
      <span className={cn("text-xl font-extrabold tracking-tight", inverted ? "text-white" : "text-navy-900")}>
        Tommy&rsquo;s <span className="text-sunset-600">Bus</span>
      </span>
    </Link>
  );
}
