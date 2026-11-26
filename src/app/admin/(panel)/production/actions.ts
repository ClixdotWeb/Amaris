"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/guard";
import { logActivity } from "@/lib/admin/activity";
import { db } from "@/lib/db";
import { PRODUCTION_LABELS } from "./labels";
import type { ProductionStatus } from "@/types";

const statusSchema = z.enum(["not_started", "cutting", "stitching", "ready"]);

/** Move a made-to-order item along the workshop steps. */
export async function setProductionStatus(itemId: string, status: ProductionStatus): Promise<{ ok?: boolean; error?: string }> {
  const me = await requireAdmin("/admin/production");
  if (!statusSchema.safeParse(status).success || !z.string().uuid().safeParse(itemId).success) return { error: "Choose a valid step." };
  const before = await db.production.get(itemId);
  if (!before) return { error: "This item is no longer in the queue." };
  const row = await db.production.update(itemId, { production_status: status });
  if (!row) return { error: "Couldn't save." };
  await logActivity(me, {
    action: "order.production",
    entity_type: "order",
    entity_id: row.order.id,
    summary: `${row.order.order_number} · ${row.item.product_name}: ${PRODUCTION_LABELS[before.item.production_status ?? "not_started"]} → ${PRODUCTION_LABELS[status]}`,
  });
  revalidatePath("/admin/production");
  revalidatePath("/admin/dispatch");
  return { ok: true };
}

/** Workshop note for one item (e.g. "lining matched", "customer called"). */
export async function saveProductionNote(itemId: string, note: string): Promise<{ ok?: boolean; error?: string }> {
  await requireAdmin("/admin/production");
  const text = note.trim().slice(0, 300) || null;
  const row = await db.production.update(itemId, { production_note: text });
  if (!row) return { error: "This item is no longer in the queue." };
  revalidatePath("/admin/production");
  return { ok: true };
}
