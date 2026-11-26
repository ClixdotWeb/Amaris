import Link from "next/link";
import { Package, Plus, Pencil } from "lucide-react";
import { z } from "zod";
import { db, PRODUCT_SORTS, type ProductSort } from "@/lib/db";
import { formatINR } from "@/lib/format";
import { productCode, productTitle } from "@/lib/admin/productDisplay";
import { effectivePrice } from "@/lib/pricing";
import { Pagination } from "@/components/admin/Pagination";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { Badge, EmptyState, PageHeader, Section } from "@/components/admin/ui";
import { InstantSwitch } from "@/components/admin/Switch";
import { ProductToolbar } from "@/components/admin/products/ProductToolbar";
import { StockBar } from "@/components/admin/products/StockBar";
import { bulkProducts, setLive, setStitching } from "./actions";
import { RestoreButton } from "./RestoreButton";
import { BulkBar, PageCheck, RowCheck, SelectionProvider } from "@/components/admin/products/BulkSelection";
import { FlashToast } from "@/components/admin/Toaster";
import type { ProductWithRelations } from "@/types";

export const metadata = { title: "Products" };

const FLASH = { deleted: "Product deleted. Find it under Show: Deleted to restore it.", created: "Product added. It's at the top of the list." };

const PAGE_SIZE = 24;

const filtersSchema = z.object({
  q: z.string().trim().max(100).optional().catch(undefined),
  category: z.string().max(80).optional().catch(undefined),
  status: z.enum(["published", "draft", "archived", "deleted"]).optional().catch(undefined),
  stitching: z.enum(["on", "off"]).optional().catch(undefined),
  flag: z.enum(["new", "deal", "premium"]).optional().catch(undefined),
  stock: z.enum(["out", "low"]).optional().catch(undefined),
  sort: z.enum(PRODUCT_SORTS).optional().catch(undefined),
  view: z.enum(["list", "grid"]).optional().catch(undefined),
  page: z.coerce.number().int().min(1).optional().catch(undefined),
});

/** Sortable header: first click sorts one way, second click the other. */
const SORT_PAIRS: Record<string, [ProductSort, ProductSort]> = {
  name: ["name", "name"],
  price: ["price_asc", "price_desc"],
  stock: ["stock_asc", "stock_desc"],
};

