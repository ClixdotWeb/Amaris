"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/guard";
import { logActivity } from "@/lib/admin/activity";
import { db } from "@/lib/db";
import { slugify } from "@/lib/format";
import type { ActionResult } from "@/components/admin/ConfirmButton";

const schema = z.object({
  id: z.string().uuid().optional().or(z.literal("")),
  name: z.string().trim().min(2, "Enter a name.").max(80),
  slug: z.string().trim().max(80).optional(),
  product_type: z.enum(["ready_made", "unstitched", "custom_made", "running_material"]),
  description: z.string().trim().max(500).optional(),
  image_url: z.string().trim().url("Photo: enter a full web address (https://…).").max(600).optional().or(z.literal("")),
  is_visible: z.string().optional(),
});

/** Refresh every page that shows categories (dashboard + shop menu, home page, category pages). */
function refresh() {
  revalidatePath("/admin/categories");
  revalidatePath("/", "layout");
}

export async function saveCategory(_: ActionResult, form: FormData): Promise<ActionResult> {
  const me = await requireAdmin("/admin/categories");
  const parsed = schema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const v = parsed.data;
  const res = await db.categories.save({
    id: v.id || undefined,
    name: v.name,
    slug: slugify(v.slug || v.name),
    product_type: v.product_type,
    description: v.description || null,
    image_url: v.image_url || null,
    is_visible: v.is_visible === "on",
  });
  if (!res.ok) return { error: res.error };
  await logActivity(me, { action: v.id ? "category.update" : "category.create", entity_type: "category", entity_id: res.id, summary: `${v.id ? "Updated" : "Added"} category ${v.name}` });
  refresh();
  redirect(`/admin/categories?flash=${v.id ? "saved" : "added"}`);
}

export async function moveCategory(id: string, dir: -1 | 1) {
  await requireAdmin("/admin/categories");
  await db.categories.move(id, dir);
  refresh();
}

export async function setCategoryVisible(id: string, visible: boolean): Promise<{ ok?: boolean; error?: string }> {
  const me = await requireAdmin("/admin/categories");
  const c = (await db.categories.list()).find((x) => x.id === id);
  if (!c) return { error: "This category no longer exists." };
  const res = await db.categories.save({ ...c, description: c.description, image_url: c.image_url ?? null, is_visible: visible });
  if (!res.ok) return { error: res.error };
  await logActivity(me, { action: "category.visibility", entity_type: "category", entity_id: id, summary: `${visible ? "Showed" : "Hid"} category ${c.name}` });
  refresh();
  return { ok: true };
}

export async function deleteCategory(_: ActionResult, form: FormData): Promise<ActionResult> {
  const me = await requireAdmin("/admin/categories");
  const id = String(form.get("id") ?? "");
  const c = (await db.categories.list()).find((x) => x.id === id);
  if (!c) return { error: "This category no longer exists." };
  const res = await db.categories.remove(id);
  if (!res.ok) return { error: res.error };
  await logActivity(me, { action: "category.delete", entity_type: "category", entity_id: id, summary: `Removed category ${c.name}` });
  refresh();
  return { ok: `Removed ${c.name}.` };
}
