import Link from "next/link";
import { FileText, Scissors } from "lucide-react";
import { db, type ProductionRow } from "@/lib/db";
import { requireAdmin } from "@/lib/admin/guard";
import { describeSizing } from "@/lib/pricing";
import { formatDate } from "@/lib/format";
import { Badge, EmptyState, FilterPills, PageHeader, Section } from "@/components/admin/ui";
import { DataTable } from "@/components/admin/DataTable";
import { Pagination } from "@/components/admin/Pagination";
import { ProductionNote, ProductionStep } from "./ProductionControls";
import { PRODUCTION_LABELS } from "./labels";
import type { ProductionStatus } from "@/types";

export const metadata = { title: "Stitching" };

const DAY = 86_400_000;

function Due({ iso }: { iso: string }) {
  const days = Math.ceil((new Date(iso).getTime() - Date.now()) / DAY);
  const tone = days < 0 ? "danger" : days <= 10 ? "warning" : "neutral";
  return (
    <span className="flex flex-col items-start gap-1">
      <span className="whitespace-nowrap">{formatDate(iso)}</span>
      <Badge tone={tone}>{days < 0 ? `${-days} day${days === -1 ? "" : "s"} late` : days === 0 ? "Due today" : `${days} day${days === 1 ? "" : "s"} left`}</Badge>
    </span>
  );
}

export default async function ProductionPage({ searchParams }: { searchParams: Promise<{ status?: string; page?: string }> }) {
  await requireAdmin("/admin/production");
  const sp = await searchParams;
  const status = sp.status && sp.status in PRODUCTION_LABELS ? (sp.status as ProductionStatus) : undefined;
  const [result, counts] = await Promise.all([db.production.list({ status, page: Math.max(1, Number(sp.page) || 1) }), db.production.counts()]);
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const href = (s?: string) => (s ? `/admin/production?status=${s}` : "/admin/production");

  return (
    <>
      <PageHeader
        eyebrow="Sales"
        title="Stitching"
        description="Every custom-made item and stitched suit in paid orders, due 60 days after the order. Mark each step as the workshop goes."
      />

      <Section
        title="Workshop queue"
        description="Soonest due first. When every item of an order is Ready, the order moves to Ready to send in Dispatch."
        toolbar={
          <FilterPills
            stretch
            items={[
              { href: href(), label: "All", active: !status, count: total },
              ...(Object.keys(PRODUCTION_LABELS) as ProductionStatus[]).map((k) => ({ href: href(k), label: PRODUCTION_LABELS[k], active: status === k, count: counts[k] })),
            ]}
          />
        }
        footer={<Pagination basePath="/admin/production" params={{ status }} page={result.page} pageSize={result.pageSize} total={result.total} />}
      >
        <DataTable<ProductionRow>
          caption="Stitching queue"
          rows={result.rows}
          rowKey={(r) => r.item.id}
          empty={<EmptyState icon={Scissors} title="Nothing in the workshop">Custom-made and stitched items from paid orders appear here.</EmptyState>}
          columns={[
            { key: "due", header: "Due", cell: (r) => <Due iso={r.due_at} /> },
            {
              key: "item",
              header: "Item",
              cell: (r) => (
                <span className="flex items-center gap-3">
                  <span className="h-12 w-9 shrink-0 overflow-hidden rounded-[6px] bg-sand">
                    {r.item.image_url && <img src={r.item.image_url} alt="" width={36} height={48} loading="lazy" className="h-full w-full object-cover" />}
                  </span>
                  <span className="min-w-0">
                    <span className="block max-w-[13rem] truncate">{r.item.product_name}</span>
                    <span className="block text-xs text-muted">
                      {r.item.stitching ? "Stitching add-on" : "Custom made"} · {describeSizing(r.item.sizing) ?? "No size"}
                      {r.item.quantity > 1 ? ` · ×${r.item.quantity}` : ""}
                    </span>
                  </span>
                </span>
              ),
            },
            {
              key: "order",
              header: "Order",
              cell: (r) => (
                <span>
                  <Link href={`/admin/orders/${r.order.id}`}>{r.order.order_number}</Link>
                  <span className="block text-xs text-muted">{r.order.customer}</span>
                </span>
              ),
            },
            { key: "step", header: "Step", cell: (r) => <ProductionStep itemId={r.item.id} status={r.item.production_status ?? "not_started"} name={r.item.product_name} /> },
            { key: "note", header: "Note", cell: (r) => <ProductionNote itemId={r.item.id} note={r.item.production_note ?? null} /> },
            {
              key: "card",
              header: "",
              cell: (r) => (
                <a
                  href={`/admin/print/job-card/${r.item.id}`}
                  target="_blank"
                  rel="noreferrer"
                  title="Print job card"
                  aria-label={`Print job card for ${r.item.product_name}`}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-sand !text-muted !no-underline transition-colors hover:border-maroon hover:!text-maroon"
                >
                  <FileText size={15} strokeWidth={1.5} />
                </a>
              ),
            },
          ]}
        />
      </Section>
    </>
  );
}
