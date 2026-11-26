"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/guard";
import { logActivity } from "@/lib/admin/activity";
import { db } from "@/lib/db";
import type { ActionResult } from "@/components/admin/ConfirmButton";

const cell = z.string().trim().max(20);
const chartSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2, "Enter a name for the chart.").max(60),
  unit: z.enum(["inches", "cm"]),
  sizes: z.array(z.string().trim().min(1, "Every size needs a name.").max(12)).min(1, "Add at least one size.").max(12),
  rows: z.array(z.object({ label: z.string().trim().min(1, "Every measurement needs a name.").max(30), values: z.array(cell) })).min(1, "Add at least one measurement.").max(20),
  note: z.string().trim().max(300).nullable(),
  category_slugs: z.array(z.string().max(80)).max(50),
});

export async function saveSizeChart(_: ActionResult, form: FormData): Promise<ActionResult> {
  const me = await requireAdmin("/admin/sizes");
  let raw: unknown;
  try {
    raw = JSON.parse(String(form.get("chart") ?? ""));
  } catch {
    return { error: "The chart couldn't be read. Please try again." };
  }
  const parsed = chartSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const c = parsed.data;
  if (new Set(c.sizes.map((s) => s.toLowerCase())).size !== c.sizes.length) return { error: "Two sizes have the same name." };
  // Every row has one value per size
  const rows = c.rows.map((r) => ({ label: r.label, values: c.sizes.map((_, i) => r.values[i] ?? "") }));
  const res = await db.sizeCharts.save({ ...c, rows, note: c.note || null });
  if (!res.ok) return { error: "Couldn't save the chart." };
  await logActivity(me, { action: c.id ? "size_chart.update" : "size_chart.create", entity_type: "size_chart", entity_id: res.id, summary: `${c.id ? "Updated" : "Added"} size chart ${c.name}` });
  revalidatePath("/admin/sizes");
  revalidatePath("/", "layout");
  redirect("/admin/sizes?flash=saved");
}

export async function deleteSizeChart(_: ActionResult, form: FormData): Promise<ActionResult> {
  const me = await requireAdmin("/admin/sizes");
  const id = String(form.get("id") ?? "");
  const c = await db.sizeCharts.get(id);
  if (!c) return { error: "This chart no longer exists." };
  await db.sizeCharts.remove(id);
  await logActivity(me, { action: "size_chart.delete", entity_type: "size_chart", entity_id: id, summary: `Removed size chart ${c.name}` });
  revalidatePath("/admin/sizes");
  revalidatePath("/", "layout");
  return { ok: `Removed ${c.name}.` };
}
