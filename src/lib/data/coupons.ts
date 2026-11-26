import "server-only";
import type { Coupon } from "@/types";
import { USE_DASHBOARD_STORE } from "./mode";
import { db } from "@/lib/db";

/** A coupon by its code (dashboard → Coupons). Until the database is connected, only the dashboard store has coupons. */
export async function findCoupon(code: string): Promise<Coupon | null> {
  const c = code.trim().toUpperCase();
  if (!c || c.length > 30) return null;
  return USE_DASHBOARD_STORE ? db.coupons.findByCode(c) : null;
}
