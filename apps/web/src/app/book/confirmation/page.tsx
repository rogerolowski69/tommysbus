import type { Metadata } from "next";
import { Suspense } from "react";

import { ConfirmationView } from "@/components/booking/confirmation-view";
import { Section } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Reservation confirmation",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default function ConfirmationPage() {
  return (
    <Section className="max-w-5xl">
      <h1 className="sr-only">Reservation confirmation</h1>
      <Suspense fallback={<Skeleton className="h-96 rounded-2xl" />}>
        <ConfirmationView />
      </Suspense>
    </Section>
  );
}
