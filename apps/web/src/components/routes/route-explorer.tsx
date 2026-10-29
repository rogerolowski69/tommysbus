"use client";

import { SearchIcon } from "lucide-react";
import { useDeferredValue, useState } from "react";

import { Input } from "@/components/ui/input";
import type { Route } from "@/lib/api/types";

import { RouteCard } from "./route-card";

function matches(route: Route, q: string) {
  const hay = [route.name, route.origin.city, route.origin.name, route.destination.city, route.destination.name]
    .join(" ")
    .toLowerCase();
  return q
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => hay.includes(term));
}

export function RouteExplorer({ routes }: { routes: Route[] }) {
  const [query, setQuery] = useState("");
  const deferred = useDeferredValue(query);
  const visible = routes.filter((r) => matches(r, deferred));
  return (
    <div>
      <div className="relative max-w-md">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <label htmlFor="route-search" className="sr-only">Search routes by city</label>
        <Input
          id="route-search"
          type="search"
          placeholder="Search by city, e.g. “Ocala”"
          className="h-11 pl-9"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <p className="mt-3 text-sm text-muted-foreground" aria-live="polite">
        {visible.length} {visible.length === 1 ? "route" : "routes"} found
      </p>
      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((r) => <RouteCard key={r.id} route={r} />)}
      </div>
    </div>
  );
}
