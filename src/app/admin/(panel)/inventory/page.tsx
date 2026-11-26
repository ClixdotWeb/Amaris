import Link from "next/link";
import { Boxes, History, Search } from "lucide-react";
import { db, LOW_STOCK_THRESHOLD, type StockRow } from "@/lib/db";
import { requireAdmin } from "@/lib/admin/guard";
import { Badge, EmptyState, FilterPills, PageHeader, Section } from "@/components/admin/ui";
import { DataTable } from "@/components/admin/DataTable";
import { Pagination } from "@/components/admin/Pagination";
import { Select } from "@/components/admin/Select";
import { AdjustStock } from "./AdjustStock";
import type { StockMovement } from "@/types";

export const metadata = { title: "Inventory" };

const REASONS: Record<StockMovement["reason"], string> = {
  restock: "New stock",
  correction: "Correction",
  damaged: "Damaged",
  returned: "Returned",
  sale: "Sold",
  cancelled: "Order cancelled",
};

type Params = { q?: string; category?: string; stock?: string; view?: string; page?: string };

export default async function InventoryPage({ searchParams }: { searchParams: Promise<Params> }) {
  await requireAdmin("/admin/inventory");
  const sp = await searchParams;
  const history = sp.view === "history";
  const stock = ["out", "low", "in"].includes(sp.stock ?? "") ? (sp.stock as "out" | "low" | "in") : undefined;
  const page = Math.max(1, Number(sp.page) || 1);
  const [categories, result, moves] = await Promise.all([
    db.categories.list(),
    history ? null : db.inventory.list({ q: sp.q, categorySlug: sp.category, stock, page }),
    history ? db.inventory.history({ page }) : null,
  ]);
  const keep = { q: sp.q, category: sp.category, stock };
  const href = (s?: string) => {
    const q = new URLSearchParams(Object.entries({ ...keep, stock: s }).filter((e): e is [string, string] => !!e[1]));
    return q.size ? `/admin/inventory?${q}` : "/admin/inventory";
  };

  return (
    <>
      <PageHeader eyebrow="Catalogue" title="Inventory" description="Stock for every product, size and colour. Custom-made items are made to order and aren't counted." />

      <nav aria-label="Inventory views" className="flex gap-2">
        <Link href="/admin/inventory" aria-current={!history ? "page" : undefined} className={`chip ${!history ? "chip-active" : ""}`}>
          <Boxes size={14} className="mr-1.5" aria-hidden /> Stock
        </Link>
        <Link href="/admin/inventory?view=history" aria-current={history ? "page" : undefined} className={`chip ${history ? "chip-active" : ""}`}>
          <History size={14} className="mr-1.5" aria-hidden /> History
        </Link>
      </nav>

      {!history && result && (
        <Section
          title="Stock levels"
          description={`Change a figure with Add, Remove or Set to. Low means ${LOW_STOCK_THRESHOLD} or fewer.`}
          toolbar={
            <div className="space-y-4">
              <form role="search" className="grid gap-2 md:grid-cols-[minmax(0,1fr)_16rem_auto]">
                {stock && <input type="hidden" name="stock" value={stock} />}
                <div className="relative">
                  <label htmlFor="inv-q" className="sr-only">Search stock</label>
                  <Search size={16} strokeWidth={1.5} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-muted" aria-hidden />
                  <input id="inv-q" name="q" type="search" defaultValue={sp.q} placeholder="Product name, code, size or colour" className="!h-10 !border-sand-strong/60 !py-0 !pl-10 text-sm" />
                </div>
                <Select name="category" label="Category" defaultValue={sp.category ?? ""} options={[{ value: "", label: "All categories" }, ...categories.map((c) => ({ value: c.slug, label: c.name }))]} />
                <button type="submit" className="btn-primary btn-sm !h-10 !px-6 !py-0">Filter</button>
              </form>
              <FilterPills
                stretch
                items={[
                  { href: href(), label: "All", active: !stock },
                  { href: href("out"), label: "Sold out", active: stock === "out" },
                  { href: href("low"), label: "Low", active: stock === "low" },
                  { href: href("in"), label: "In stock", active: stock === "in" },
                ]}
              />
            </div>
          }
          footer={<Pagination basePath="/admin/inventory" params={keep} page={result.page} pageSize={result.pageSize} total={result.total} />}
        >
          <DataTable<StockRow>
            caption="Stock levels"
            rows={result.rows}
            rowKey={(r) => r.variantId ?? r.productId}
            empty={<EmptyState icon={Boxes} title="Nothing matches">Try another search or filter.</EmptyState>}
            columns={[
              {
                key: "product",
                header: "Product",
                cell: (r) => (
                  <Link href={`/admin/products/${r.productId}`} className="group/p flex items-center gap-3 !no-underline">
                    <span className="h-12 w-9 shrink-0 overflow-hidden rounded-[6px] bg-sand">
                      {r.image && <img src={r.image} alt="" width={36} height={48} loading="lazy" className="h-full w-full object-cover" />}
                    </span>
                    <span className="min-w-0">
                      <span className="block max-w-[18rem] truncate text-ink group-hover/p:text-maroon">{r.name}</span>
                      <span className="block text-xs text-muted">{[r.label, r.category].filter(Boolean).join(" · ")}</span>
                    </span>
                  </Link>
                ),
              },
              {
                key: "stock",
                header: "In stock",
                align: "right",
                cell: (r) => (
                  <span className="inline-flex items-center gap-2">
                    {r.stock <= 0 ? <Badge tone="danger">Sold out</Badge> : r.stock <= LOW_STOCK_THRESHOLD ? <Badge tone="warning">Low</Badge> : null}
                    <span className="stat-number text-lg">
                      {r.stock}
                      <span className="ml-1 text-xs text-muted">{r.unit === "m" ? "m" : "pcs"}</span>
                    </span>
                  </span>
                ),
              },
              { key: "adjust", header: "Change stock", align: "right", cell: (r) => <AdjustStock productId={r.productId} variantId={r.variantId} unit={r.unit} label={`${r.name}${r.label ? ` ${r.label}` : ""}`} /> },
            ]}
          />
        </Section>
      )}

      {history && moves && (
        <Section
          title="Stock history"
          description="Every change made here, newest first. Entries can't be edited."
          footer={<Pagination basePath="/admin/inventory" params={{ view: "history" }} page={moves.page} pageSize={moves.pageSize} total={moves.total} />}
        >
          <DataTable<StockMovement>
            caption="Stock history"
            rows={moves.rows}
            rowKey={(m) => m.id}
            empty={<EmptyState icon={History} title="No changes yet">Stock changes made on the Stock tab appear here.</EmptyState>}
            columns={[
              { key: "when", header: "When", cell: (m) => <span className="whitespace-nowrap">{new Date(m.created_at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" })}</span> },
              {
                key: "product",
                header: "Product",
                cell: (m) => (
                  <span>
                    <Link href={`/admin/products/${m.product_id}`}>{m.product_name}</Link>
                    {m.label && <span className="block text-xs text-muted">{m.label}</span>}
                  </span>
                ),
              },
              { key: "change", header: "Change", align: "right", cell: (m) => <span className={`stat-number ${m.change > 0 ? "text-success" : "text-sale"}`}>{m.change > 0 ? "+" : ""}{m.change}</span> },
              { key: "after", header: "Now", align: "right", cell: (m) => <span className="stat-number">{m.stock_after}</span> },
              {
                key: "reason",
                header: "Reason",
                cell: (m) => (
                  <span className="flex flex-wrap items-center gap-2">
                    <Badge>{REASONS[m.reason]}</Badge>
                    {m.note && <span className="text-xs text-muted">{m.note}</span>}
                  </span>
                ),
              },
              { key: "who", header: "By", cell: (m) => <span className="text-xs text-muted">{m.actor_email ?? "System"}</span> },
            ]}
          />
        </Section>
      )}
    </>
  );
}
