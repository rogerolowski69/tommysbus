import { CheckIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export const STEPS = ["Trip", "Departure", "Passenger", "Review", "Confirmation"] as const;

export function Stepper({ current }: { current: number }) {
  return (
    <nav aria-label="Booking progress" className="print:hidden">
      <ol className="flex items-center gap-1 sm:gap-2">
        {STEPS.map((label, i) => {
          const n = i + 1;
          const done = n < current;
          const active = n === current;
          return (
            <li key={label} className="flex flex-1 items-center gap-1 sm:gap-2" aria-current={active ? "step" : undefined}>
              <span
                className={cn(
                  "grid size-8 shrink-0 place-items-center rounded-full text-sm font-bold ring-2",
                  done && "bg-lagoon-600 text-white ring-lagoon-600",
                  active && "bg-sunset-500 text-navy-950 ring-sunset-500",
                  !done && !active && "bg-white text-slate-400 ring-slate-200",
                )}
              >
                {done ? <CheckIcon className="size-4" aria-hidden /> : n}
              </span>
              <span className={cn("hidden text-sm font-medium md:inline", active ? "text-navy-900" : "text-slate-500")}>
                {label}
                {done && <span className="sr-only"> (completed)</span>}
              </span>
              {n < STEPS.length && <span aria-hidden className={cn("h-0.5 flex-1 rounded", done ? "bg-lagoon-600" : "bg-slate-200")} />}
            </li>
          );
        })}
      </ol>
      <p className="mt-2 text-sm font-medium text-navy-900 md:hidden">
        Step {current} of {STEPS.length}: {STEPS[current - 1]}
      </p>
    </nav>
  );
}
