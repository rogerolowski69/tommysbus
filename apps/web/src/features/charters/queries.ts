"use client";

import { useMutation } from "@tanstack/react-query";

import { api, unwrap } from "@/lib/api/client";
import type { CharterInquiryRequest } from "@/lib/api/types";

export function useSubmitCharter() {
  return useMutation({
    mutationFn: (body: CharterInquiryRequest) => unwrap(api.POST("/api/v1/charter-inquiries/", { body })),
  });
}
