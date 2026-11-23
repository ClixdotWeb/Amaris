import { notFound } from "next/navigation";
import { getOrder } from "@/lib/data/orders";
import { OrderDetail } from "@/components/account/OrderDetail";

export const metadata = { title: "Order details" };

export default async function MyOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const order = await getOrder((await params).id);
  if (!order) notFound();
  return <OrderDetail order={order} />;
}
