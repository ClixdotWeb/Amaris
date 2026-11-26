import { istDay, istDayEnd, istDayStart } from "./dates";

const DAY = 86_400_000;
export const RANGES = [
  { key: "7", label: "7 days" },
  { key: "30", label: "30 days" },
  { key: "90", label: "90 days" },
  { key: "365", label: "12 months" },
] as const;

/** Turns ?range=30 or ?from=YYYY-MM-DD&to=YYYY-MM-DD into IST day bounds (default: last 30 days). */
export function reportRange(sp: { range?: string; from?: string; to?: string }) {
  const valid = (s?: string) => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));
  const today = istDay(new Date().toISOString());
  if (valid(sp.from) && valid(sp.to) && sp.from! <= sp.to!) {
    // At most two years in one report
    const from = new Date(sp.to!).getTime() - new Date(sp.from!).getTime() > 731 * DAY ? istDay(new Date(new Date(sp.to!).getTime() - 730 * DAY).toISOString()) : sp.from!;
    return { key: "custom", fromDay: from, toDay: sp.to!, fromIso: istDayStart(from), toIso: istDayEnd(sp.to!) };
  }
  const days = Number(RANGES.find((r) => r.key === sp.range)?.key ?? 30);
  const fromDay = istDay(new Date(Date.now() - (days - 1) * DAY).toISOString());
  return { key: String(days), fromDay, toDay: today, fromIso: istDayStart(fromDay), toIso: istDayEnd(today) };
}
