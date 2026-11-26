import Link from "next/link";
import { ExternalLink, Layers, Plus } from "lucide-react";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin/guard";
import { Badge, EmptyState, PageHeader, Section } from "@/components/admin/ui";
import { DataTable } from "@/components/admin/DataTable";
import { FlashToast } from "@/components/admin/Toaster";
import { MoveButtons } from "@/components/admin/MoveButtons";
import { moveCollection } from "./actions";
import type { Collection } from "@/types";

export const metadata = { title: "Collections" };

const FLASH = { saved: "Collection saved.", added: "Collection created.", removed: "Collection deleted." };

export default async function CollectionsPage() {
  await requireAdmin("/admin/collections");
  const [collections, { rows: products }, content] = await Promise.all([
    db.collections.list(),
    db.products.list({ page: 1, pageSize: 5000 }),
    db.content.get(),
  ]);
  const byId = new Map(products.map((p) => [p.id, p]));
  const flags = [
    { label: "New Arrivals", href: "/admin/products?flag=new", n: products.filter((p) => p.is_new_arrival).length },
    { label: "Hot Deals", href: "/admin/products?flag=deal", n: products.filter((p) => p.is_hot_deal).length },
    { label: "Premium", href: "/admin/products?flag=premium", n: products.filter((p) => p.is_premium).length },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Catalogue"
        title="Collections"
        description="Hand-picked groups of products, each with its own page in the shop."
        actions={
          <Link href="/admin/collections/new" className="btn-primary btn-sm">
            <Plus size={15} strokeWidth={1.5} aria-hidden /> New collection
          </Link>
        }
      />
      <FlashToast messages={FLASH} />

      <Section title="Your collections" description="Use the arrows to change the order in the shop menu. Feature one on the home page under Homepage.">
        <DataTable<Collection>
          caption="Collections"
          rows={collections}
          rowKey={(c) => c.id}
          empty={
            <EmptyState icon={Layers} title="No collections yet" action={<Link href="/admin/collections/new" className="btn-primary btn-sm">New collection</Link>}>
              Group products for a festival, a fabric or a season.
            </EmptyState>
          }
          columns={[
            {
              key: "order",
              header: "Order",
              cell: (c) => {
                const i = collections.indexOf(c);
                return <MoveButtons label={c.name} up={moveCollection.bind(null, c.id, -1)} down={moveCollection.bind(null, c.id, 1)} isFirst={i === 0} isLast={i === collections.length - 1} />;
              },
            },
            {
              key: "name",
              header: "Collection",
              cell: (c) => {
                const photos = c.product_ids.map((id) => byId.get(id)?.images[0]).filter(Boolean).slice(0, 3);
                return (
                  <Link href={`/admin/collections/${c.id}`} className="group/c flex items-center gap-4 !no-underline">
                    <span className="flex w-[76px] shrink-0 -space-x-4" aria-hidden>
                      {photos.map((img) => (
                        <img key={img!.id} src={img!.thumb_url ?? img!.url} alt="" width={36} height={48} className="h-12 w-9 rounded-[6px] object-cover ring-2 ring-white" />
                      ))}
                    </span>
                    <span className="min-w-0">
                      <span className="block font-medium text-ink group-hover/c:text-maroon">{c.name}</span>
                      <span className="block text-xs text-muted">/collections/{c.slug}</span>
                    </span>
                  </Link>
                );
              },
            },
            { key: "count", header: "Products", align: "right", cell: (c) => <span className="stat-number">{c.product_ids.length}</span> },
            {
              key: "status",
              header: "Status",
              cell: (c) => (
                <span className="flex flex-wrap gap-1.5">
                  {c.is_active ? <Badge tone="success">In shop</Badge> : <Badge>Hidden</Badge>}
                  {content.featured_collection_ids.includes(c.id) && <Badge tone="gold">On home page</Badge>}
                </span>
              ),
            },
            {
              key: "actions",
              header: "",
              cell: (c) => (
                <span className="flex items-center justify-end gap-2">
                  {c.is_active && (
                    <a href={`/collections/${c.slug}`} target="_blank" rel="noreferrer" className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:text-maroon" aria-label={`View ${c.name} in the shop`}>
                      <ExternalLink size={15} strokeWidth={1.5} />
                    </a>
                  )}
                  <Link href={`/admin/collections/${c.id}`} className="btn-outline btn-sm">Edit</Link>
                </span>
              ),
            },
          ]}
        />
      </Section>

      <Section title="Built-in collections" description="These pages fill themselves from a tick on each product. Change them on the product's page or with bulk actions.">
        <ul className="grid gap-3 px-1 pb-3 sm:grid-cols-3">
          {flags.map((f) => (
            <li key={f.label}>
              <Link href={f.href} className="flex items-center justify-between rounded-[14px] bg-cream/45 px-5 py-4 !no-underline transition-colors hover:bg-cream">
                <span className="text-ink">{f.label}</span>
                <span className="stat-number text-xl text-ink">{f.n}</span>
              </Link>
            </li>
          ))}
        </ul>
      </Section>
    </>
  );
}
