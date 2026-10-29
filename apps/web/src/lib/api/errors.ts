/** Turn a DRF error body into a single human-readable message. */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
    readonly fields: Record<string, string[]> = {},
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function flatten(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(flatten);
  if (value && typeof value === "object") return Object.values(value).flatMap(flatten);
  return [];
}

export function toApiError(status: number, body: unknown): ApiError {
  if (status === 429) return new ApiError("Too many requests — please wait a moment and try again.", status, "throttled");
  if (body && typeof body === "object") {
    const { detail, code, ...rest } = body as { detail?: unknown; code?: unknown } & Record<string, unknown>;
    const fields: Record<string, string[]> = {};
    for (const [key, value] of Object.entries(rest)) fields[key] = flatten(value);
    const message =
      (typeof detail === "string" && detail) ||
      Object.entries(fields)
        .map(([k, v]) => (k === "non_field_errors" ? v.join(" ") : `${k.replace(/_/g, " ")}: ${v.join(" ")}`))
        .join(" ") ||
      "Something went wrong.";
    return new ApiError(message, status, typeof code === "string" ? code : undefined, fields);
  }
  return new ApiError(status >= 500 ? "The booking service is unavailable right now." : "Request failed.", status);
}
