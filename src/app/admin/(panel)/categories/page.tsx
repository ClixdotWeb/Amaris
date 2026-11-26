import Link from "next/link";
import { ExternalLink, Plus, Tags } from "lucide-react";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin/guard";
import { categoryPhoto } from "@/lib/data/mock";
import { Badge, Card, EmptyState, PageHeader, Section } from "@/components/admin/ui";
import { DataTable } from "@/components/admin/DataTable";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { FlashToast } from "@/components/admin/Toaster";
import { MoveButtons } from "@/components/admin/MoveButtons";
import { CategoryForm } from "./CategoryForm";
import { PRODUCT_TYPES } from "./productTypes";
import { VisibleSwitch } from "./VisibleSwitch";
import { deleteCategory, moveCategory } from "./actions";
import type { Category } from "@/types";

export const metadata = { title: "Categories" };

const FLASH = { saved: "Category saved.", added: "Category added." };

export default async function CategoriesPage({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  await requireAdmin("/admin/categories");
  const { edit } = await searchParams;
  const [categories, counts] = await Promise.all([db.categories.list(), db.categories.productCounts()]);
  const editing = edit === "new" ? null : (categories.find((c) => c.id === edit) ?? null);
  const showForm = edit === "new" || !!editing;

  return (
    <>
      <PageHeader
        eyebrow="Catalogue"
        title="Categories"
        description="The shop menu, the category pages and the home page circles follow this list and its order."
        actions={
          <Link href="/admin/categories?edit=new" className="btn-primary btn-sm">
            <Plus size={15} strokeWidth={1.5} aria-hidden /> Add category
          </Link>
        }
      />
      <FlashToast messages={FLASH} />

      {showForm && (
        <Card title={editing ? `Edit ${editing.name}` : "New category"} description="Changes show in the shop straight away.">
          <CategoryForm key={edit} category={editing} locked={!!editing && (counts[editing.id] ?? 0) > 0} />
        </Card>
      )}

      <Section title="Manage categories" description="Use the arrows to change the order in the shop menu. Switch a category off to hide it.">
        <DataTable<Category>
          caption="Categories"
          rows={categories}
          rowKey={(c) => c.id}
          empty={<EmptyState icon={Tags} title="No categories yet">Add the first one to start building the menu.</EmptyState>}
          columns={[
            {
              key: "order",
              header: "Order",
              cell: (c) => {
                const i = categories.indexOf(c);
                return <MoveButtons label={c.name} up={moveCategory.bind(null, c.id, -1)} down={moveCategory.bind(null, c.id, 1)} isFirst={i === 0} isLast={i === categories.length - 1} />;
              },
            },
            {
              key: "name",
              header: "Category",
              cell: (c) => {
                const photo = c.image_url || categoryPhoto(c.slug, 200);
                return (
                  <span className="flex items-center gap-3">
                    <span className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-cream">
                      {photo && <img src={photo} alt="" width={44} height={44} loading="lazy" className="h-full w-full object-cover" />}
                    </span>
                    <span className="min-w-0">
                      <span className="block font-medium">{c.name}</span>
                      <span className="block text-xs text-muted">/shop/{c.slug}</span>
                    </span>
                  </span>
                );
              },
            },
            { key: "type", header: "Product type", cell: (c) => <Badge>{PRODUCT_TYPES.find((t) => t.value === c.product_type)?.label.split(" (")[0]}</Badge> },
            { key: "count", header: "Products", align: "right", cell: (c) => <span className="stat-number">{counts[c.id] ?? 0}</span> },
            { key: "visible", header: "In shop", cell: (c) => <VisibleSwitch id={c.id} name={c.name} visible={c.is_visible !== false} /> },
            {
              key: "actions",
              header: "",
              cell: (c) => (
                <span className="flex items-center justify-end gap-2">
                  <a href={`/shop/${c.slug}`} target="_blank" rel="noreferrer" className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:text-maroon" aria-label={`View ${c.name} in the shop`}>
                    <ExternalLink size={15} strokeWidth={1.5} />
                  </a>
                  <Link href={`/admin/categories?edit=${c.id}`} className="btn-outline btn-sm">Edit</Link>
                  {(counts[c.id] ?? 0) === 0 ? (
                    <ConfirmButton
                      action={deleteCategory}
                      fields={{ id: c.id }}
                      label="Remove"
                      title={`Remove ${c.name}?`}
                      message="The category has no products. It will disappear from the shop menu."
                      confirmLabel="Remove category"
                    />
                  ) : (
                    // Keeps the Edit buttons lined up with rows that have a Remove button
                    <span aria-hidden className="hidden w-[5.6rem] lg:block" />
                  )}
                </span>
              ),
            },
          ]}
        />
      </Section>
    </>
  );
}
