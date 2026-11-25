/**
 * Calendar days in India time (IST, UTC+5:30), for date pickers in the admin (sale dates, filters).
 * Safe in the browser and on the server.
 */

/** "2026-12-01" → that day 00:00 IST, as ISO. */
export const istDayStart = (day: string) => new Date(`${day}T00:00:00.000+05:30`).toISOString();

/** "2026-12-31" → that day 23:59:59.999 IST, as ISO. */
export const istDayEnd = (day: string) => new Date(`${day}T23:59:59.999+05:30`).toISOString();

/** ISO → "2026-12-01" (the calendar day in India), for <input type="date">. */
export function istDay(iso: string | null | undefined) {
  if (!iso) return "";
  return new Date(new Date(iso).getTime() + 330 * 60_000).toISOString().slice(0, 10);
}
