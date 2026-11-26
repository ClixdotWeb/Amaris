"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/guard";
import { logActivity } from "@/lib/admin/activity";
import { db } from "@/lib/db";

export type AdjustState = { ok?: string; error?: string; stock?: number } | undefined;

const schema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid().optional().or(z.literal("")),
  mode: z.enum(["add", "remove", "set"]),
  amount: z.coerce.number({ message: "Enter a number." }).min(0, "Enter a positive number.").max(100_000),
  reason: z.enum(["restock", "correction", "damaged", "returned"]),
  note: z.string().trim().max(200).optional(),
});

/** Change one stock figure with a reason; every change is kept in the stock history. */
export async function adjustStock(_: AdjustState, form: FormData): Promise<AdjustState> {
  const me = await requireAdmin("/admin/inventory");
  const parsed = schema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const v = parsed.data;
  if (v.mode !== "set" && v.amount === 0) return { error: "Enter how many to add or remove." };
  const res = await db.inventory.adjust(
    {
      productId: v.productId,
      variantId: v.variantId || null,
      mode: v.mode === "set" ? "set" : "add",
      amount: v.mode === "remove" ? -v.amount : v.amount,
      reason: v.reason,
      note: v.note || null,
    },
    me.email,
  );
  if (!res.ok) return { error: res.error };
  const m = res.movement;
  await logActivity(me, {
    action: "inventory.adjust",
    entity_type: "inventory",
    entity_id: m.product_id,
    summary: `${m.product_name}${m.label ? ` (${m.label})` : ""}: stock ${m.change > 0 ? "+" : ""}${m.change} → ${m.stock_after} (${m.reason})`,
  });
  revalidatePath("/admin/inventory");
  revalidatePath("/admin");
  return { ok: `Stock is now ${res.stock}.`, stock: res.stock };
}
