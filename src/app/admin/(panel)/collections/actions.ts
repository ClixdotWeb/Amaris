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
  description: z.string().trim().max(400).optional(),
  image_url: z.string().trim().url("Cover photo: enter a full web address (https://…).").max(600).optional().or(z.literal("")),
  is_active: z.string().optional(),
  product_ids: z.string().max(40_000),
});

function refresh() {
  revalidatePath("/admin/collections");
  revalidatePath("/", "layout");
}

export async function saveCollection(_: ActionResult, form: FormData): Promise<ActionResult> {
  const me = await requireAdmin("/admin/collections");
  const parsed = schema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const v = parsed.data;
  let ids: string[];
  try {
    ids = z.array(z.string().uuid()).max(500).parse(JSON.parse(v.product_ids));
  } catch {
    return { error: "The product list couldn't be read. Please try again." };
  }
  const res = await db.collections.save({
    id: v.id || undefined,
    name: v.name,
    slug: slugify(v.slug || v.name),
    description: v.description || null,
    image_url: v.image_url || null,
    is_active: v.is_active === "on",
    product_ids: ids,
  });
  if (!res.ok) return { error: res.error };
  await logActivity(me, {
    action: v.id ? "collection.update" : "collection.create",
    entity_type: "collection",
    entity_id: res.id,
    summary: `${v.id ? "Updated" : "Created"} collection ${v.name} (${ids.length} product${ids.length === 1 ? "" : "s"})`,
  });
  refresh();
  redirect(`/admin/collections?flash=${v.id ? "saved" : "added"}`);
}

export async function moveCollection(id: string, dir: -1 | 1) {
  await requireAdmin("/admin/collections");
  await db.collections.move(id, dir);
  refresh();
}

export async function deleteCollection(_: ActionResult, form: FormData): Promise<ActionResult> {
  const me = await requireAdmin("/admin/collections");
  const id = String(form.get("id") ?? "");
  const c = await db.collections.get(id);
  if (!c) return { error: "This collection no longer exists." };
  await db.collections.remove(id);
  await logActivity(me, { action: "collection.delete", entity_type: "collection", entity_id: id, summary: `Removed collection ${c.name}` });
  refresh();
  redirect("/admin/collections?flash=removed");
}
