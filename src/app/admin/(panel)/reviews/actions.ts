"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/guard";
import { logActivity } from "@/lib/admin/activity";
import { db } from "@/lib/db";
import type { ActionResult } from "@/components/admin/ConfirmButton";

const LABEL = { approved: "Approved", hidden: "Hid", pending: "Moved back to waiting" } as const;

export async function setReviewStatus(_: ActionResult, form: FormData): Promise<ActionResult> {
  const me = await requireAdmin("/admin/reviews");
  const parsed = z.object({ id: z.string().uuid(), status: z.enum(["pending", "approved", "hidden"]) }).safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: "Something went wrong. Please try again." };
  const r = await db.reviews.setStatus(parsed.data.id, parsed.data.status);
  if (!r) return { error: "This review no longer exists." };
  await logActivity(me, { action: `review.${parsed.data.status}`, entity_type: "review", entity_id: r.id, summary: `${LABEL[parsed.data.status]} a ${r.rating}★ review by ${r.name}` });
  revalidatePath("/admin/reviews");
  revalidatePath("/product/[slug]", "page");
  return { ok: parsed.data.status === "approved" ? "Approved. It now shows on the product page." : parsed.data.status === "hidden" ? "Hidden from the shop." : "Moved back to waiting." };
}

export async function deleteReview(_: ActionResult, form: FormData): Promise<ActionResult> {
  const me = await requireAdmin("/admin/reviews");
  const id = String(form.get("id") ?? "");
  const r = await db.reviews.remove(id);
  if (!r) return { error: "This review no longer exists." };
  await logActivity(me, { action: "review.delete", entity_type: "review", entity_id: id, summary: `Deleted a ${r.rating}★ review by ${r.name}` });
  revalidatePath("/admin/reviews");
  revalidatePath("/product/[slug]", "page");
  return { ok: "Review deleted." };
}
