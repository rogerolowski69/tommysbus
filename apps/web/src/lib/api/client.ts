"use client";

import createClient from "openapi-fetch";

import { toApiError } from "./errors";
import type { paths } from "./schema";

/** Browser client. Requests go same-origin to /api/v1/* which Next.js proxies to Django. */
export const api = createClient<paths>({ baseUrl: "" });

/** Unwrap an openapi-fetch result, throwing a typed ApiError on failure. */
export async function unwrap<T>(
  promise: Promise<{ data?: T; error?: unknown; response: Response }>,
): Promise<T> {
  const { data, error, response } = await promise;
  if (!response.ok || data === undefined) throw toApiError(response.status, error);
  return data;
}
