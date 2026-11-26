import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getOrder } from "@/lib/data/orders";
import { USE_DASHBOARD_STORE } from "@/lib/data/mode";
import { PageHeader } from "@/components/layout/PageHeader";
import { CheckoutSteps } from "@/components/checkout/CheckoutSteps";
import { OrderSummary } from "@/components/checkout/OrderSummary";
import { DELIVERY_AFTER_DISPATCH } from "@/config/shop";
import { formatINR } from "@/lib/format";

export const metadata = { title: "Order placed" };

export default async function OrderSuccessPage({ params, searchParams }: { params: Promise<{ orderId: string }>; searchParams: Promise<{ buy?: string }> }) {
  const buyNow = (await searchParams).buy === "now";
  await requireUser();
  const order = await getOrder((await params).orderId);
  if (!order || order.status === "pending_payment") notFound();
  const madeToOrder = order.items.some((i) => i.dispatch_type === "made_to_order");

  return (
    <>
      <PageHeader title="Thank you" crumb="Order placed" />
      <div className="container-x py-12">
        <CheckoutSteps current={4} buyNow={buyNow} />
        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_420px] lg:gap-12">
          <section className="card p-6 md:p-10">
            <CheckCircle2 size={40} strokeWidth={1.2} className="text-success" aria-hidden />
            <h2 className="mt-5 font-display text-4xl leading-tight">Your order is confirmed</h2>
            <p className="mt-3 text-muted">
              Order <strong className="text-ink">{order.order_number}</strong> · a confirmation has been sent to{" "}
              <strong className="text-ink">{order.email}</strong>.
            </p>
            {order.payment_method === "cod" && (
              <p className="mt-4 border border-gold/60 bg-gold-light/30 p-4 text-sm">
                Cash on delivery: please keep <strong>{formatINR(order.total)}</strong> ready when India Post delivers your order.
              </p>
            )}

            <ol className="mt-8 space-y-5 border-t border-sand pt-8 text-sm">
              <li className="flex gap-4">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-maroon text-xs text-white">1</span>
                <span>
                  <span className="block font-medium">We prepare your order</span>
                  <span className="text-muted">
                    {madeToOrder ? "Made-to-order and stitched pieces are ready to dispatch in 45–60 days." : "In-stock items are dispatched within 48 hours."}
                  </span>
                </span>
              </li>
              <li className="flex gap-4">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-maroon text-xs text-maroon">2</span>
                <span>
                  <span className="block font-medium">We send it by {order.is_international ? "courier" : "India Post"}</span>
                  <span className="text-muted">You get an email with the consignment number to track it.</span>
                </span>
              </li>
              <li className="flex gap-4">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-maroon text-xs text-maroon">3</span>
                <span>
                  <span className="block font-medium">It reaches you</span>
                  <span className="text-muted">
                    Kerala {DELIVERY_AFTER_DISPATCH.kerala}, rest of India {DELIVERY_AFTER_DISPATCH.restOfIndia} after dispatch.
                  </span>
                </span>
              </li>
            </ol>

            <div className="mt-10 flex flex-wrap gap-3">
              <Link href="/" className="btn-primary">
                Continue shopping
              </Link>
              <Link href="/track-order" className="btn-outline">
                Track an order
              </Link>
              {!USE_DASHBOARD_STORE && (
                <Link href={`/account/orders/${order.id}/invoice`} className="btn-outline">
                  Download invoice
                </Link>
              )}
            </div>
          </section>
          <aside className="h-fit lg:sticky lg:top-32">
            <OrderSummary order={order} title="What you ordered" />
          </aside>
        </div>
      </div>
    </>
  );
}
