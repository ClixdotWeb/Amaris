"use client";
import { useActionState, useState } from "react";
import Link from "next/link";
import { Info } from "lucide-react";
import { saveProduct } from "./actions";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { useActionToast } from "@/components/admin/Toaster";
import { FormSwitch } from "@/components/admin/Switch";
import { Field, FormSection } from "@/components/admin/ui";
import { Select } from "@/components/admin/Select";
import { VariantEditor } from "@/components/admin/products/VariantEditor";
import { SeoFields } from "@/components/admin/products/SeoFields";
import { StatusPicker } from "@/components/admin/products/StatusPicker";
import { istDay } from "@/lib/admin/dates";
import { productCode } from "@/lib/admin/productDisplay";
import { formatINR } from "@/lib/format";
import type { Category, ProductType, ProductWithRelations } from "@/types";

const MAX_PHOTOS = 15;

const rupees = (paise: number | null | undefined) => (paise == null ? "" : String(paise / 100));

/** What each kind of category means for the customer, shown under the category picker. */
const TYPE_HELP: Record<ProductType, string> = {
  ready_made: "Ready to wear. Customers pick a size (if it has sizes) and quantity. Dispatched within 48 hours.",
  unstitched: "Sold as fabric. You can offer stitching to the customer's size or measurements.",
  custom_made: "Made to order in 45–60 days, in a standard size or to the customer's measurements.",
  running_material: "Fabric sold by the metre. Customers choose the length.",
};

const money = { type: "number", step: "0.01", min: 0, inputMode: "decimal" as const };

