import type { Coupon } from "@/types";
import { formatINR } from "@/lib/format";

export type CouponCheck = { ok: true; discount: number; label: string } | { ok: false; error: string };

/**
 * The discount a coupon gives on an items subtotal (paise; stitching and shipping are not discounted).
 * The same rule runs in the cart (to show it) and at checkout (to charge it). Never trust a discount
 * sent by the browser: checkout always works it out again from the code.
 */
export function couponDiscount(c: Coupon | null, itemsSubtotal: number, now: Date = new Date()): CouponCheck {
  if (!c || !c.is_active) return { ok: false, error: "This code isn't valid." };
  if (c.starts_at && now < new Date(c.starts_at)) return { ok: false, error: "This code isn't active yet." };
  if (c.ends_at && now > new Date(c.ends_at)) return { ok: false, error: "This code has expired." };
  if (c.usage_limit != null && c.used_count >= c.usage_limit) return { ok: false, error: "This code has been fully used." };
  if (itemsSubtotal < c.min_order) return { ok: false, error: `Spend ${formatINR(c.min_order)} or more to use this code.` };
  let discount = c.type === "percent" ? Math.round((itemsSubtotal * c.value) / 100) : c.value;
  if (c.type === "percent" && c.max_discount != null) discount = Math.min(discount, c.max_discount);
  discount = Math.max(0, Math.min(discount, itemsSubtotal));
  return { ok: true, discount, label: c.type === "percent" ? `${c.value}% off` : `${formatINR(c.value)} off` };
}

/** "10% off, up to ₹500, on orders over ₹2,000" */
export function describeCoupon(c: Pick<Coupon, "type" | "value" | "min_order" | "max_discount">) {
  const parts = [c.type === "percent" ? `${c.value}% off` : `${formatINR(c.value)} off`];
  if (c.type === "percent" && c.max_discount != null) parts.push(`up to ${formatINR(c.max_discount)}`);
  if (c.min_order > 0) parts.push(`on orders over ${formatINR(c.min_order)}`);
  return parts.join(", ");
}
