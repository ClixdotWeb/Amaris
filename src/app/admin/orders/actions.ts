"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getOrder } from "@/lib/data/orders";
import { sendDispatchEmail } from "@/lib/email";
import type { OrderStatus } from "@/types";

export type DispatchState = { error?: string; ok?: boolean } | undefined;

/** Enter the India Post consignment number, mark dispatched, email the customer. */
export async function markDispatched(_: DispatchState, form: FormData): Promise<DispatchState> {
  await requireAdmin();
  const id = String(form.get("id"));
  const consignment = String(form.get("consignment_number") ?? "").trim().toUpperCase();
  const carrier = String(form.get("carrier") ?? "India Post").trim() || "India Post";
  if (!consignment) return { error: "Enter the consignment number." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("orders")
    .update({ status: "dispatched", consignment_number: consignment, carrier, dispatched_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: "Could not update order." };

  const order = await getOrder(id);
  if (order) await sendDispatchEmail(order);
  revalidatePath(`/admin/orders/${id}`);
  return { ok: true };
}

export async function updateOrderStatus(form: FormData) {
  await requireAdmin();
  const id = String(form.get("id"));
  const status = String(form.get("status")) as OrderStatus;
  const supabase = await createClient();
  await supabase
    .from("orders")
    .update({ status, admin_notes: String(form.get("admin_notes") ?? "") || null })
    .eq("id", id);
  revalidatePath(`/admin/orders/${id}`);
}