/** Add / edit product. Fields shown depend on the category's product type. */
export function ProductForm({ categories, product }: { categories: Category[]; product?: ProductWithRelations }) {
  const [state, action, pending] = useActionState(saveProduct, undefined);
  useActionToast(state);
  const [categoryId, setCategoryId] = useState(product?.category_id ?? categories[0]?.id ?? "");
  const [name, setName] = useState(product?.name ?? "");
  const [price, setPrice] = useState(rupees(product?.price));
  const [sale, setSale] = useState(rupees(product?.sale_price));
  const [saleStarts, setSaleStarts] = useState(istDay(product?.sale_starts_at));
  const [saleEnds, setSaleEnds] = useState(istDay(product?.sale_ends_at));
  const [uploading, setUploading] = useState(false);
  const type = categories.find((c) => c.id === categoryId)?.product_type ?? "ready_made";
  const code = product?.sku ?? productCode(name) ?? "";

  const p = Number(price);
  const s = Number(sale);
  const off = sale && p > 0 && s > 0 && s < p ? Math.round((1 - s / p) * 100) : 0;
  const today = istDay(new Date().toISOString());
  const saleNote = !sale
    ? "Leave empty when there's no sale."
    : !off
      ? "Must be lower than the price."
      : saleStarts && saleStarts > today
        ? `${off}% off, starts ${saleStarts}${saleEnds ? `, ends ${saleEnds}` : ""}.`
        : saleEnds && saleEnds < today
          ? `${off}% off. This sale has ended.`
          : `${off}% off, on now${saleEnds ? ` until ${saleEnds}` : ""}. Customers pay ${formatINR(Math.round(s * 100))}.`;

  return (
    <form action={action} className="space-y-6">
      {product && <input type="hidden" name="id" value={product.id} />}

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        {/* ───────── Main column ───────── */}
        <div className="min-w-0 space-y-6">
          <FormSection title="Details" description="What customers see on the product page.">
            <Field label="Product name" htmlFor="name">
              <input id="name" name="name" required value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Product code" htmlFor="sku" hint="Your code, e.g. SC 11113. Shown in the admin and used for SKUs.">
                <input id="sku" name="sku" defaultValue={product?.sku ?? productCode(product?.name ?? "") ?? ""} placeholder={productCode(name) ?? "SC 12345"} aria-describedby="sku-hint" />
              </Field>
              <Field label="Fabric" htmlFor="fabric" hint="e.g. Handloom Cotton, Pure Organza">
                <input id="fabric" name="fabric" defaultValue={product?.fabric ?? ""} aria-describedby="fabric-hint" />
              </Field>
            </div>
            <Field label="Description" htmlFor="description">
              <textarea id="description" name="description" rows={6} defaultValue={product?.description ?? ""} />
            </Field>
            <Field label="Wash & care" htmlFor="care_instructions">
              <textarea id="care_instructions" name="care_instructions" rows={3} defaultValue={product?.care_instructions ?? ""} />
            </Field>
            <Field label="Tags" htmlFor="tags" hint="Separate with commas, e.g. Daily Wear, Festive, Handloom. Used in admin search.">
              <input id="tags" name="tags" defaultValue={(product?.tags ?? []).join(", ")} aria-describedby="tags-hint" />
            </Field>
          </FormSection>

          <FormSection title="Pricing" description="Prices in rupees. A sale price can run between two dates.">
            <div className="grid gap-5 md:grid-cols-2">
              <Field label={type === "running_material" ? "Price per metre (₹)" : "Price (₹)"} htmlFor="price">
                <input id="price" name="price" {...money} required value={price} onChange={(e) => setPrice(e.target.value)} />
              </Field>
              <Field label="Sale price (₹, optional)" htmlFor="sale_price" hint={saleNote}>
                <input id="sale_price" name="sale_price" {...money} value={sale} onChange={(e) => setSale(e.target.value)} aria-describedby="sale_price-hint" />
              </Field>
            </div>
            {sale && (
              <div className="grid gap-5 md:grid-cols-2">
                <Field label="Sale starts (optional)" htmlFor="sale_starts" hint="Leave empty to start now.">
                  <input id="sale_starts" name="sale_starts" type="date" value={saleStarts} onChange={(e) => setSaleStarts(e.target.value)} aria-describedby="sale_starts-hint" />
                </Field>
                <Field label="Sale ends (optional)" htmlFor="sale_ends" hint="Leave empty to run until you remove it.">
                  <input id="sale_ends" name="sale_ends" type="date" min={saleStarts || undefined} value={saleEnds} onChange={(e) => setSaleEnds(e.target.value)} aria-describedby="sale_ends-hint" />
                </Field>
              </div>
            )}
          </FormSection>

          <FormSection
            key={type}
            title={type === "custom_made" ? "Sizes & colours" : type === "running_material" ? "Colours & metres" : "Sizes, colours & stock"}
            description={
              type === "custom_made"
                ? "Made to order: no stock to keep. Choose which sizes and colours customers can pick."
                : "Stock for each size and colour. Sold-out combinations can't be bought."
            }
          >
            {type === "custom_made" && (
              <p className="flex gap-2 rounded-[var(--radius-control)] bg-gold-light/40 p-3 text-sm">
                <Info size={16} strokeWidth={1.5} className="mt-0.5 shrink-0 text-gold" aria-hidden />
                Always made to order: dispatched in 45–60 days.
              </p>
            )}
            <VariantEditor
              type={type}
              productCode={code}
              initialSizes={product?.sizes ?? []}
              initialColours={product?.colours ?? []}
              initialVariants={product?.variants ?? []}
              initialStock={product?.stock_qty ?? 0}
              images={product?.images ?? []}
            />
            {type === "unstitched" && (
              <div className="grid gap-5 rounded-[var(--radius-control)] bg-cream/40 p-4 md:grid-cols-[1fr_auto] md:items-start">
                <FormSwitch
                  name="stitching_available"
                  defaultChecked={product?.stitching_available ?? true}
                  label="Offer stitching"
                  hint="On: the product page asks “Do you want this stitched professionally?”. Off: sold as fabric only."
                />
                <Field label="Stitching charge (₹, optional)" htmlFor="stitching_charge" hint="Empty = default from Shop settings.">
                  <input id="stitching_charge" name="stitching_charge" {...money} defaultValue={rupees(product?.stitching_charge)} aria-describedby="stitching_charge-hint" className="md:!w-44" />
                </Field>
              </div>
            )}
            {type === "running_material" && (
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Minimum order (m)" htmlFor="min_metres">
                  <input id="min_metres" name="min_metres" type="number" step="0.1" min={0} defaultValue={product?.min_metres ?? 1} />
                </Field>
                <Field label="Sold in steps of (m)" htmlFor="metre_step">
                  <input id="metre_step" name="metre_step" type="number" step="0.1" min={0} defaultValue={product?.metre_step ?? 0.5} />
                </Field>
              </div>
            )}
          </FormSection>

          <FormSection
            title="Add photos"
            description={product?.images.length ? `${product.images.length} of ${MAX_PHOTOS} photos used. Reorder them in Photos at the top.` : "The first photo becomes the main photo."}
          >
            <ImageUploader maxFiles={MAX_PHOTOS - (product?.images.length ?? 0)} onBusyChange={setUploading} />
          </FormSection>

          <FormSection title="Search engines" description="How this product appears on Google. Optional.">
            <SeoFields
              defaultTitle={product?.meta_title ?? ""}
              defaultDescription={product?.meta_description ?? ""}
              fallbackTitle={name}
              fallbackDescription={product?.description ?? ""}
              slug={product?.slug ?? ""}
            />
            <Field label="Web address (optional)" htmlFor="slug" hint="The end of the product's link. Made from the name if left empty.">
              <input id="slug" name="slug" defaultValue={product?.slug} placeholder="handloom-cotton-salwar-suit" aria-describedby="slug-hint" />
            </Field>
          </FormSection>
        </div>

        {/* ───────── Side column ───────── */}
        <div className="min-w-0 space-y-6 xl:sticky xl:top-24">
          <FormSection title="Status">
            <StatusPicker defaultValue={product?.status ?? (product ? (product.is_active ? "published" : "draft") : "published")} />
          </FormSection>

          <FormSection title="Category">
            <Field label="Category" htmlFor="category_id" hint={TYPE_HELP[type]} hideLabel>
              <Select
                id="category_id"
                name="category_id"
                label="Category"
                value={categoryId}
                onChange={setCategoryId}
                describedBy="category_id-hint"
                options={categories.map((c) => ({ value: c.id, label: c.name }))}
              />
            </Field>
          </FormSection>

          <FormSection title="Shown in" description="Collections on the website.">
            <FormSwitch name="is_new_arrival" defaultChecked={product?.is_new_arrival ?? false} label="New Arrivals" />
            <FormSwitch name="is_hot_deal" defaultChecked={product?.is_hot_deal ?? false} label="Hot Deals" />
            <FormSwitch name="is_premium" defaultChecked={product?.is_premium ?? false} label="Premium" />
          </FormSection>

          {type !== "custom_made" && (
            <FormSection title="Dispatch">
              <FormSwitch name="is_preorder" defaultChecked={product?.is_preorder ?? false} label="Pre-order" hint="Dispatched in 45–60 days instead of 48 hours." />
            </FormSection>
          )}
        </div>
      </div>

      {/* Sticky save bar: always reachable on long forms and on phones */}
      <div className="sticky bottom-0 z-10 -mx-4 flex flex-wrap items-center justify-end gap-3 border-t border-sand bg-ivory/95 px-4 py-3 backdrop-blur md:-mx-8 md:px-8">
        {state?.error && (
          <p role="alert" className="mr-auto text-sm text-sale">
            {state.error}
          </p>
        )}
        <Link href="/admin/products" className="btn-outline btn-sm">Cancel</Link>
        <button type="submit" className="btn-primary btn-sm" disabled={pending || uploading}>
          {pending ? "Saving…" : uploading ? "Waiting for photos…" : product ? "Save changes" : "Add product"}
        </button>
      </div>
    </form>
  );
}
