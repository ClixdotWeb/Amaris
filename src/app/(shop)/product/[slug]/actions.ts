"use server";
import { headers } from "next/headers";
import { z } from "zod";
import { db } from "@/lib/db";
import { USE_DASHBOARD_STORE } from "@/lib/data/mode";
import { rateLimit } from "@/lib/admin/rateLimit";

export type ReviewState = { ok?: string; error?: string } | undefined;

const schema = z.object({
  product_id: z.string().uuid(),
  name: z.string().trim().min(2, "Please enter your name.").max(60),
  rating: z.coerce.number().int().min(1, "Choose a star rating.").max(5),
  title: z.string().trim().max(80).optional(),
  body: z.string().trim().min(10, "Please write at least a few words.").max(1000, "Please keep it under 1000 characters."),
  // Hidden field: people leave it empty, spam bots fill it in
  website: z.string().max(0).optional(),
});

/** A customer's review. It's saved as "pending" and only shows once the shop approves it in the dashboard. */
export async function submitReview(_: ReviewState, form: FormData): Promise<ReviewState> {
  if (!USE_DASHBOARD_STORE) return { error: "Reviews open when the shop goes live." };
  const parsed = schema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const limit = rateLimit(`review:${ip}`, 5, 3600);
  if (!limit.ok) return { error: "Thanks! You've sent several reviews already. Please try again later." };
  const { product_id, name, rating, title, body } = parsed.data;
  if (!(await db.shop.productsByIds([product_id])).length) return { error: "This product is no longer available." };
  await db.shop.addReview({ product_id, name, rating, title: title || null, body });
  return { ok: "Thank you! Your review will appear once it's approved." };
}
