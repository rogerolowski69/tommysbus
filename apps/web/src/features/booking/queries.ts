"use client";

import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";

import { api, unwrap } from "@/lib/api/client";
import type { BookingCreateRequest, QuoteRequest } from "@/lib/api/types";

export function useTrips(params: { origin: string; destination: string; date: string } | null) {
  return useQuery({
    queryKey: ["trips", params],
    queryFn: () => unwrap(api.GET("/api/v1/trips/", { params: { query: params! } })),
    enabled: !!params,
    placeholderData: keepPreviousData,
    staleTime: 15_000,
  });
}

export function useQuote(body: QuoteRequest | null) {
  return useQuery({
    queryKey: ["quote", body],
    queryFn: () => unwrap(api.POST("/api/v1/quotes/", { body: body! })),
    enabled: !!body,
    retry: false,
  });
}

export function useCreateBooking() {
  return useMutation({
    mutationFn: ({ body, idempotencyKey }: { body: BookingCreateRequest; idempotencyKey: string }) =>
      unwrap(
        api.POST("/api/v1/bookings/", {
          body,
          params: { header: { "Idempotency-Key": idempotencyKey } },
        }),
      ),
    retry: (count, error) => count < 2 && "status" in error && (error as { status: number }).status >= 500,
  });
}

export function useBooking(reference: string | null, token: string | null) {
  return useQuery({
    queryKey: ["booking", reference],
    queryFn: () =>
      unwrap(
        api.GET("/api/v1/bookings/{reference}/", {
          params: { path: { reference: reference! }, header: { "X-Booking-Token": token! } },
        }),
      ),
    enabled: !!reference && !!token,
    retry: false,
  });
}

export function useCancelBooking(reference: string, token: string) {
  return useMutation({
    mutationFn: () =>
      unwrap(
        api.POST("/api/v1/bookings/{reference}/cancel/", {
          params: { path: { reference }, header: { "X-Booking-Token": token } },
        }),
      ),
  });
}
