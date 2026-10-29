import type { components } from "@/lib/api/schema";
import { formatMoney } from "@/lib/format";

type LineItem = components["schemas"]["LineItem"];

export function PriceBreakdown({ items, total, currency }: { items: readonly LineItem[]; total: string; currency: string }) {
  return (
    <dl className="grid gap-2 text-sm">
      {items.map((li, i) => (
        <div key={i} className="flex justify-between gap-4">
          <dt className="text-slate-600">{li.label}{li.kind === "fare" && <> × {li.quantity}</>}</dt>
          <dd className={li.kind === "discount" ? "text-lagoon-600" : "text-slate-900"}>{formatMoney(li.amount, currency)}</dd>
        </div>
      ))}
      <div className="mt-2 flex justify-between gap-4 border-t pt-3 text-base font-bold text-navy-900">
        <dt>Total</dt>
        <dd>{formatMoney(total, currency)}</dd>
      </div>
    </dl>
  );
}