export default async function AdminProductsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const raw = await searchParams;
  const f = filtersSchema.parse(raw);
  const [result, categories] = await Promise.all([
    db.products.list({
      q: f.q || undefined,
      categorySlug: f.category || undefined,
      status: f.status,
      stitching: f.stitching,
      flag: f.flag,
      stock: f.stock,
      sort: f.sort,
      page: f.page,
      pageSize: PAGE_SIZE,
    }),
    db.categories.list(),
  ]);
  const filtered = !!(f.q || f.category || (f.status && f.status !== "deleted") || f.stitching || f.flag || f.stock);
  const deletedView = f.status === "deleted";
  const keep = { q: f.q, category: f.category, status: f.status, stitching: f.stitching, flag: f.flag, stock: f.stock, sort: f.sort, view: f.view };
  const ids = result.rows.map((p) => p.id);

  const sortHref = (key: keyof typeof SORT_PAIRS) => {
    const [a, b] = SORT_PAIRS[key];
    const next = f.sort === a && a !== b ? b : a;
    const p = new URLSearchParams(Object.entries({ ...keep, sort: next }).filter((e): e is [string, string] => !!e[1]));
    return `/admin/products?${p}`;
  };
  const sortState = (key: keyof typeof SORT_PAIRS): "asc" | "desc" | null => {
    const [a, b] = SORT_PAIRS[key];
    return f.sort === a ? "asc" : f.sort === b ? "desc" : null;
  };

  const empty = (
    <EmptyState
      icon={Package}
      title={filtered ? "No products match" : "No products yet"}
      action={!filtered && <Link href="/admin/products/new" className="btn-primary btn-sm">Add your first product</Link>}
    >
      {filtered ? "Try another search or clear the filters." : undefined}
    </EmptyState>
  );

  const columns: Column<ProductWithRelations>[] = [
    { key: "select", header: "", headerNode: <PageCheck ids={ids} />, cell: (p) => <RowCheck id={p.id} label={p.name} />, className: "w-10" },
    { key: "product", header: "Product", sort: { href: sortHref("name"), active: f.sort === "name" ? "asc" : null }, cell: (p) => <ProductInfo p={p} /> },
    { key: "price", header: "Price", align: "right", sort: { href: sortHref("price"), active: sortState("price") }, cell: (p) => <Price p={p} /> },
    { key: "stock", header: "Stock", sort: { href: sortHref("stock"), active: sortState("stock") }, cell: (p) => <StockBar product={p} /> },
    { key: "flags", header: "Shown in", cell: (p) => <Flags p={p} /> },
    { key: "stitching", header: "Stitching", cell: (p) => <StitchingSwitch p={p} /> },
    deletedView
      ? { key: "restore", header: "", align: "right", cell: (p) => <RestoreButton id={p.id} size="xs" /> }
      : { key: "live", header: "Live", cell: (p) => <LiveSwitch p={p} /> },
    ...(deletedView
      ? []
      : [
          {
            key: "edit",
            header: "",
            align: "right" as const,
            cell: (p: ProductWithRelations) => (
              <Link
                href={`/admin/products/${p.id}`}
                title="Edit"
                aria-label={`Edit ${p.name}`}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-sand !text-ink !no-underline transition-colors hover:border-maroon hover:bg-maroon hover:!text-white"
              >
                <Pencil size={14} strokeWidth={1.6} aria-hidden />
              </Link>
            ),
          },
        ]),
  ];

  return (
    <>
      <PageHeader
        eyebrow="Catalogue"
        title="Products"
        description={`${result.total} product${result.total === 1 ? "" : "s"}${filtered ? " match your filters" : " in the catalogue"}`}
        actions={
          <Link href="/admin/products/new" className="btn-primary btn-sm">
            <Plus size={14} strokeWidth={1.5} aria-hidden /> Add product
          </Link>
        }
      />

      <FlashToast messages={FLASH} />
      <SelectionProvider resetKey={JSON.stringify(keep) + (f.page ?? 1)}>
      <Section
        title={deletedView ? "Deleted products" : "Manage products"}
        description={
          deletedView
            ? "Hidden everywhere. Restore one to bring it back as Hidden."
            : "Search, filter and update your catalogue. Tick rows for bulk changes."
        }
        toolbar={<ProductToolbar categories={categories.map((c) => ({ value: c.slug, label: c.name }))} />}
        footer={<Pagination basePath="/admin/products" params={keep} page={result.page} pageSize={PAGE_SIZE} total={result.total} />}
      >
        {f.view === "grid" ? (
          result.rows.length === 0 ? (
            empty
          ) : (
            <div className="px-3 pt-2 pb-4">
              <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
                {result.rows.map((p) => (
                  <li key={p.id} className="card group relative flex flex-col overflow-hidden rounded-card transition-shadow duration-300 hover:shadow-pop">
                    <Link href={`/admin/products/${p.id}`} className="relative block aspect-[4/5] overflow-hidden bg-cream">
                      {p.images[0] && (
                        <img src={p.images[0].thumb_url ?? p.images[0].url} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-700 ease-soft group-hover:scale-[1.03]" />
                      )}
                      <span className="absolute top-2 left-2"><StatusBadge p={p} /></span>
                    </Link>
                    <span className="absolute top-2 right-2 rounded-[4px] bg-white/90 p-1.5 shadow-sm"><RowCheck id={p.id} label={p.name} /></span>
                    <div className="flex flex-1 flex-col gap-3 p-4">
                      <div>
                        <Link href={`/admin/products/${p.id}`} className="line-clamp-2 font-display text-lg leading-snug hover:text-maroon">{productTitle(p.name)}</Link>
                        <p className="mt-0.5 text-xs text-muted">{[p.sku ?? productCode(p.name), p.category.name].filter(Boolean).join(" · ")}</p>
                      </div>
                      <Price p={p} left />
                      <StockBar product={p} />
                      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-sand pt-3 text-xs text-muted">
                        {deletedView ? <RestoreButton id={p.id} size="xs" /> : <span className="flex items-center gap-2">Live <LiveSwitch p={p} /></span>}
                        {p.product_type === "unstitched" && <span className="flex items-center gap-2">Stitching <StitchingSwitch p={p} /></span>}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )
        ) : (
          <DataTable<ProductWithRelations> caption="Products" rows={result.rows} rowKey={(p) => p.id} empty={empty} columns={columns} />
        )}
      </Section>
      <BulkBar run={bulkProducts} deletedView={deletedView} />
      </SelectionProvider>
    </>
  );
}

function ProductInfo({ p }: { p: ProductWithRelations }) {
  const code = p.sku ?? productCode(p.name);
  return (
    <span className="flex items-center gap-3.5 text-left">
      <span className="h-16 w-12 shrink-0 overflow-hidden rounded-media border border-sand bg-cream">
        {p.images[0] && <img src={p.images[0].thumb_url ?? p.images[0].url} alt="" width={48} height={64} loading="lazy" className="h-full w-full object-cover" />}
      </span>
      <span className="min-w-0">
        <Link href={`/admin/products/${p.id}`} className="!no-underline hover:!underline">
          <span className="block max-w-[22rem] truncate text-[0.95rem] text-ink">{productTitle(p.name)}</span>
        </Link>
        <span className="mt-0.5 block text-xs text-muted">
          {code && <span className="tracking-wide">{code} · </span>}
          {p.category.name}
        </span>
      </span>
    </span>
  );
}

function Price({ p, left = false }: { p: ProductWithRelations; left?: boolean }) {
  const { price, compareAt } = effectivePrice(p);
  const scheduled = !compareAt && p.sale_price != null && !!p.sale_starts_at && new Date(p.sale_starts_at) > new Date();
  return (
    <span className={`block whitespace-nowrap ${left ? "text-left" : ""}`}>
      <span className={compareAt ? "text-sale" : ""}>{formatINR(price)}</span>
      {p.product_type === "running_material" && <span className="text-xs text-muted"> / m</span>}
      {compareAt && <span className="ml-1.5 text-xs text-muted line-through">{formatINR(compareAt)}</span>}
      {scheduled && <span className="block text-[11px] text-muted">Sale from {new Date(p.sale_starts_at!).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>}
    </span>
  );
}

function StatusBadge({ p }: { p: ProductWithRelations }) {
  if (p.deleted_at) return <Badge tone="danger">Deleted</Badge>;
  const st = p.status ?? (p.is_active ? "published" : "draft");
  return st === "published" ? <Badge tone="success">Live</Badge> : st === "archived" ? <Badge>Archived</Badge> : <Badge tone="warning">Hidden</Badge>;
}

function Flags({ p }: { p: ProductWithRelations }) {
  const flags = [p.is_new_arrival && <Badge key="n" tone="gold">New</Badge>, p.is_hot_deal && <Badge key="d" tone="danger">Deal</Badge>, p.is_premium && <Badge key="p" tone="maroon">Premium</Badge>, p.is_preorder && <Badge key="o">Pre-order</Badge>].filter(Boolean);
  return flags.length ? <span className="flex flex-wrap justify-end gap-1 lg:justify-start">{flags}</span> : <span className="text-muted">—</span>;
}

function StitchingSwitch({ p }: { p: ProductWithRelations }) {
  if (p.product_type !== "unstitched") return <span className="text-muted" title="Only unstitched suits have the stitching option">—</span>;
  return (
    <InstantSwitch
      checked={p.stitching_available}
      label={`Offer stitching for ${p.name}`}
      save={setStitching.bind(null, p.id)}
      onMessage={`Stitching turned on for ${productTitle(p.name)}.`}
      offMessage={`Stitching turned off for ${productTitle(p.name)}. It's sold as fabric only.`}
    />
  );
}

function LiveSwitch({ p }: { p: ProductWithRelations }) {
  if (p.status === "archived") return <Badge>Archived</Badge>;
  return (
    <InstantSwitch
      checked={p.is_active}
      label={`Show ${p.name} on the store`}
      save={setLive.bind(null, p.id)}
      onMessage={`${productTitle(p.name)} is live on the store.`}
      offMessage={`${productTitle(p.name)} is hidden from the store.`}
    />
  );
}
