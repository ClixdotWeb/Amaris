import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, ImageOff, RotateCcw } from "lucide-react";
import { db } from "@/lib/db";
import { Badge, Card, EmptyState, PageHeader, type BadgeTone } from "@/components/admin/ui";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { FlashToast } from "@/components/admin/Toaster";
import { PhotoManager } from "@/components/admin/products/PhotoManager";
import { saleActive } from "@/lib/pricing";
import { ProductForm } from "../ProductForm";
import { deleteImage, deleteProduct, duplicateProduct, reorderImages } from "../actions";
import { RestoreButton } from "../RestoreButton";
import type { ProductStatus } from "@/types";

const FLASH = { saved: "Product saved.", created: "Product added.", copied: "Copy created. It's hidden until you set it Live." };
const STATUS: Record<ProductStatus, { label: string; tone: BadgeTone }> = {
  published: { label: "Live", tone: "success" },
  draft: { label: "Hidden", tone: "warning" },
  archived: { label: "Archived", tone: "neutral" },
};

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const p = await db.products.get((await params).id);
  return { title: p ? p.name : "Product" };
}

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, categories] = await Promise.all([db.products.get(id), db.categories.list()]);
  if (!product) notFound();
  const status = STATUS[product.status ?? (product.is_active ? "published" : "draft")];

  return (
    <>
      <FlashToast messages={FLASH} />
      <PageHeader
        title={product.name}
        back={{ href: "/admin/products", label: "All products" }}
        description={
          <span className="inline-flex flex-wrap items-center gap-2">
            {product.deleted_at ? <Badge tone="danger">Deleted</Badge> : <Badge tone={status.tone}>{status.label}</Badge>}
            {saleActive(product) && <Badge tone="danger">On sale</Badge>}
            <span>{[product.sku, product.category.name].filter(Boolean).join(" · ")}</span>
          </span>
        }
        actions={
          product.deleted_at ? (
            <RestoreButton id={product.id} />
          ) : (
            <>
              <Link href={`/product/${product.slug}`} target="_blank" className="btn-outline btn-sm">
                View on site <ArrowUpRight size={14} strokeWidth={1.5} aria-hidden />
              </Link>
              <ConfirmButton
                action={duplicateProduct}
                fields={{ id: product.id }}
                label="Duplicate"
                title="Make a copy?"
                message="A hidden copy with the same details, photos and stock is created, then opened so you can change it. Give it its own product code."
                confirmLabel="Make a copy"
                tone="primary"
              />
              <ConfirmButton
                action={deleteProduct}
                fields={{ id: product.id }}
                label="Delete"
                title="Delete this product?"
                message="It disappears from the store and the product list. Past orders keep their link, and you can restore it from Products → Show: Deleted."
                confirmLabel="Delete product"
              />
            </>
          )
        }
      />

      {product.deleted_at && (
        <p className="flex items-center gap-2 rounded-card border border-sale/30 bg-sale/5 p-4 text-sm">
          <RotateCcw size={16} strokeWidth={1.5} className="text-sale" aria-hidden />
          This product is deleted. Restore it to edit or sell it again; it comes back hidden.
        </p>
      )}

      <Card title="Photos" actions={<span className="text-xs text-muted">Drag to reorder · the first photo is the main one</span>}>
        {product.images.length === 0 ? (
          <EmptyState icon={ImageOff} title="No photos yet">Add photos in the form below.</EmptyState>
        ) : (
          <PhotoManager
            images={product.images}
            save={reorderImages.bind(null, product.id)}
            removeButtons={Object.fromEntries(
              product.images.map((img, i) => [
                img.id,
                <ConfirmButton
                  key={img.id}
                  action={deleteImage}
                  fields={{ id: img.id }}
                  label={`Remove photo ${i + 1}`}
                  title="Remove this photo?"
                  message="It will no longer show on the product page."
                  confirmLabel="Remove photo"
                  trigger="icon"
                />,
              ]),
            )}
          />
        )}
      </Card>

      {!product.deleted_at && <ProductForm key={product.updated_at} categories={categories} product={product} />}
    </>
  );
}
