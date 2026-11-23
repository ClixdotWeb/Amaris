import Link from "next/link";
import { listOrders } from "@/lib/data/orders";
import { ORDER_STATUS_LABELS, OrderStatusLabel } from "@/components/account/OrderStatusLabel";
import { formatDate, formatINR } from "@/lib/format";
import type { OrderStatus } from "@/types";

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const valid = status && status in ORDER_STATUS_LABELS ? (status as OrderStatus) : undefined;
  const orders = await listOrders(valid);

  return (
    <section>
      <h1>Orders</h1>
      <nav aria-label="Filter by status">
        <Link href="/admin/orders">All</Link>
        {Object.entries(ORDER_STATUS_LABELS).map(([k, label]) => (
          <Link key={k} href={`/admin/orders?status=${k}`} aria-current={valid === k ? "page" : undefined}>
            {label}
          </Link>
        ))}
      </nav>

      <table>
        <thead>
          <tr>
            <th>Order</th>
            <th>Date</th>
            <th>Customer</th>
            <th>Items</th>
            <th>Made to order?</th>
            <th>Total</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id}>
              <td><Link href={`/admin/orders/${o.id}`}>{o.order_number}</Link></td>
              <td>{formatDate(o.created_at)}</td>
              <td>{o.shipping_address.full_name}<br />{o.phone}</td>
              <td>{o.items.length}</td>
              <td>{o.items.some((i) => i.dispatch_type === "made_to_order") ? "Yes (45–60 days)" : "No (48 h)"}</td>
              <td>{formatINR(o.total)}</td>
              <td><OrderStatusLabel status={o.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
