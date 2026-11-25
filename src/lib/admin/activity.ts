import "server-only";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import type { ActivityEntry } from "@/types";

/**
 * Writes one line to the activity log. Call after a change succeeded.
 * A failure to log never breaks the action itself (it is reported in the server log).
 */
export async function logActivity(
  actor: { email: string } | null,
  entry: Pick<ActivityEntry, "action" | "entity_type" | "summary"> & {
    entity_id?: string | null;
    diff?: ActivityEntry["diff"];
  },
) {
  try {
    const h = await headers();
    const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || null;
    await db.activity.log({
      actor_email: actor?.email ?? null,
      action: entry.action,
      entity_type: entry.entity_type,
      entity_id: entry.entity_id ?? null,
      summary: entry.summary,
      diff: entry.diff && Object.keys(entry.diff).length ? entry.diff : null,
      ip,
    });
  } catch (e) {
    console.error("[activity] could not log", entry.action, e);
  }
}

/** Fields whose value changed between two objects: { field: [before, after] }. */
export function diffFields<T extends object>(before: T | null | undefined, after: T, keys: (keyof T)[]) {
  const out: Record<string, [unknown, unknown]> = {};
  for (const k of keys) {
    const a = before?.[k] ?? null;
    const b = after[k] ?? null;
    if (JSON.stringify(a) !== JSON.stringify(b)) out[String(k)] = [a, b];
  }
  return out;
}
