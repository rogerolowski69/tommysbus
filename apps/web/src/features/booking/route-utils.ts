import type { Location, Route } from "@/lib/api/types";

/** Locations where passengers may board (drop-off-only points excluded). */
export function pickupLocations(locations: Location[], routes: Route[]): Location[] {
  const origins = new Set(routes.map((r) => r.origin.slug));
  return locations.filter((l) => l.allows_pickup && origins.has(l.slug));
}

/** Destinations served directly from ``origin``. */
export function destinationsFrom(locations: Location[], routes: Route[], origin: string): Location[] {
  const dests = new Set(routes.filter((r) => r.origin.slug === origin).map((r) => r.destination.slug));
  return locations.filter((l) => dests.has(l.slug));
}

export function hasReverseRoute(routes: Route[], origin: string, destination: string): boolean {
  return routes.some((r) => r.origin.slug === destination && r.destination.slug === origin);
}
