import type { OrderStatus } from "@/types";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending_payment: "Awaiting payment",
  paid: "Confirmed",
  processing: "Being prepared",
  dispatched: "Dispatched",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

const TONE: Record<OrderStatus, string> = {
  pending_payment: "bg-sand text-muted",
  paid: "bg-gold-light text-ink",
  processing: "bg-gold-light text-ink",
  dispatched: "bg-maroon/10 text-maroon",
  delivered: "bg-success/10 text-success",
  cancelled: "bg-sale/10 text-sale",
  refunded: "bg-sand text-muted",
};

export function OrderStatusLabel({ status }: { status: OrderStatus }) {
  return (
    <span data-status={status} className={`inline-block px-2.5 py-1 text-[11px] font-medium tracking-wider uppercase ${TONE[status]}`}>
      {ORDER_STATUS_LABELS[status]}
    </span>
  );
}
