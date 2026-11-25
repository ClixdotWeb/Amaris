import Link from "next/link";
import { notFound } from "next/navigation";
import { Mail, MapPin, Phone, Receipt } from "lucide-react";
import { db } from "@/lib/db";
import { formatDate, formatINR } from "@/lib/format";
import { DISPATCHABLE_STATUSES, ORDER_TRANSITIONS } from "@/lib/admin/orderStatus";
import { Badge, Card, PageHeader } from "@/components/admin/ui";
import { OrderStatusLabel } from "@/components/account/OrderStatusLabel";
import { TrackingInfo } from "@/components/account/TrackingInfo";
import { SizingSummary } from "@/components/product/SizingSummary";
import { DispatchNote } from "@/components/product/DispatchNote";
import { DispatchForm } from "../DispatchForm";
import { StatusForm } from "../StatusForm";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const order = await db.orders.get((await params).id);
  return { title: order ? `Order ${order.order_number}` : "Order" };
}

export default async function AdminOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const order = await db.orders.get((await params).id);
  if (!order) notFound();
  const a = order.shipping_address;
  const itemCount = order.items.reduce((n, i) => n + i.quantity, 0);
  const madeToOrder = order.items.some((i) => i.dispatch_type === "made_to_order");
  const placed = new Date(order.created_at).toLocaleString("en-IN", { day: "numeric", month: "long", year: "numeric", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });

  return (
    <>
      <PageHeader
        title={`Order ${order.order_number}`}
        back={{ href: "/admin/orders", label: "All orders" }}
        description={
          <span className="inline-flex flex-wrap items-center gap-2">
            <OrderStatusLabel status={order.status} />
            <span>Placed {placed}</span>
            {madeToOrder ? <Badge tone="gold">45–60 days</Badge> : <Badge>48 hours</Badge>}
            {order.is_international && <Badge tone="maroon">International</Badge>}
          </span>
        }
      />

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0 space-y-6">
          <Card title={`Items (${itemCount})`} padded={false}>
            <ul className="divide-y divide-sand/70">
              {order.items.map((i) => (
                <li key={i.id} className="flex gap-4 px-6 py-5">
                  <span className="h-24 w-[72px] shrink-0 overflow-hidden rounded-media border border-sand bg-cream">
                    {i.image_url && <img src={i.image_url} alt="" className="h-full w-full object-cover" />}
                  </span>
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
                      {i.product_id ? (
                        <Link href={`/admin/products/${i.product_id}`} className="font-display text-lg leading-snug hover:text-maroon">{i.product_name}</Link>
                      ) : (
                        <span className="font-display text-lg leading-snug">{i.product_name}</span>
                      )}
                      <span className="stat-number text-base">{formatINR(i.line_total)}</span>
                    </div>
                    <p className="text-sm text-muted">
                      {formatINR(i.unit_price)}
                      {i.product_type === "running_material" ? ` / m × ${i.length_metres} m` : ""} × {i.quantity}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {i.colour && <Badge>{i.colour}</Badge>}
                      {i.size && <Badge>Size {i.size}</Badge>}
                      {i.stitching && <Badge tone="gold">Stitching +{formatINR(i.stitching_charge)}</Badge>}
                    </div>
                    <SizingSummary sizing={i.sizing} />
                    <DispatchNote type={i.dispatch_type} compact />
                  </div>
                </li>
              ))}
            </ul>
            <dl className="space-y-2 border-t border-sand bg-cream/30 px-6 py-5 text-sm">
              <div className="flex justify-between"><dt className="text-muted">Items</dt><dd>{formatINR(order.subtotal)}</dd></div>
              {order.stitching_total > 0 && (
                <div className="flex justify-between"><dt className="text-muted">Stitching</dt><dd>{formatINR(order.stitching_total)}</dd></div>
              )}
              <div className="flex justify-between"><dt className="text-muted">Shipping</dt><dd>{order.shipping_fee ? formatINR(order.shipping_fee) : "Free"}</dd></div>
              <div className="flex items-baseline justify-between border-t border-sand pt-3">
                <dt className="font-display text-xl">Total paid</dt>
                <dd className="stat-number text-2xl">{formatINR(order.total)}</dd>
              </div>
            </dl>
          </Card>

          {order.consignment_number && (
            <Card title="Tracking">
              <TrackingInfo order={order} />
            </Card>
          )}

          {order.customer_notes && (
            <Card title="Note from the customer">
              <p className="text-sm leading-relaxed">{order.customer_notes}</p>
            </Card>
          )}
        </div>

        <div className="min-w-0 space-y-6 xl:sticky xl:top-24">
          <Card title="Customer">
            <div className="space-y-4 text-sm">
              <p className="font-display text-xl">{a.full_name}</p>
              <p className="flex items-start gap-3">
                <Mail size={16} strokeWidth={1.4} className="mt-0.5 shrink-0 text-gold" aria-hidden />
                <a className="break-all text-maroon underline underline-offset-4" href={`mailto:${order.email}`}>{order.email}</a>
              </p>
              <p className="flex items-start gap-3">
                <Phone size={16} strokeWidth={1.4} className="mt-0.5 shrink-0 text-gold" aria-hidden />
                <a className="text-maroon underline underline-offset-4" href={`tel:${order.phone}`}>{order.phone}</a>
              </p>
              <address className="flex items-start gap-3 not-italic leading-relaxed">
                <MapPin size={16} strokeWidth={1.4} className="mt-0.5 shrink-0 text-gold" aria-hidden />
                <span>
                  {a.line1}
                  {a.line2 && <>, {a.line2}</>}
                  <br />
                  {a.city}, {a.state} {a.pincode}
                  <br />
                  {a.country === "IN" ? "India" : a.country}
                </span>
              </address>
              <p className="flex items-start gap-3 text-muted">
                <Receipt size={16} strokeWidth={1.4} className="mt-0.5 shrink-0 text-gold" aria-hidden />
                <span className="break-all">Razorpay {order.razorpay_payment_id ?? "—"} · {formatDate(order.created_at)}</span>
              </p>
            </div>
          </Card>
          {DISPATCHABLE_STATUSES.includes(order.status) && (
            <Card title="Dispatch">
              <DispatchForm orderId={order.id} international={order.is_international} current={order.consignment_number} />
            </Card>
          )}
          <Card title="Status & notes">
            <StatusForm orderId={order.id} current={order.status} allowed={ORDER_TRANSITIONS[order.status]} notes={order.admin_notes} />
            {order.stock_restored_at && <p className="mt-3 text-xs text-muted">Stock for this order was added back.</p>}
          </Card>
        </div>
      </div>
    </>
  );
}
