import Link from "next/link";
import { formatDate, formatINR } from "@/lib/format";
import { OrderStatusLabel } from "./OrderStatusLabel";
import { DispatchNote } from "@/components/product/DispatchNote";
import { SizingSummary } from "@/components/product/SizingSummary";
import { TrackingInfo } from "./TrackingInfo";
import type { OrderWithItems } from "@/types";

/** Shared by My Account and the admin order page. */
export function OrderDetail({ order }: { order: OrderWithItems }) {
  const a = order.shipping_address;
  return (
    <article>
      <h1>Order {order.order_number}</h1>
      <p>
        Placed {formatDate(order.created_at)} · <OrderStatusLabel status={order.status} />
      </p>

      {order.consignment_number && <TrackingInfo order={order} />}

      <section>
        <h2>Items</h2>
        <ul>
          {order.items.map((i) => (
            <li key={i.id}>
              {i.image_url && <img src={i.image_url} alt="" width={80} height={100} />}
              <p>{i.product_name}</p>
              <p>
                {formatINR(i.unit_price)}
                {i.product_type === "running_material" ? ` / m × ${i.length_metres} m` : ""} × {i.quantity}
              </p>
              {i.colour && <p>Colour: {i.colour}</p>}
              {i.size && <p>Size: {i.size}</p>}
              {i.stitching && <p>Stitching: +{formatINR(i.stitching_charge)} each</p>}
              <SizingSummary sizing={i.sizing} />
              <DispatchNote type={i.dispatch_type} />
              <p>{formatINR(i.line_total)}</p>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Payment</h2>
        <dl>
          <dt>Items</dt>
          <dd>{formatINR(order.subtotal)}</dd>
          {order.stitching_total > 0 && (
            <>
              <dt>Stitching</dt>
              <dd>{formatINR(order.stitching_total)}</dd>
            </>
          )}
          <dt>Shipping</dt>
          <dd>{order.shipping_fee ? formatINR(order.shipping_fee) : "Free"}</dd>
          <dt>Total</dt>
          <dd>{formatINR(order.total)}</dd>
        </dl>
      </section>

      <section>
        <h2>Shipping to</h2>
        <address>
          {a.full_name}
          <br />
          {a.line1}
          {a.line2 && <>, {a.line2}</>}
          <br />
          {a.city}, {a.state} {a.pincode}, {a.country}
          <br />
          {a.phone}
        </address>
      </section>

      {order.customer_notes && (
        <section>
          <h2>Notes</h2>
          <p>{order.customer_notes}</p>
        </section>
      )}

      <Link href={`/account/orders/${order.id}/invoice`}>View invoice</Link>
    </article>
  );
}
