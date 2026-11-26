"use client";
import Link from "next/link";
import { useActionState } from "react";
import { saveCategory } from "./actions";
import { Field } from "@/components/admin/ui";
import { FormSwitch } from "@/components/admin/Switch";
import { Select } from "@/components/admin/Select";
import { useActionToast } from "@/components/admin/Toaster";
import type { Category } from "@/types";
import { PRODUCT_TYPES } from "./productTypes";

/** Add or edit a category. The product type decides what customers choose on the product page. */
export function CategoryForm({ category, locked }: { category: Category | null; locked: boolean }) {
  const [state, action, pending] = useActionState(saveCategory, undefined);
  useActionToast(state);
  return (
    <form action={action} className="grid gap-5 md:grid-cols-2 [&>*]:min-w-0">
      {category && <input type="hidden" name="id" value={category.id} />}
      <Field label="Name" htmlFor="cat-name">
        <input id="cat-name" name="name" required maxLength={80} defaultValue={category?.name} />
      </Field>
      <Field label="Web address" htmlFor="cat-slug" hint="Shown as /shop/… Leave empty to make one from the name.">
        <input id="cat-slug" name="slug" maxLength={80} defaultValue={category?.slug} aria-describedby="cat-slug-hint" />
      </Field>
      <Field label="Product type" htmlFor="cat-type" hint={locked ? "Can't change while the category has products." : "Decides what customers choose on the product page."}>
        {locked ? (
          <>
            <input type="hidden" name="product_type" value={category!.product_type} />
            <input id="cat-type" disabled value={PRODUCT_TYPES.find((t) => t.value === category!.product_type)?.label} />
          </>
        ) : (
          <Select id="cat-type" name="product_type" label="Product type" defaultValue={category?.product_type ?? "ready_made"} options={PRODUCT_TYPES} />
        )}
      </Field>
      <Field label="Cover photo (web address)" htmlFor="cat-image" hint="Optional. A Cloudinary link; empty uses the built-in photo.">
        <input id="cat-image" name="image_url" type="url" maxLength={600} placeholder="https://res.cloudinary.com/…" defaultValue={category?.image_url ?? ""} aria-describedby="cat-image-hint" />
      </Field>
      <div className="md:col-span-2">
        <Field label="Description" htmlFor="cat-desc" hint="Shown at the top of the category page.">
          <textarea id="cat-desc" name="description" rows={2} maxLength={500} defaultValue={category?.description ?? ""} aria-describedby="cat-desc-hint" />
        </Field>
      </div>
      <FormSwitch name="is_visible" defaultChecked={category?.is_visible !== false} label="Show in the shop" hint="Hidden categories and their products don't appear on the website." />
      <div className="flex items-end justify-end gap-2">
        <Link href="/admin/categories" className="btn-outline btn-sm">Cancel</Link>
        <button type="submit" className="btn-primary btn-sm" disabled={pending}>
          {pending ? "Saving…" : category ? "Save category" : "Add category"}
        </button>
      </div>
    </form>
  );
}
