import Link from "next/link";
import { PackageCheck, Printer } from "lucide-react";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin/guard";
import { formatDate, formatINR } from "@/lib/format";
import { Badge, EmptyState, FilterPills, PageHeader, Section } from "@/components/admin/ui";
import { DataTable } from "@/components/admin/DataTable";
import { OrderStatusLabel } from "@/components/account/OrderStatusLabel";
import { DispatchRowForm, MarkPackedButton } from "./DispatchRowForm";
import type { OrderWithItems } from "@/types";

export const metadata = { title: "Dispatch" };

/** An order can go once every made-to-order item in it is marked ready in Stitching. */
const waitingOn = (o: OrderWithItems) => o.items.filter((i) => i.dispatch_type === "made_to_order" && i.production_status !== "ready").length;

export default async function DispatchPage({ searchParams }: { searchParams: Promise<{ show?: string }> }) {
  await requireAdmin("/admin/dispatch");
  const { show } = await searchParams;
  const [paid, preparing] = await Promise.all([
    db.orders.list({ status: "paid", page: 1, pageSize: 500 }),
    db.orders.list({ status: "processing", page: 1, pageSize: 500 }),
  ]);
  const all = [...paid.rows, ...preparing.rows].sort((a, b) => a.created_at.localeCompare(b.created_at));
  const ready = all.filter((o) => waitingOn(o) === 0);
  const waiting = all.filter((o) => waitingOn(o) > 0);
  const rows = show === "waiting" ? waiting : show === "all" ? all : ready;
  const labelIds = rows.map((o) => o.id).join(",");

  return (
    <>
      <PageHeader
        eyebrow="Sales"
        title="Dispatch"
        description="Paid orders to send by India Post, oldest first. Enter the consignment number to dispatch; the customer is emailed."
        actions={
          rows.length > 0 && (
            <a href={`/admin/print/labels?ids=${labelIds}`} target="_blank" rel="noreferrer" className="btn-outline btn-sm">
              <Printer size={15} strokeWidth={1.5} aria-hidden /> Print {rows.length} label{rows.length === 1 ? "" : "s"}
            </a>
          )
        }
      />

      <Section
        title="Orders to send"
        description="Mark an order packed when it's ready at the counter, then dispatch it with the India Post number."
        toolbar={
          <FilterPills
            stretch
            items={[
              { href: "/admin/dispatch", label: "Ready to send", active: !show, count: ready.length },
              { href: "/admin/dispatch?show=waiting", label: "Waiting on stitching", active: show === "waiting", count: waiting.length },
              { href: "/admin/dispatch?show=all", label: "All paid orders", active: show === "all", count: all.length },
            ]}
          />
        }
      >
        <DataTable<OrderWithItems>
          caption="Orders to dispatch"
          rows={rows}
          rowKey={(o) => o.id}
          empty={
            <EmptyState icon={PackageCheck} title={show === "waiting" ? "Nothing waiting on stitching" : "Nothing to send"}>
              {show === "waiting" ? "Every made-to-order item is ready." : "Paid orders that are ready appear here."}
            </EmptyState>
          }
          columns={[
            {
              key: "order",
              header: "Order",
              cell: (o) => (
                <span>
                  <Link href={`/admin/orders/${o.id}`} className="font-medium">{o.order_number}</Link>
                  <span className="block text-xs whitespace-nowrap text-muted">{formatDate(o.created_at)}</span>
                </span>
              ),
            },
            {
              key: "to",
              header: "Send to",
              cell: (o) => (
                <span className="block max-w-[16rem]">
                  {o.shipping_address.full_name}
                  <span className="block text-xs text-muted">
                    {o.shipping_address.city}, {o.shipping_address.state} {o.shipping_address.pincode}
                  </span>
                </span>
              ),
            },
            {
              key: "items",
              header: "Items",
              cell: (o) => {
                const w = waitingOn(o);
                return (
                  <span className="flex flex-col items-start gap-1">
                    <span className="text-sm">{o.items.reduce((n, i) => n + i.quantity, 0)} item{o.items.reduce((n, i) => n + i.quantity, 0) === 1 ? "" : "s"}</span>
                    {w > 0 ? <Badge tone="warning">{w} in stitching</Badge> : o.items.some((i) => i.dispatch_type === "made_to_order") ? <Badge tone="success">Stitched</Badge> : null}
                  </span>
                );
              },
            },
            {
              key: "status",
              header: "Status",
              cell: (o) => (
                <span className="flex flex-col items-start gap-1 [&>span]:rounded-ui [&>span]:whitespace-nowrap">
                  <OrderStatusLabel status={o.status} />
                  {o.payment_method === "cod" && <Badge tone="warning">COD {formatINR(o.total)}</Badge>}
                </span>
              ),
            },
            {
              key: "send",
              header: "Dispatch",
              align: "right",
              cell: (o) => (
                <span className="flex flex-wrap items-center justify-end gap-2 xl:flex-nowrap">
                  {o.status === "paid" && <MarkPackedButton id={o.id} />}
                  <DispatchRowForm id={o.id} orderNumber={o.order_number} />
                </span>
              ),
            },
          ]}
        />
      </Section>
    </>
  );
}
