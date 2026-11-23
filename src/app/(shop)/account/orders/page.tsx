import Link from "next/link";
import { listMyOrders } from "@/lib/data/orders";
import { OrderStatusLabel } from "@/components/account/OrderStatusLabel";
import { formatDate, formatINR } from "@/lib/format";

export const metadata = { title: "My orders" };

export default async function MyOrdersPage() {
  const orders = await listMyOrders();
  return (
    <section>
      <h2 className="mb-6 font-display text-3xl">My orders</h2>
      {orders.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-muted">No orders yet.</p>
          <Link href="/new-arrivals" className="btn-primary mt-5">Start shopping</Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="table-amaris">
            <thead>
              <tr>
                <th>Order</th>
                <th>Date</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td><Link href={`/account/orders/${o.id}`}>{o.order_number}</Link></td>
                  <td>{formatDate(o.created_at)}</td>
                  <td>{o.items.length}</td>
                  <td>{formatINR(o.total)}</td>
                  <td><OrderStatusLabel status={o.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
