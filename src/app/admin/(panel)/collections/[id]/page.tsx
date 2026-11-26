import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin/guard";
import { pickerProducts } from "@/lib/admin/picker";
import { PageHeader } from "@/components/admin/ui";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { CollectionForm } from "../CollectionForm";
import { deleteCollection } from "../actions";

export const metadata = { title: "Collection" };

/** /admin/collections/new creates one; /admin/collections/<id> edits it. */
export default async function CollectionEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireAdmin(`/admin/collections/${id}`);
  const collection = id === "new" ? null : await db.collections.get(id);
  if (id !== "new" && !collection) notFound();
  const products = await pickerProducts();
  return (
    <>
      <PageHeader
        back={{ href: "/admin/collections", label: "Collections" }}
        title={collection ? collection.name : "New collection"}
        description={collection ? <>In the shop at <a href={`/collections/${collection.slug}`} target="_blank" rel="noreferrer" className="text-maroon underline underline-offset-4">/collections/{collection.slug}</a></> : "A hand-picked group of products with its own page in the shop."}
        actions={
          collection && (
            <ConfirmButton
              action={deleteCollection}
              fields={{ id: collection.id }}
              label="Delete"
              title={`Delete ${collection.name}?`}
              message="The collection page will disappear from the shop. The products themselves are not changed."
              confirmLabel="Delete collection"
            />
          )
        }
      />
      <CollectionForm collection={collection} products={products} />
    </>
  );
}
