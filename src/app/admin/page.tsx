import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatINR } from "@/lib/format";

const LOW_STOCK = 3;

export default async function AdminDashboard() {
  const supabase = await createClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [toDispatch, todays, lowStock] = await Promise.all([
    supabase.from("orders").select("id", { count: "exact", head: true }).in("status", ["paid", "processing"]),
    supabase.from("orders").select("total").neq("status", "pending_payment").gte("created_at", today.toISOString()),
    supabase
      .from("products")
      .select("id, name, stock_qty, product_type")
      .eq("is_active", true)
      .eq("is_preorder", false)
      .neq("product_type", "custom_made")
      .lte("stock_qty", LOW_STOCK)
      .limit(20),
  ]);

  const todaysRevenue = (todays.data ?? []).reduce((s, o) => s + o.total, 0);

  return (
    <section>
      <h1>Dashboard</h1>
      <dl>
        <dt>Orders to dispatch</dt>
        <dd><Link href="/admin/orders?status=paid">{toDispatch.count ?? 0}</Link></dd>
        <dt>Orders today</dt>
        <dd>{todays.data?.length ?? 0}</dd>
        <dt>Revenue today</dt>
        <dd>{formatINR(todaysRevenue)}</dd>
      </dl>

      <h2>Low stock (≤ {LOW_STOCK})</h2>
      <p>Products with size variants are tracked per size. Check them on the product page.</p>
      <ul>
        {(lowStock.data ?? []).map((p) => (
          <li key={p.id}>
            <Link href={`/admin/products/${p.id}`}>{p.name}</Link>: {p.stock_qty}
            {p.product_type === "running_material" ? " m" : ""}
          </li>
        ))}
      </ul>
    </section>
  );
}
