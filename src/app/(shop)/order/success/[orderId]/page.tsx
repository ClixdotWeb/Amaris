import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getOrder } from "@/lib/data/orders";
import { formatINR } from "@/lib/format";
import { DispatchNote } from "@/components/product/DispatchNote";

export const metadata = { title: "Order placed" };

export default async function OrderSuccessPage({ params }: { params: Promise<{ orderId: string }> }) {
  await requireUser();
  const order = await getOrder((await params).orderId);
  if (!order) notFound();

  return (
    <section>
      <h1>Thank you! Your order is confirmed.</h1>
      <p>Order number: {order.order_number}</p>
      <p>A confirmation email has been sent to {order.email}.</p>

      <ul>
        {order.items.map((i) => (
          <li key={i.id}>
            {i.product_name} × {i.quantity}: {formatINR(i.line_total)}
            <DispatchNote type={i.dispatch_type} />
          </li>
        ))}
      </ul>
      <p>Total paid: {formatINR(order.total)}</p>

      <p>We will email you the India Post consignment number once your order is dispatched.</p>
      <Link href={`/account/orders/${order.id}`}>View order</Link> ·{" "}
      <Link href={`/account/orders/${order.id}/invoice`}>Download invoice</Link> · <Link href="/">Continue shopping</Link>
    </section>
  );
}
