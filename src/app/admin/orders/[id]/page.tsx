import { notFound } from "next/navigation";
import { getOrder } from "@/lib/data/orders";
import { OrderDetail } from "@/components/account/OrderDetail";
import { ORDER_STATUS_LABELS } from "@/components/account/OrderStatusLabel";
import { DispatchForm } from "../DispatchForm";
import { updateOrderStatus } from "../actions";

export default async function AdminOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const order = await getOrder((await params).id);
  if (!order) notFound();

  return (
    <>
      <OrderDetail order={order} />
      <p>Customer email: {order.email} · Phone: {order.phone}</p>
      <p>Razorpay payment: {order.razorpay_payment_id ?? "—"}</p>

      <section>
        <h2>Dispatch</h2>
        <DispatchForm orderId={order.id} international={order.is_international} current={order.consignment_number} />
      </section>

      <section>
        <h2>Status & internal notes</h2>
        <form action={updateOrderStatus}>
          <input type="hidden" name="id" value={order.id} />
          <select name="status" defaultValue={order.status}>
            {Object.entries(ORDER_STATUS_LABELS).map(([k, label]) => (
              <option key={k} value={k}>{label}</option>
            ))}
          </select>
          <textarea name="admin_notes" defaultValue={order.admin_notes ?? ""} placeholder="Internal notes (not shown to customer)" />
          <button type="submit">Update</button>
        </form>
      </section>
    </>
  );
}
