import Link from "next/link";
import { ImageOff, Search, ShoppingBag } from "lucide-react";
import { db } from "@/lib/db";
import { ORDER_STATUS_LABELS, OrderStatusLabel } from "@/components/account/OrderStatusLabel";
import { Pagination } from "@/components/admin/Pagination";
import { DataTable } from "@/components/admin/DataTable";
import { Badge, EmptyState, FilterPills, PageHeader, Section } from "@/components/admin/ui";
import { formatDate, formatINR } from "@/lib/format";
import type { OrderStatus, OrderWithItems } from "@/types";

export const metadata = { title: "Orders" };

const PAGE_SIZE = 25;

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<{ status?: string; page?: string; q?: string }> }) {
  const { status, page, q } = await searchParams;
  const valid = status && status in ORDER_STATUS_LABELS ? (status as OrderStatus) : undefined;
  const query = q?.trim().slice(0, 100) || undefined;
  const result = await db.orders.list({ status: valid, q: query, page: Number(page) || 1, pageSize: PAGE_SIZE });
  const href = (s?: string) => {
    const p = new URLSearchParams(Object.entries({ status: s, q: query }).filter((e): e is [string, string] => !!e[1]));
    return p.size ? `/admin/orders?${p}` : "/admin/orders";
  };

  return (
    <>
      <PageHeader eyebrow="Sales" title="Orders" description={`${result.total} order${result.total === 1 ? "" : "s"}${valid || query ? " match" : " in total"}. Newest first.`} />

      <Section
        title="Manage orders"
        description="Search by order number, customer name, email or phone, or filter by status."
        toolbar={
      <div className="space-y-4">
      <form role="search" className="relative flex max-w-xl gap-2">
        {valid && <input type="hidden" name="status" value={valid} />}
        <label htmlFor="orders-q" className="sr-only">Search orders</label>
        <Search size={16} strokeWidth={1.5} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-muted" aria-hidden />
        <input id="orders-q" name="q" type="search" defaultValue={query} placeholder="Order no., name, email or phone" className="!h-10 !border-sand-strong/60 !py-0 !pl-10 text-sm" />
        <button type="submit" className="btn-outline btn-sm !h-10 shrink-0 !py-0">Search</button>
      </form>

      <FilterPills
        items={[
          { href: href(), label: "All", active: !valid },
          ...Object.entries(ORDER_STATUS_LABELS).map(([k, label]) => ({ href: href(k), label, active: valid === k })),
        ]}
      />
      </div>
        }
        footer={<Pagination basePath="/admin/orders" params={{ status: valid, q: query }} page={result.page} pageSize={PAGE_SIZE} total={result.total} />}
      >
        <DataTable<OrderWithItems>
          caption="Orders"
          rows={result.rows}
          rowKey={(o) => o.id}
          empty={
            <EmptyState icon={ShoppingBag} title="No orders here">
              {query ? `Nothing matches “${query}”.` : valid ? `No orders are “${ORDER_STATUS_LABELS[valid]}”.` : "Orders appear here once customers pay."}
            </EmptyState>
          }
          columns={[
            {
              key: "no",
              header: "Order",
              cell: (o) => (
                <Link href={`/admin/orders/${o.id}`} className="group/o flex items-center gap-4 !no-underline">
                  <OrderPhotos items={o.items} />
                  <span className="min-w-0">
                    <span className="block font-medium text-maroon underline-offset-4 group-hover/o:underline">{o.order_number}</span>
                    <span className="mt-0.5 block text-xs text-muted">{formatDate(o.created_at)}</span>
                  </span>
                </Link>
              ),
            },
            {
              key: "products",
              header: "Products",
              className: "lg:max-w-[16rem]",
              cell: (o) => {
                const count = o.items.reduce((n, i) => n + i.quantity, 0);
                return (
                  <span className="block min-w-0">
                    <span className="block truncate">{o.items[0]?.product_name ?? "—"}</span>
                    <span className="mt-0.5 block text-xs text-muted">
                      {o.items.length > 1 ? `+${o.items.length - 1} more · ` : ""}
                      {count} item{count === 1 ? "" : "s"}
                    </span>
                  </span>
                );
              },
            },
            {
              key: "customer",
              header: "Customer",
              cell: (o) => (
                <span className="block">
                  {o.shipping_address.full_name}
                  <span className="mt-0.5 block text-xs text-muted">{o.phone}</span>
                </span>
              ),
            },
            {
              key: "dispatch",
              header: "Dispatch",
              cell: (o) =>
                o.items.some((i) => i.dispatch_type === "made_to_order") ? <Badge tone="gold">45–60 days</Badge> : <Badge>48 hours</Badge>,
            },
            { key: "total", header: "Total", align: "right", cell: (o) => <span className="stat-number text-[15px]">{formatINR(o.total)}</span> },
            {
              key: "status",
              header: "Status",
              cell: (o) => (
                <span className="[&>span]:rounded-ui">
                  <OrderStatusLabel status={o.status} />
                </span>
              ),
            },
          ]}
        />
      </Section>
    </>
  );
}

/** Up to three product photos, overlapping, so the order is recognisable at a glance. */
function OrderPhotos({ items }: { items: OrderWithItems["items"] }) {
  const photos = items.filter((i) => i.image_url).slice(0, 3);
  const extra = items.length - photos.length;
  return (
    <span aria-hidden className="flex w-[88px] shrink-0 -space-x-4">
      {photos.length === 0 ? (
        <span className="flex h-[52px] w-10 items-center justify-center rounded-[8px] bg-sand text-muted">
          <ImageOff size={16} strokeWidth={1.25} />
        </span>
      ) : (
        photos.map((i, n) => (
          <img
            key={i.id}
            src={i.image_url!}
            alt=""
            width={40}
            height={52}
            loading="lazy"
            className="h-[52px] w-10 rounded-[8px] object-cover ring-2 ring-white"
            style={{ zIndex: 3 - n }}
          />
        ))
      )}
      {extra > 0 && photos.length > 0 && (
        <span className="relative z-0 flex h-[52px] w-10 items-center justify-center rounded-[8px] bg-cream pl-3 text-[11px] text-muted ring-2 ring-white">+{extra}</span>
      )}
    </span>
  );
}
