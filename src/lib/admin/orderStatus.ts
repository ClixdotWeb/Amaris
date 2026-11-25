import type { OrderStatus } from "@/types";

/**
 * Which status an order may move to from each status. Checked on the server for every change.
 * Payment is confirmed only by Razorpay (verify route / webhook), so nobody can mark an order paid by hand.
 */
export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending_payment: ["cancelled"],
  paid: ["processing", "dispatched", "cancelled", "refunded"],
  processing: ["dispatched", "cancelled", "refunded"],
  dispatched: ["delivered", "refunded"],
  delivered: ["refunded"],
  cancelled: [],
  refunded: [],
};

export const canTransition = (from: OrderStatus, to: OrderStatus) => from === to || ORDER_TRANSITIONS[from].includes(to);

/** Orders that count as sales (money received, not cancelled or refunded). */
export const SALE_STATUSES: OrderStatus[] = ["paid", "processing", "dispatched", "delivered"];

/** Paid but not yet sent. */
export const TO_DISPATCH_STATUSES: OrderStatus[] = ["paid", "processing"];

/** Consignment numbers can be entered (or corrected) in these statuses. */
export const DISPATCHABLE_STATUSES: OrderStatus[] = ["paid", "processing", "dispatched"];

/**
 * Put stock back when an order is cancelled, or refunded before it was sent
 * (after dispatch the goods are with the customer; returns get their own flow in Phase 4).
 */
export function shouldRestock(from: OrderStatus, to: OrderStatus) {
  const notSent = from === "paid" || from === "processing";
  return (to === "cancelled" && from !== "pending_payment") || (to === "refunded" && notSent);
}

/** Midnight today in India (IST), as an ISO string. */
export function istStartOfToday(now = new Date()) {
  const IST_OFFSET = 330 * 60_000;
  const ist = new Date(now.getTime() + IST_OFFSET);
  ist.setUTCHours(0, 0, 0, 0);
  return new Date(ist.getTime() - IST_OFFSET).toISOString();
}
