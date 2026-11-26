import "server-only";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import type { OrderStatus, OrderWithItems } from "@/types";
import { USE_DASHBOARD_STORE, USE_MOCK } from "./mode";
import { db } from "@/lib/db";

const ORDER_SELECT = "*, items:order_items(*)";

/** Current user's orders (RLS limits to own rows). */
export async function listMyOrders(): Promise<OrderWithItems[]> {
  if (USE_MOCK) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select(ORDER_SELECT)
    .neq("status", "pending_payment")
    .order("created_at", { ascending: false });
  return (data ?? []) as OrderWithItems[];
}

/** One order, visible to its owner or an admin (RLS). */
export async function getOrder(id: string): Promise<OrderWithItems | null> {
  if (USE_DASHBOARD_STORE) return /^[0-9a-f-]{36}$/.test(id) ? db.orders.get(id) : null;
  if (USE_MOCK) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("orders").select(ORDER_SELECT).eq("id", id).maybeSingle();
  return data as OrderWithItems | null;
}

/** Admin list. */
export async function listOrders(status?: OrderStatus): Promise<OrderWithItems[]> {
  if (USE_MOCK) return [];
  const supabase = await createClient();
  let q = supabase.from("orders").select(ORDER_SELECT).order("created_at", { ascending: false }).limit(100);
  if (status) q = q.eq("status", status);
  const { data } = await q;
  return (data ?? []) as OrderWithItems[];
}

/** Service-role fetch for payment verification / webhooks. */
export async function getOrderByRazorpayId(razorpayOrderId: string): Promise<OrderWithItems | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("orders")
    .select(ORDER_SELECT)
    .eq("razorpay_order_id", razorpayOrderId)
    .maybeSingle();
  return data as OrderWithItems | null;
}

/**
 * Marks an order paid exactly once (idempotent — both the browser callback and the
 * webhook may call this). Returns the order if THIS call flipped it to paid.
 */
export async function markOrderPaid(razorpayOrderId: string, paymentId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("orders")
    .update({ status: "paid", razorpay_payment_id: paymentId })
    .eq("razorpay_order_id", razorpayOrderId)
    .eq("status", "pending_payment")
    .select(ORDER_SELECT)
    .maybeSingle();
  if (!data) return null;
  await admin.rpc("decrement_stock_for_order", { p_order_id: data.id });
  return data as OrderWithItems;
}
