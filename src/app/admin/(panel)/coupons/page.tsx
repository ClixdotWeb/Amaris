import Link from "next/link";
import { Plus, TicketPercent } from "lucide-react";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin/guard";
import { describeCoupon } from "@/lib/coupons";
import { formatDate } from "@/lib/format";
import { Badge, Card, EmptyState, PageHeader, Section } from "@/components/admin/ui";
import { DataTable } from "@/components/admin/DataTable";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { FlashToast } from "@/components/admin/Toaster";
import { CouponForm, CouponSwitch } from "./CouponForm";
import { deleteCoupon } from "./actions";
import type { Coupon } from "@/types";

export const metadata = { title: "Coupons" };

function state(c: Coupon, now = new Date()) {
  if (!c.is_active) return <Badge>Off</Badge>;
  if (c.ends_at && now > new Date(c.ends_at)) return <Badge>Expired</Badge>;
  if (c.starts_at && now < new Date(c.starts_at)) return <Badge tone="gold">Scheduled</Badge>;
  if (c.usage_limit != null && c.used_count >= c.usage_limit) return <Badge>Used up</Badge>;
  return <Badge tone="success">Live</Badge>;
}

export default async function CouponsPage({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  await requireAdmin("/admin/coupons");
  const { edit } = await searchParams;
  const coupons = await db.coupons.list();
  const editing = edit === "new" ? null : (coupons.find((c) => c.id === edit) ?? null);

  return (
    <>
      <PageHeader
        eyebrow="Marketing"
        title="Coupons"
        description="Discount codes customers enter in the cart. The discount applies to the items, not to stitching or shipping."
        actions={
          <Link href="/admin/coupons?edit=new" className="btn-primary btn-sm">
            <Plus size={15} strokeWidth={1.5} aria-hidden /> New coupon
          </Link>
        }
      />
      <FlashToast messages={{ saved: "Coupon saved.", added: "Coupon created. Customers can use it now." }} />

      {(edit === "new" || editing) && (
        <Card title={editing ? `Edit ${editing.code}` : "New coupon"}>
          <CouponForm key={edit} coupon={editing} />
        </Card>
      )}

      <Section title="Your coupons" description="Switch a coupon off to stop it without deleting it.">
        <DataTable<Coupon>
          caption="Coupons"
          rows={coupons}
          rowKey={(c) => c.id}
          empty={
            <EmptyState icon={TicketPercent} title="No coupons yet" action={<Link href="/admin/coupons?edit=new" className="btn-primary btn-sm">New coupon</Link>}>
              Create a code for a festival, an Instagram post or a returning customer.
            </EmptyState>
          }
          columns={[
            {
              key: "code",
              header: "Code",
              cell: (c) => (
                <span>
                  <span className="rounded-[6px] border border-dashed border-gold/70 bg-cream/60 px-2.5 py-1 font-mono text-[13px] font-semibold tracking-wider">{c.code}</span>
                  {c.description && <span className="mt-1.5 block text-xs text-muted">{c.description}</span>}
                </span>
              ),
            },
            { key: "offer", header: "Offer", cell: (c) => <span className="block max-w-[16rem]">{describeCoupon(c)}</span> },
            {
              key: "dates",
              header: "Valid",
              cell: (c) =>
                c.starts_at || c.ends_at ? (
                  <span className="text-sm whitespace-nowrap">
                    {c.starts_at ? formatDate(c.starts_at) : "Now"} – {c.ends_at ? formatDate(c.ends_at) : "no end"}
                  </span>
                ) : (
                  <span className="text-muted">Always</span>
                ),
            },
            { key: "used", header: "Used", align: "right", cell: (c) => <span className="stat-number">{c.used_count}{c.usage_limit != null ? ` / ${c.usage_limit}` : ""}</span> },
            { key: "state", header: "Status", cell: (c) => state(c) },
            { key: "on", header: "On", cell: (c) => <CouponSwitch id={c.id} code={c.code} active={c.is_active} /> },
            {
              key: "actions",
              header: "",
              cell: (c) => (
                <span className="flex justify-end gap-2">
                  <Link href={`/admin/coupons?edit=${c.id}`} className="btn-outline btn-sm">Edit</Link>
                  <ConfirmButton action={deleteCoupon} fields={{ id: c.id }} label="Delete" title={`Delete ${c.code}?`} message="Customers won't be able to use this code any more." confirmLabel="Delete coupon" />
                </span>
              ),
            },
          ]}
        />
      </Section>
    </>
  );
}
