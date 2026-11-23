"use server";
import { createAdminClient } from "@/lib/supabase/server";
import { ORDER_STATUS_LABELS } from "@/components/account/OrderStatusLabel";
import type { OrderStatus } from "@/types";
import { USE_MOCK } from "@/lib/data/mode";

export type TrackResult =
  | { error: string }
  | {
      orderNumber: string;
      status: string;
      carrier: string | null;
      consignment: string | null;
      dispatchedAt: string | null;
      isInternational: boolean;
    }
  | undefined;

/** Look up an order by order number + email, so guests on other devices can track too. */
export async function trackOrder(_: TrackResult, form: FormData): Promise<TrackResult> {
  const orderNumber = String(form.get("order_number") ?? "").trim().toUpperCase();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  if (!orderNumber || !email) return { error: "Enter your order number and email." };
  if (USE_MOCK) return { error: "Preview mode: order tracking works once the database is connected." };

  const admin = createAdminClient();
  const { data } = await admin
    .from("orders")
    .select("order_number, email, status, carrier, consignment_number, dispatched_at, is_international")
    .eq("order_number", orderNumber)
    .neq("status", "pending_payment")
    .maybeSingle();

  if (!data || data.email.toLowerCase() !== email) return { error: "We couldn't find an order with those details." };

  return {
    orderNumber: data.order_number,
    status: ORDER_STATUS_LABELS[data.status as OrderStatus],
    carrier: data.carrier,
    consignment: data.consignment_number,
    dispatchedAt: data.dispatched_at,
    isInternational: data.is_international,
  };
}
