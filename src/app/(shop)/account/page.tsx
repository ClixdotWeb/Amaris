import Link from "next/link";
import { Package, MapPin, Truck } from "lucide-react";
import { getProfile, getUser } from "@/lib/auth";
import { listMyOrders } from "@/lib/data/orders";
import { OrderStatusLabel } from "@/components/account/OrderStatusLabel";
import { formatDate, formatINR } from "@/lib/format";

export const metadata = { title: "My Account" };

export default async function AccountPage() {
  const [user, profile, orders] = await Promise.all([getUser(), getProfile(), listMyOrders()]);
  const recent = orders.slice(0, 3);

  return (
    <section className="space-y-10">
      <div>
        <h2 className="font-display text-3xl">Hello{profile?.full_name ? `, ${profile.full_name}` : ""}</h2>
        {user?.email && <p className="text-sm text-muted">{user.email}</p>}
        {profile?.is_admin && <Link href="/admin" className="btn-outline mt-4">Go to admin panel</Link>}
      </div>

      <ul data-reveal-stagger className="grid gap-4 sm:grid-cols-3">
        {[
          { href: "/account/orders", icon: Package, title: "My orders", text: "View and track orders" },
          { href: "/account/addresses", icon: MapPin, title: "Addresses", text: "Manage saved addresses" },
          { href: "/track-order", icon: Truck, title: "Track order", text: "India Post tracking" },
        ].map(({ href, icon: Icon, title, text }) => (
          <li key={href}>
            <Link href={href} className="card flex h-full flex-col gap-2 p-5 transition hover:border-maroon">
              <Icon size={22} strokeWidth={1.4} className="text-maroon" />
              <span className="font-medium">{title}</span>
              <span className="text-xs text-muted">{text}</span>
            </Link>
          </li>
        ))}
      </ul>

      <div>
        <h3 className="mb-4 font-display text-2xl">Recent orders</h3>
        {recent.length ? (
          <ul className="card divide-y divide-sand">
            {recent.map((o) => (
              <li key={o.id}>
                <Link href={`/account/orders/${o.id}`} className="flex flex-wrap items-center justify-between gap-2 p-4 text-sm hover:bg-cream/50">
                  <span className="font-medium">{o.order_number}</span>
                  <span className="text-muted">{formatDate(o.created_at)}</span>
                  <span>{formatINR(o.total)}</span>
                  <OrderStatusLabel status={o.status} />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="card p-8 text-center">
            <p className="text-muted">You haven&apos;t placed any orders yet.</p>
            <Link href="/new-arrivals" className="btn-primary mt-5">Start shopping</Link>
          </div>
        )}
      </div>
    </section>
  );
}
