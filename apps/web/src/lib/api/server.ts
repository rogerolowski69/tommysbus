import "server-only";

import { connection } from "next/server";
import createClient from "openapi-fetch";

import { toApiError } from "./errors";
import type { paths } from "./schema";
import type { Fare, Location, PricingPolicy, Route } from "./types";

const baseUrl = process.env.API_INTERNAL_URL ?? "http://127.0.0.1:8000";

// Uncached on purpose: admins edit demo fares/schedules and expect them live.
// Callers render inside <Suspense> so the static shell still streams instantly.
const server = createClient<paths>({ baseUrl, fetch: (req) => fetch(req, { cache: "no-store" }) });

async function get<T>(request: () => Promise<{ data?: T; error?: unknown; response: Response }>): Promise<T> {
  await connection(); // live data: always render at request time
  const { data, error, response } = await request();
  if (!response.ok || data === undefined) throw toApiError(response.status, error);
  return data;
}

export const getLocations = (): Promise<Location[]> => get(() => server.GET("/api/v1/locations/"));
export const getRoutes = (): Promise<Route[]> => get(() => server.GET("/api/v1/routes/"));
export const getFares = (): Promise<Fare[]> => get(() => server.GET("/api/v1/fares/"));
export const getPricingPolicy = (): Promise<PricingPolicy> => get(() => server.GET("/api/v1/pricing-policy/"));

/** Resolve to ``null`` instead of throwing, so pages can render a fallback outside try/catch. */
export async function attempt<T>(promise: Promise<T>): Promise<T | null> {
  try {
    return await promise;
  } catch {
    return null;
  }
}
