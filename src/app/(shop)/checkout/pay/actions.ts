"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import { USE_DASHBOARD_STORE } from "@/lib/data/mode";
import { getSettings } from "@/lib/data/settings";
import { codAllowed } from "@/lib/cod";

/**
 * Development payment step: a test online payment (marked paid as Razorpay would), or cash on delivery
 * (confirmed now, collected by India Post). Stock comes off either way.
 */
export async function payTestOrder(orderId: string, method: string): Promise<{ ok?: true; error?: string }> {
  if (!USE_DASHBOARD_STORE) return { error: "Test payments are switched off." };
  if (!z.string().uuid().safeParse(orderId).success || !["upi", "card", "netbanking", "cod"].includes(method)) return { error: "Something went wrong." };
  const order = await db.orders.get(orderId);
  if (!order) return { error: "Order not found." };
  if (order.status !== "pending_payment") return { ok: true }; // already done
  let cod: { fee: number } | undefined;
  if (method === "cod") {
    const s = await getSettings();
    const check = codAllowed(s, order);
    if (!check.ok) return { error: check.reason };
    cod = { fee: s.cod_fee ?? 0 };
  }
  const paid = await db.shop.payOrder(orderId, `test_${method}_${randomUUID().slice(0, 8)}`, cod);
  if (!paid) return { error: "This order can't be paid any more." };
  revalidatePath("/admin", "layout");
  return { ok: true };
}
