import { AlertTriangleIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function ApiUnavailable({ what }: { what: string }) {
  return (
    <Alert variant="destructive">
      <AlertTriangleIcon />
      <AlertTitle>Couldn&rsquo;t load {what}</AlertTitle>
      <AlertDescription>The reservations service isn&rsquo;t responding. Please try again shortly.</AlertDescription>
    </Alert>
  );
}
