"use client";

import { create } from "zustand";

import type { Trip } from "@/lib/api/types";
import type { PassengerDetails, TripSearch } from "@/lib/validation/booking";

export type WizardStep = 1 | 2 | 3 | 4;

type BookingState = {
  step: WizardStep;
  search: TripSearch | null;
  outbound: Trip | null;
  inbound: Trip | null;
  passenger: PassengerDetails | null;
  /** Generated once per reviewed selection so retries never double-book. */
  idempotencyKey: string | null;

  setSearch: (search: TripSearch) => void;
  selectOutbound: (trip: Trip | null) => void;
  selectInbound: (trip: Trip | null) => void;
  setPassenger: (details: PassengerDetails) => void;
  ensureIdempotencyKey: () => string;
  goTo: (step: WizardStep) => void;
  reset: () => void;
};

const initial = {
  step: 1 as WizardStep,
  search: null,
  outbound: null,
  inbound: null,
  passenger: null,
  idempotencyKey: null,
};

// Kept in memory only: passenger PII is never written to browser storage.
export const useBookingStore = create<BookingState>()((set, get) => ({
  ...initial,
  setSearch: (search) => set({ search, outbound: null, inbound: null, idempotencyKey: null, step: 2 }),
  selectOutbound: (outbound) =>
    set((s) => ({
      outbound,
      // A return that now departs before the outbound arrives is no longer valid.
      inbound:
        s.inbound && outbound && s.inbound.departure_datetime < outbound.arrival_datetime ? null : s.inbound,
      idempotencyKey: null,
    })),
  selectInbound: (inbound) => set({ inbound, idempotencyKey: null }),
  setPassenger: (passenger) => set({ passenger, idempotencyKey: null, step: 4 }),
  ensureIdempotencyKey: () => {
    const existing = get().idempotencyKey;
    if (existing) return existing;
    const key = crypto.randomUUID();
    set({ idempotencyKey: key });
    return key;
  },
  goTo: (step) => set({ step }),
  reset: () => set(initial),
}));
