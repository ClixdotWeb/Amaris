"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/guard";
import { logActivity } from "@/lib/admin/activity";
import { db } from "@/lib/db";
import type { ActionResult } from "@/components/admin/ConfirmButton";

const text = (max: number) => z.string().trim().max(max);
const link = z
  .string()
  .trim()
  .max(300)
  .refine((v) => !v || v.startsWith("/") || /^https?:\/\//.test(v), "Links must start with / (a page of the shop) or https://");
const image = z
  .string()
  .trim()
  .max(600)
  .refine((v) => !v || /^https:\/\//.test(v), "Photos must be full web addresses starting with https://");

const schema = z.object({
  hero: z
    .array(
      z.object({
        left: text(30),
        right: text(30),
        tagline: text(60),
        description: text(200),
        href: link,
        image_url: image,
        position: z.string().regex(/^\d{1,3}(\.\d+)?% \d{1,3}(\.\d+)?%$/, "Focus point is not valid."),
      }),
    )
    .length(3),
  announcements: z.array(text(90)).max(8),
  promo_tiles: z.array(z.object({ eyebrow: text(40), title: text(40), href: link, image_url: image })).length(2),
  featured_collection_ids: z.array(z.string().uuid()).max(6),
  wallpaper: z.object({
    mode: z.enum(["default", "pattern", "photo", "none"]),
    image_url: image,
    strength: z.number().int().min(0).max(100),
    size: z.number().int().min(80).max(2000),
  }),
});

/** Saves the home page content. Empty fields show the shop's built-in text and photos. */
export async function saveContent(_: ActionResult, form: FormData): Promise<ActionResult> {
  const me = await requireAdmin("/admin/content");
  let raw: unknown;
  try {
    raw = JSON.parse(String(form.get("content") ?? ""));
  } catch {
    return { error: "The content couldn't be read. Please try again." };
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const v = parsed.data;
  if ((v.wallpaper.mode === "pattern" || v.wallpaper.mode === "photo") && !v.wallpaper.image_url)
    return { error: "Wallpaper: upload a picture first, or choose the built-in damask." };
  const known = new Set((await db.collections.list()).map((c) => c.id));
  await db.content.save({ ...v, announcements: v.announcements.filter(Boolean), featured_collection_ids: v.featured_collection_ids.filter((id) => known.has(id)) });
  await logActivity(me, { action: "content.update", entity_type: "content", summary: "Updated the home page content" });
  revalidatePath("/admin/content");
  revalidatePath("/", "layout");
  return { ok: "Home page updated." };
}
