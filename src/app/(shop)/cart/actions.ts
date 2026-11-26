"use server";
import { headers } from "next/headers";
import { z } from "zod";
import { findCoupon } from "@/lib/data/coupons";
import { couponDiscount, type CouponCheck } from "@/lib/coupons";
import { rateLimit } from "@/lib/admin/rateLimit";

/** Checks a coupon code against the cart's items subtotal (for showing the discount; checkout checks again). */
export async function checkCoupon(code: string, itemsSubtotal: number): Promise<CouponCheck & { code?: string }> {
  const parsed = z.object({ code: z.string().trim().min(1).max(30), sub: z.number().int().min(0).max(100_000_000) }).safeParse({ code, sub: itemsSubtotal });
  if (!parsed.success) return { ok: false, error: "Enter a code." };
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  // Stops anyone guessing codes one after another
  if (!rateLimit(`coupon:${ip}`, 20, 600).ok) return { ok: false, error: "Too many tries. Please wait a few minutes." };
  const c = await findCoupon(parsed.data.code);
  const r = couponDiscount(c, parsed.data.sub);
  return r.ok ? { ...r, code: c!.code } : r;
}

/** Which of these products can still be bought (exist, live, not deleted). Used to tidy old carts. */
export async function availableProductIds(ids: string[]): Promise<string[]> {
  const clean = [...new Set(ids)].filter((id) => /^[0-9a-f-]{36}$/.test(id)).slice(0, 100);
  if (!clean.length) return [];
  const { getProductsByIds } = await import("@/lib/data/products");
  return (await getProductsByIds(clean)).filter((p) => p.is_active).map((p) => p.id);
}
