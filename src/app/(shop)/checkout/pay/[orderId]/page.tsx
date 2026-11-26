import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { USE_DASHBOARD_STORE } from "@/lib/data/mode";
import { PageHeader } from "@/components/layout/PageHeader";
import { CheckoutSteps } from "@/components/checkout/CheckoutSteps";
import { OrderSummary } from "@/components/checkout/OrderSummary";
import { PaymentForm } from "@/components/checkout/PaymentForm";
import { getSettings } from "@/lib/data/settings";
import { codAllowed } from "@/lib/cod";

export const metadata = { title: "Payment" };

/** Payment step (development: test payment on the dashboard store). */
export default async function PaymentPage({ params, searchParams }: { params: Promise<{ orderId: string }>; searchParams: Promise<{ buy?: string }> }) {
  const buyNow = (await searchParams).buy === "now";
  if (!USE_DASHBOARD_STORE) notFound();
  const { orderId } = await params;
  const order = await db.orders.get(orderId);
  if (!order) notFound();
  const settings = await getSettings();
  const cod = codAllowed(settings, order);
  if (order.status !== "pending_payment") redirect(`/order/success/${order.id}`);
  return (
    <>
      <PageHeader title="Payment" crumb="Checkout" />
      <div className="container-x py-12">
        <CheckoutSteps current={3} buyNow={buyNow} />
        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_420px] lg:gap-12">
          <PaymentForm orderId={order.id} total={order.total} buyNow={buyNow} cod={cod.ok ? { fee: settings.cod_fee ?? 0 } : null} />
          <aside className="h-fit lg:sticky lg:top-32">
            <OrderSummary order={order} />
          </aside>
        </div>
      </div>
    </>
  );
}
