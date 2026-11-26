import { formatINR } from "@/lib/format";
import { describeSizing } from "@/lib/pricing";
import { DispatchNote } from "@/components/product/DispatchNote";
import type { OrderWithItems } from "@/types";

/** Order summary card used on the payment page and the order confirmation: items, totals, delivery address. */
export function OrderSummary({ order, title = "Order summary" }: { order: OrderWithItems; title?: string }) {
  const a = order.shipping_address;
  const discount = order.discount ?? 0;
  return (
    <section className="card p-6">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="font-display text-2xl">{title}</h2>
        <span className="text-xs tracking-[0.14em] text-muted uppercase">{order.order_number}</span>
      </div>
      <ul className="mt-5 divide-y divide-sand">
        {order.items.map((i) => (
          <li key={i.id} className="flex gap-4 py-4 first:pt-0">
            <span className="h-20 w-16 shrink-0 overflow-hidden bg-cream">
              {i.image_url && <img src={i.image_url} alt="" width={64} height={80} className="h-full w-full object-cover" />}
            </span>
            <span className="min-w-0 flex-1 text-sm">
              <span className="block font-medium">{i.product_name}</span>
              <span className="mt-0.5 block text-xs text-muted">
                {[
                  i.size && `Size ${i.size}`,
                  i.colour,
                  i.length_metres && `${i.length_metres} m`,
                  i.stitching && `Stitching (${describeSizing(i.sizing) ?? ""})`,
                  !i.stitching && i.sizing && describeSizing(i.sizing),
                  `Qty ${i.quantity}`,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
              <span className="mt-1 block">
                <DispatchNote type={i.dispatch_type} compact />
              </span>
            </span>
            <span className="shrink-0 text-sm">{formatINR(i.line_total)}</span>
          </li>
        ))}
      </ul>
      <dl className="mt-4 space-y-2.5 border-t border-sand pt-4 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted">Items</dt>
          <dd>{formatINR(order.subtotal)}</dd>
        </div>
        {order.stitching_total > 0 && (
          <div className="flex justify-between">
            <dt className="text-muted">Stitching</dt>
            <dd>{formatINR(order.stitching_total)}</dd>
          </div>
        )}
        {discount > 0 && (
          <div className="flex justify-between text-success">
            <dt>Discount{order.coupon_code ? ` (${order.coupon_code})` : ""}</dt>
            <dd>−{formatINR(discount)}</dd>
          </div>
        )}
        <div className="flex justify-between">
          <dt className="text-muted">Shipping {order.is_international ? "(courier)" : "(India Post)"}</dt>
          <dd>{order.shipping_fee === 0 ? "Free" : formatINR(order.shipping_fee)}</dd>
        </div>
        {(order.cod_fee ?? 0) > 0 && (
          <div className="flex justify-between">
            <dt className="text-muted">Cash on delivery charge</dt>
            <dd>{formatINR(order.cod_fee!)}</dd>
          </div>
        )}
        <div className="flex items-baseline justify-between border-t border-sand pt-4">
          <dt className="text-base">{order.payment_method === "cod" ? "To pay on delivery" : "Total"}</dt>
          <dd className="text-2xl font-medium">{formatINR(order.total)}</dd>
        </div>
      </dl>
      <div className="mt-5 bg-cream p-4 text-xs leading-relaxed">
        <p className="mb-1 tracking-[0.14em] text-muted uppercase">Delivering to</p>
        <p className="text-ink">
          {a.full_name} · {a.phone}
        </p>
        <p className="text-muted">
          {[a.line1, a.line2, a.city, a.state, a.pincode].filter(Boolean).join(", ")}
        </p>
      </div>
    </section>
  );
}
