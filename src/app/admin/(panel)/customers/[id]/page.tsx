import Link from "next/link";
import { notFound } from "next/navigation";
import { Mail, MessageCircle, Phone, ShoppingBag } from "lucide-react";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin/guard";
import { formatDate, formatINR } from "@/lib/format";
import { Badge, Card, EmptyState, PageHeader, Section } from "@/components/admin/ui";
import { DataTable } from "@/components/admin/DataTable";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { OrderStatusLabel } from "@/components/account/OrderStatusLabel";
import { setCustomerBlocked } from "../actions";
import { NotesForm } from "./NotesForm";
import type { OrderWithItems } from "@/types";

export const metadata = { title: "Customer" };

export default async function CustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireAdmin(`/admin/customers/${id}`);
  const data = await db.customers.get(id);
  if (!data) notFound();
  const { customer: c, orders } = data;
  const lastAddress = orders[0]?.shipping_address;
  const wa = c.phone.replace(/\D/g, "");

  return (
    <>
      <PageHeader
        back={{ href: "/admin/customers", label: "Customers" }}
        title={c.full_name}
        description={`Customer since ${formatDate(c.created_at)}`}
        actions={
          c.is_blocked ? (
            <ConfirmButton action={setCustomerBlocked} fields={{ id: c.id }} tone="primary" label="Unblock" title={`Unblock ${c.full_name}?`} message="They can sign in and order again." confirmLabel="Unblock" />
          ) : (
            <ConfirmButton
              action={setCustomerBlocked}
              fields={{ id: c.id, block: "on" }}
              label="Block"
              title={`Block ${c.full_name}?`}
              message="They won't be able to sign in or check out. Existing orders are not changed."
              confirmLabel="Block customer"
            />
          )
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Orders", value: c.orders },
          { label: "Spent", value: formatINR(c.spent) },
          { label: "Average order", value: formatINR(c.orders ? Math.round(c.spent / Math.max(1, orders.filter((o) => ["paid", "processing", "dispatched", "delivered"].includes(o.status)).length)) : 0) },
        ].map((s) => (
          <div key={s.label} className="card rounded-card p-5">
            <p className="text-[11px] tracking-[0.18em] text-muted uppercase">{s.label}</p>
            <p className="stat-number mt-2 text-3xl">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_360px] [&>*]:min-w-0">
        <Section title="Orders" description="Newest first.">
          <DataTable<OrderWithItems>
            caption={`Orders by ${c.full_name}`}
            rows={orders}
            rowKey={(o) => o.id}
            empty={<EmptyState icon={ShoppingBag} title="No orders yet" />}
            columns={[
              {
                key: "no",
                header: "Order",
                cell: (o) => (
                  <span>
                    <Link href={`/admin/orders/${o.id}`} className="font-medium">{o.order_number}</Link>
                    <span className="block text-xs text-muted">{formatDate(o.created_at)}</span>
                  </span>
                ),
              },
              { key: "items", header: "Products", cell: (o) => <span className="block max-w-[16rem] truncate">{o.items.map((i) => i.product_name).join(", ")}</span> },
              { key: "total", header: "Total", align: "right", cell: (o) => <span className="stat-number">{formatINR(o.total)}</span> },
              { key: "status", header: "Status", cell: (o) => <span className="[&>span]:rounded-ui"><OrderStatusLabel status={o.status} /></span> },
            ]}
          />
        </Section>

        <div className="space-y-5">
          <Card title="Contact">
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-3">
                <Mail size={15} className="text-muted" aria-hidden />
                <a href={`mailto:${c.email}`}>{c.email}</a>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={15} className="text-muted" aria-hidden />
                <a href={`tel:${c.phone}`}>{c.phone}</a>
              </li>
              {wa.length >= 10 && (
                <li className="flex items-center gap-3">
                  <MessageCircle size={15} className="text-muted" aria-hidden />
                  <a href={`https://wa.me/${wa.length === 10 ? `91${wa}` : wa}`} target="_blank" rel="noreferrer">WhatsApp</a>
                </li>
              )}
            </ul>
            {lastAddress && (
              <div className="mt-5 border-t border-sand/70 pt-4 text-sm">
                <p className="mb-1 text-[11px] tracking-[0.18em] text-muted uppercase">Last delivery address</p>
                <p>{lastAddress.line1}</p>
                {lastAddress.line2 && <p>{lastAddress.line2}</p>}
                <p>
                  {lastAddress.city}, {lastAddress.state} {lastAddress.pincode}
                </p>
              </div>
            )}
            <div className="mt-4">{c.is_blocked ? <Badge tone="danger">Blocked</Badge> : <Badge tone="success">Active</Badge>}</div>
          </Card>
          <Card title="Private notes">
            <NotesForm id={c.id} notes={c.notes} />
          </Card>
        </div>
      </div>
    </>
  );
}
