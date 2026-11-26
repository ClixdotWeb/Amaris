"use client";
import Link from "next/link";
import { useActionState } from "react";
import { saveCollection } from "./actions";
import { Field, FormSection } from "@/components/admin/ui";
import { FormSwitch } from "@/components/admin/Switch";
import { ProductPicker, type PickerProduct } from "@/components/admin/ProductPicker";
import { useActionToast } from "@/components/admin/Toaster";
import type { Collection } from "@/types";

export function CollectionForm({ collection, products }: { collection: Collection | null; products: PickerProduct[] }) {
  const [state, action, pending] = useActionState(saveCollection, undefined);
  useActionToast(state);
  return (
    <form action={action} className="space-y-6">
      {collection && <input type="hidden" name="id" value={collection.id} />}
      <FormSection title="Details" description="Shown as the page title and description in the shop.">
        <div className="grid gap-5 md:grid-cols-2 [&>*]:min-w-0">
          <Field label="Name" htmlFor="col-name">
            <input id="col-name" name="name" required maxLength={80} defaultValue={collection?.name} />
          </Field>
          <Field label="Web address" htmlFor="col-slug" hint="Shown as /collections/… Leave empty to make one from the name.">
            <input id="col-slug" name="slug" maxLength={80} defaultValue={collection?.slug} aria-describedby="col-slug-hint" />
          </Field>
        </div>
        <Field label="Description" htmlFor="col-desc">
          <textarea id="col-desc" name="description" rows={2} maxLength={400} defaultValue={collection?.description ?? ""} />
        </Field>
        <Field label="Cover photo (web address)" htmlFor="col-image" hint="Optional. Empty uses the first product's photo.">
          <input id="col-image" name="image_url" type="url" maxLength={600} placeholder="https://res.cloudinary.com/…" defaultValue={collection?.image_url ?? ""} aria-describedby="col-image-hint" />
        </Field>
        <FormSwitch name="is_active" defaultChecked={collection?.is_active ?? true} label="Show in the shop" hint="Active collections appear in the shop menu and at /collections." />
      </FormSection>

      <FormSection title="Products" description="Products show in this order on the collection page. Only live products are shown in the shop.">
        <ProductPicker name="product_ids" all={products} initial={collection?.product_ids ?? []} />
      </FormSection>

      <div className="sticky bottom-0 z-10 -mx-4 flex justify-end gap-2 border-t border-sand bg-ivory/95 px-4 py-3 backdrop-blur md:-mx-8 md:px-8">
        <Link href="/admin/collections" className="btn-outline btn-sm">Cancel</Link>
        <button type="submit" className="btn-primary btn-sm" disabled={pending}>
          {pending ? "Saving…" : collection ? "Save collection" : "Create collection"}
        </button>
      </div>
    </form>
  );
}
