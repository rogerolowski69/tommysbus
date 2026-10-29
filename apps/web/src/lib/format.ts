/** All schedule times are shown in the operating time zone, on server and client alike. */
export const SERVICE_TIME_ZONE = "America/New_York";

const timeFmt = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: SERVICE_TIME_ZONE });
const dateFmt = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: SERVICE_TIME_ZONE,
});
const isoDateFmt = new Intl.DateTimeFormat("en-CA", { timeZone: SERVICE_TIME_ZONE });

export const formatTime = (iso: string) => timeFmt.format(new Date(iso));
export const formatDate = (iso: string) => dateFmt.format(new Date(iso));
export const formatDateTime = (iso: string) => `${formatDate(iso)} · ${formatTime(iso)}`;

/** "2026-11-02" → "Mon, Nov 2, 2026" without time-zone drift. */
export const formatIsoDate = (yyyyMmDd: string) => dateFmt.format(new Date(`${yyyyMmDd}T12:00:00Z`));

/** Today's date (YYYY-MM-DD) in the service time zone. */
export const todayIso = () => isoDateFmt.format(new Date());

export function addDaysIso(yyyyMmDd: string, days: number): string {
  const d = new Date(`${yyyyMmDd}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** "08:30" → "8:30 AM" */
export function formatClock(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return [h ? `${h} hr` : "", m ? `${m} min` : ""].filter(Boolean).join(" ") || "0 min";
}

export function formatMoney(amount: string | number | null | undefined, currency = "USD"): string {
  if (amount === null || amount === undefined || amount === "") return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(Number(amount));
}
