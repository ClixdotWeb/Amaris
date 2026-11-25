import Link from "next/link";
import { ArrowRight, ImageOff, PackageCheck, Plus, ShoppingBag } from "lucide-react";
import { db, LOW_STOCK_THRESHOLD } from "@/lib/db";
import { formatINR } from "@/lib/format";
import { SALE_STATUSES, istStartOfToday } from "@/lib/admin/orderStatus";
import { istDay } from "@/lib/admin/dates";
import { getAdmin } from "@/lib/admin/guard";
import { Badge, EmptyState, Section } from "@/components/admin/ui";
import { OrderStatusLabel } from "@/components/account/OrderStatusLabel";
import { OverviewTiles, SalesTrend, type DayPoint } from "@/components/admin/overview/OverviewCards";
import { Lotus } from "@/components/ui/Lotus";

export const metadata = { title: "Overview" };

const LOW_STOCK = LOW_STOCK_THRESHOLD;
const SHOW = 8;
const DAY_MS = 86_400_000;

/** Greeting for the time of day in India. */
function greeting(now = new Date()) {
  const h = Number(now.toLocaleString("en-IN", { hour: "numeric", hour12: false, timeZone: "Asia/Kolkata" }));
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

export default async function AdminDashboard() {
  const todayStart = istStartOfToday();
  const weekStart = new Date(new Date(todayStart).getTime() - 6 * DAY_MS).toISOString();
  const lastWeekStart = new Date(new Date(todayStart).getTime() - 13 * DAY_MS).toISOString();
  const [fresh, preparing, week, lowStock, latest, admin] = await Promise.all([
    db.orders.countByStatus(["paid"]),
    db.orders.countByStatus(["processing"]),
    db.orders.createdSince(lastWeekStart),
    db.products.lowStock(LOW_STOCK),
    db.orders.list({ page: 1, pageSize: 5 }),
    getAdmin(),
  ]);
  const account = admin ? await db.admins.findByEmail(admin.email) : null;

  // Last 7 days (IST), only real sales: paid and not cancelled or refunded
  const sales = week.filter((o) => SALE_STATUSES.includes(o.status));
  const days: DayPoint[] = Array.from({ length: 7 }, (_, i) => {
    const start = new Date(new Date(weekStart).getTime() + i * DAY_MS);
    const day = istDay(start.toISOString());
    const ofDay = sales.filter((o) => istDay(o.created_at) === day);
    return {
      day,
      label: start.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", timeZone: "Asia/Kolkata" }),
      orders: ofDay.length,
      revenue: ofDay.reduce((s, o) => s + o.total, 0),
    };
  });
  const lastWeekRevenue = sales.filter((o) => o.created_at < weekStart).reduce((s, o) => s + o.total, 0);
  const toDispatch = fresh + preparing;
  const soldOut = lowStock.filter((r) => r.stock <= 0).length;
  const date = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" });
  const firstName = account?.full_name && account.full_name !== "Admin" ? account.full_name.split(" ")[0] : null;

  return (
    <>
      {/* Welcome banner in the shop's burgundy */}
      <section className="relative overflow-hidden rounded-card bg-maroon-dark px-6 py-7 text-ivory shadow-lift md:px-9 md:py-8">
        <span aria-hidden className="pointer-events-none absolute -top-24 -right-16 h-72 w-72 rounded-full bg-maroon/60 blur-3xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div className="min-w-0">
            <p className="flex items-center gap-2.5 text-[11px] tracking-[0.3em] text-gold-light/80 uppercase">
              <Lotus width={16} height={11} className="shrink-0 text-gold-light" />
              {date}
            </p>
            <h1 className="mt-2.5 font-display text-[2.2rem] leading-[1.05] text-white md:text-[2.75rem]">
              {greeting()}
              {firstName ? `, ${firstName}` : ""}
            </h1>
            {/* One short line; the figures themselves are in the cards below */}
            <p className="mt-2.5 max-w-xl text-sm leading-relaxed text-ivory/75">
              {toDispatch ? "Here's what needs your attention today." : "You're all caught up. Every paid order is on its way."}
            </p>
          </div>
          <Link href="/admin/products/new" className="btn-light btn-sm">
            <Plus size={15} strokeWidth={1.5} aria-hidden /> Add product
          </Link>
        </div>
      </section>

      <OverviewTiles fresh={fresh} preparing={preparing} days={days} soldOut={soldOut} low={lowStock.length - soldOut} />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px] [&>*]:min-w-0">
        <Section className="h-full" title="Sales this week" description="Takings per day over the last 7 days. Hover a bar for details.">
          <SalesTrend days={days} lastWeekRevenue={lastWeekRevenue} />
        </Section>

        <Section
          title="Latest orders"
          description="The five most recent orders."
          actions={
            <Link href="/admin/orders" className="inline-flex items-center gap-1.5 text-[11px] tracking-[0.18em] text-maroon uppercase hover:underline">
              All <ArrowRight size={13} strokeWidth={1.5} aria-hidden />
            </Link>
          }
        >
          {latest.rows.length === 0 ? (
            <EmptyState icon={ShoppingBag} title="No orders yet">Orders appear here once customers pay.</EmptyState>
          ) : (
            <ul className="space-y-1 px-1 pb-2">
              {latest.rows.map((o) => {
                const name = o.shipping_address.full_name;
                const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("");
                const count = o.items.reduce((s, i) => s + i.quantity, 0);
                return (
                  <li key={o.id}>
                    <Link href={`/admin/orders/${o.id}`} className="group flex items-center gap-3 rounded-[12px] p-2.5 transition-colors hover:bg-cream/60">
                      <span aria-hidden className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-maroon/10 font-display text-[15px] text-maroon">
                        {initials}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm text-ink group-hover:text-maroon">{name}</span>
                        <span className="block text-[11px] tracking-wider text-muted">
                          {o.order_number} · {count} item{count === 1 ? "" : "s"}
                        </span>
                      </span>
                      <span className="shrink-0 text-right">
                        <span className="stat-number block text-[15px]">{formatINR(o.total)}</span>
                        <span className="mt-1 block [&>span]:rounded-ui [&>span]:!px-2 [&>span]:!py-0.5 [&>span]:!text-[10px]">
                          <OrderStatusLabel status={o.status} />
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Section>
      </div>

      <Section
        title="Running low"
        description={`Products with ${LOW_STOCK} or fewer left in stock, emptiest first.`}
        actions={
          <Link href="/admin/products?stock=low" className="inline-flex items-center gap-1.5 text-[11px] tracking-[0.18em] text-maroon uppercase hover:underline">
            See all {lowStock.length} <ArrowRight size={13} strokeWidth={1.5} aria-hidden />
          </Link>
        }
      >
        {lowStock.length === 0 ? (
          <EmptyState icon={PackageCheck} title="Nothing is running low">Every product has more than {LOW_STOCK} in stock.</EmptyState>
        ) : (
          <ul className="space-y-2 px-1 pb-2" aria-label={`Products with ${LOW_STOCK} or fewer in stock`}>
            {lowStock.slice(0, SHOW).map((r) => {
              const out = r.stock <= 0;
              return (
                <li key={`${r.productId}-${r.size ?? ""}`}>
                  <Link
                    href={`/admin/products/${r.productId}`}
                    className="group flex items-center gap-4 rounded-[12px] bg-cream/40 p-2.5 pr-4 transition-colors hover:bg-cream/80"
                  >
                    <span className="flex h-[68px] w-[52px] shrink-0 items-center justify-center overflow-hidden rounded-[8px] bg-sand">
                      {r.image ? (
                        <img src={r.image} alt="" width={52} height={68} loading="lazy" className={`h-full w-full object-cover transition-transform duration-500 ease-soft group-hover:scale-105 ${out ? "grayscale-[60%]" : ""}`} />
                      ) : (
                        <ImageOff size={18} strokeWidth={1.25} className="text-muted" aria-hidden />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] text-ink group-hover:text-maroon">{r.name}</span>
                      <span className="mt-0.5 block truncate text-xs text-muted">
                        {[r.category, r.size].filter(Boolean).join(" · ") || "One stock figure"}
                      </span>
                    </span>
                    <span className="hidden w-32 shrink-0 sm:block" aria-hidden>
                      <span className={`block h-1.5 overflow-hidden rounded-full ${out ? "bg-sale/15" : "bg-sand"}`}>
                        <span className={`block h-full rounded-full ${out ? "bg-sale" : "bg-warning"}`} style={{ width: `${Math.min(100, (Math.max(0, r.stock) / LOW_STOCK) * 100)}%` }} />
                      </span>
                      <span className="mt-1.5 block text-[11px] text-muted">
                        {out ? "Restock needed" : `${r.stock}${r.unit === "m" ? " m" : r.stock === 1 ? " piece" : " pieces"} left`}
                      </span>
                    </span>
                    <span className="shrink-0 text-right sm:w-[5.5rem]">
                      {out ? <Badge tone="danger">Sold out</Badge> : <Badge tone="warning">{r.stock}{r.unit === "m" ? " m" : " left"}</Badge>}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Section>
    </>
  );
}
