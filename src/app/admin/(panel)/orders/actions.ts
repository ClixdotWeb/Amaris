"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/guard";
import { logActivity } from "@/lib/admin/activity";
import { db } from "@/lib/db";
import { sendDispatchEmail } from "@/lib/email";
import { DISPATCHABLE_STATUSES, canTransition, shouldRestock } from "@/lib/admin/orderStatus";
import { ORDER_STATUS_LABELS } from "@/components/account/OrderStatusLabel";
import type { OrderStatus } from "@/types";

export type OrderActionState = { error?: string; ok?: string } | undefined;

const dispatchSchema = z.object({
  id: z.string().uuid(),
  consignment_number: z.string().trim().min(4, "Enter the consignment number.").max(40).transform((s) => s.toUpperCase()),
  carrier: z.string().trim().max(60).optional(),
});

/** Enter the India Post consignment number, mark dispatched, email the customer. */
export async function markDispatched(_: OrderActionState, form: FormData): Promise<OrderActionState> {
  const me = await requireAdmin();
  const parsed = dispatchSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the details." };
  const { id, consignment_number, carrier } = parsed.data;

  const order = await db.orders.get(id);
  if (!order) return { error: "Order not found." };
  if (!DISPATCHABLE_STATUSES.includes(order.status))
    return { error: `An order that is “${ORDER_STATUS_LABELS[order.status]}” can't be dispatched.` };

  const patch = {
    status: "dispatched" as const,
    consignment_number,
    carrier: carrier || "India Post",
    dispatched_at: order.dispatched_at ?? new Date().toISOString(),
  };
  const updated = await db.orders.update(id, patch);
  if (!updated) return { error: "Could not update the order." };
  await sendDispatchEmail(updated);
  await logActivity(me, {
    action: "order.dispatch",
    entity_type: "order",
    entity_id: id,
    summary: `Dispatched ${order.order_number} (${patch.carrier} ${consignment_number})`,
    diff: { status: [order.status, "dispatched"], consignment_number: [order.consignment_number, consignment_number] },
  });
  revalidatePath(`/admin/orders/${id}`);
  revalidatePath("/admin/orders");
  return { ok: "Marked as dispatched. The customer has been emailed." };
}

const statusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(Object.keys(ORDER_STATUS_LABELS) as [OrderStatus, ...OrderStatus[]]),
  admin_notes: z.string().max(2000).optional(),
});

/** Change status (only allowed moves) and save internal notes. Puts stock back on cancel / early refund. */
export async function updateOrderStatus(_: OrderActionState, form: FormData): Promise<OrderActionState> {
  const me = await requireAdmin();
  const parsed = statusSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: "Choose a valid status." };
  const { id, status } = parsed.data;
  const admin_notes = parsed.data.admin_notes?.trim() || null;

  const order = await db.orders.get(id);
  if (!order) return { error: "Order not found." };
  if (!canTransition(order.status, status))
    return { error: `Can't change “${ORDER_STATUS_LABELS[order.status]}” to “${ORDER_STATUS_LABELS[status]}”.` };
  if (status === "dispatched" && order.status !== "dispatched")
    return { error: "Use the Dispatch form so the consignment number is saved and the customer is emailed." };

  await db.orders.update(id, { status, admin_notes });
  const restocked = shouldRestock(order.status, status) ? await db.orders.restoreStock(id) : false;

  const diff: Record<string, [unknown, unknown]> = {};
  if (order.status !== status) diff.status = [order.status, status];
  if ((order.admin_notes ?? null) !== admin_notes) diff.notes = [order.admin_notes, admin_notes];
  if (Object.keys(diff).length)
    await logActivity(me, {
      action: order.status !== status ? "order.status" : "order.notes",
      entity_type: "order",
      entity_id: id,
      summary:
        order.status !== status
          ? `${order.order_number}: ${ORDER_STATUS_LABELS[order.status]} → ${ORDER_STATUS_LABELS[status]}${restocked ? " (stock added back)" : ""}`
          : `${order.order_number}: notes updated`,
      diff,
    });

  revalidatePath(`/admin/orders/${id}`);
  revalidatePath("/admin/orders");
  return { ok: restocked ? "Saved. The items were added back to stock." : "Saved." };
}
