import Link from "next/link";
import { Search } from "lucide-react";
import { db } from "@/lib/db";
import { formatDate, formatINR } from "@/lib/format";
import { Card, EmptyState, PageHeader } from "@/components/admin/ui";
import { OrderStatusLabel } from "@/components/account/OrderStatusLabel";

export const metadata = { title: "Search" };

/** Global search from the top bar: orders (number, customer, email, phone) and products (name, code). */
export default async function AdminSearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const q = (await searchParams).q?.trim().slice(0, 100) ?? "";
  const [orders, products] = q
    ? await Promise.all([db.orders.list({ q, pageSize: 10 }), db.products.list({ q, pageSize: 10 })])
    : [null, null];

  return (
    <>
      <PageHeader eyebrow="Find anything" title="Search" />
      <form role="search" className="flex max-w-xl gap-2">
        <label htmlFor="q" className="sr-only">Search</label>
        <input id="q" name="q" type="search" defaultValue={q} placeholder="Order no., customer name, email, phone or product" autoFocus />
        <button type="submit" className="btn-primary btn-sm shrink-0">Search</button>
      </form>

      {!q ? (
        <Card>
          <EmptyState icon={Search} title="Find anything">Search orders by number, customer name, email or phone, and products by name or code.</EmptyState>
        </Card>
      ) : orders!.total + products!.total === 0 ? (
        <Card>
          <EmptyState icon={Search} title={`Nothing found for “${q}”`}>Check the spelling, or search with part of the number or name.</EmptyState>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card title={`Orders (${orders!.total})`} padded={false}>
            {orders!.rows.length === 0 ? (
              <p className="p-5 text-sm text-muted">No orders match.</p>
            ) : (
              <ul className="divide-y divide-sand">
                {orders!.rows.map((o) => (
                  <li key={o.id}>
                    <Link href={`/admin/orders/${o.id}`} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-cream/60">
                      <span>
                        <span className="text-maroon">{o.order_number}</span> · {o.shipping_address.full_name}
                        <span className="block text-xs text-muted">{formatDate(o.created_at)} · {formatINR(o.total)}</span>
                      </span>
                      <OrderStatusLabel status={o.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            {orders!.total > 10 && (
              <p className="border-t border-sand px-5 py-3 text-sm"><Link className="text-maroon underline underline-offset-4" href={`/admin/orders?q=${encodeURIComponent(q)}`}>See all {orders!.total} orders</Link></p>
            )}
          </Card>
          <Card title={`Products (${products!.total})`} padded={false}>
            {products!.rows.length === 0 ? (
              <p className="p-5 text-sm text-muted">No products match.</p>
            ) : (
              <ul className="divide-y divide-sand">
                {products!.rows.map((p) => (
                  <li key={p.id}>
                    <Link href={`/admin/products/${p.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-cream/60">
                      {p.images[0] ? (
                        <img src={p.images[0].thumb_url ?? p.images[0].url} alt="" width={40} height={52} className="h-[52px] w-10 shrink-0 rounded-media object-cover" />
                      ) : (
                        <span className="h-[52px] w-10 shrink-0 rounded-media bg-cream" />
                      )}
                      <span className="min-w-0">
                        <span className="block truncate">{p.name}</span>
                        <span className="block text-xs text-muted">{p.category.name} · {formatINR(p.price)}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            {products!.total > 10 && (
              <p className="border-t border-sand px-5 py-3 text-sm"><Link className="text-maroon underline underline-offset-4" href={`/admin/products?q=${encodeURIComponent(q)}`}>See all {products!.total} products</Link></p>
            )}
          </Card>
        </div>
      )}
    </>
  );
}
