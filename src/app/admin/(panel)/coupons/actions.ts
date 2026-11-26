"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/guard";
import { logActivity } from "@/lib/admin/activity";
import { db } from "@/lib/db";
import { rupeesToPaise } from "@/lib/format";
import { istDayEnd, istDayStart } from "@/lib/admin/dates";
import type { ActionResult } from "@/components/admin/ConfirmButton";

const opt = (v: unknown) => (v === "" || v == null ? undefined : v);
const schema = z.object({
  id: z.string().uuid().optional().or(z.literal("")),
  code: z
    .string()
    .trim()
    .min(3, "The code needs at least 3 characters.")
    .max(20)
    .regex(/^[A-Za-z0-9_-]+$/, "Use letters, numbers, - or _ only (no spaces)."),
  description: z.string().trim().max(120).optional(),
  type: z.enum(["percent", "flat"]),
  value: z.coerce.number({ message: "Enter the discount." }).positive("Enter the discount."),
  min_order: z.preprocess(opt, z.coerce.number().min(0).max(10_000_000).optional()),
  max_discount: z.preprocess(opt, z.coerce.number().positive().max(10_000_000).optional()),
  starts: z.preprocess(opt, z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()),
  ends: z.preprocess(opt, z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()),
  usage_limit: z.preprocess(opt, z.coerce.number().int().positive().max(1_000_000).optional()),
  is_active: z.string().optional(),
});

function refresh() {
  revalidatePath("/admin/coupons");
}

export async function saveCoupon(_: ActionResult, form: FormData): Promise<ActionResult> {
  const me = await requireAdmin("/admin/coupons");
  const parsed = schema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const v = parsed.data;
  if (v.type === "percent" && (v.value > 90 || !Number.isInteger(v.value))) return { error: "A percentage discount must be a whole number up to 90." };
  if (v.starts && v.ends && v.ends < v.starts) return { error: "The end date is before the start date." };
  const res = await db.coupons.save({
    id: v.id || undefined,
    code: v.code.toUpperCase(),
    description: v.description || null,
    type: v.type,
    value: v.type === "percent" ? v.value : rupeesToPaise(v.value),
    min_order: rupeesToPaise(v.min_order ?? 0),
    max_discount: v.type === "percent" && v.max_discount ? rupeesToPaise(v.max_discount) : null,
    starts_at: v.starts ? istDayStart(v.starts) : null,
    ends_at: v.ends ? istDayEnd(v.ends) : null,
    usage_limit: v.usage_limit ?? null,
    is_active: v.is_active === "on",
  });
  if (!res.ok) return { error: res.error };
  await logActivity(me, { action: v.id ? "coupon.update" : "coupon.create", entity_type: "coupon", entity_id: res.id, summary: `${v.id ? "Updated" : "Created"} coupon ${v.code.toUpperCase()}` });
  refresh();
  redirect(`/admin/coupons?flash=${v.id ? "saved" : "added"}`);
}

export async function setCouponActive(id: string, active: boolean): Promise<{ ok?: boolean; error?: string }> {
  const me = await requireAdmin("/admin/coupons");
  const c = await db.coupons.get(id);
  if (!c) return { error: "This coupon no longer exists." };
  const { id: _id, created_at: _c, used_count: _u, ...rest } = c;
  void _id;
  void _c;
  void _u;
  const res = await db.coupons.save({ ...rest, id, is_active: active });
  if (!res.ok) return { error: res.error };
  await logActivity(me, { action: "coupon.update", entity_type: "coupon", entity_id: id, summary: `${active ? "Turned on" : "Turned off"} coupon ${c.code}` });
  refresh();
  return { ok: true };
}

export async function deleteCoupon(_: ActionResult, form: FormData): Promise<ActionResult> {
  const me = await requireAdmin("/admin/coupons");
  const id = String(form.get("id") ?? "");
  const c = await db.coupons.get(id);
  if (!c) return { error: "This coupon no longer exists." };
  await db.coupons.remove(id);
  await logActivity(me, { action: "coupon.delete", entity_type: "coupon", entity_id: id, summary: `Deleted coupon ${c.code}` });
  refresh();
  return { ok: `Deleted ${c.code}.` };
}
