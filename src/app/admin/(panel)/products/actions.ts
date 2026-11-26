"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/guard";
import { db } from "@/lib/db";
import { destroyImage, uploadedImageSchema, verifyUpload } from "@/lib/admin/cloudinary";
import { cloudinaryUrl, PHOTO_CARD, PHOTO_FULL } from "@/lib/images";
import { formatINR, rupeesToPaise, slugify } from "@/lib/format";
import { istDayEnd, istDayStart } from "@/lib/admin/dates";
import { diffFields, logActivity } from "@/lib/admin/activity";
import type { BulkProductAction, NewImage, ProductInput, VariantInput } from "@/lib/db";
import type { ProductStatus } from "@/types";
import type { ActionResult } from "@/components/admin/ConfirmButton";

const optNum = z.preprocess((v) => (v === "" || v == null ? null : Number(v)), z.number().nonnegative().max(10_000_000).nullable());
const bool = z.preprocess((v) => v === "on" || v === "true", z.boolean());
// Browsers send line breaks in <textarea> as \r\n; store \n so unchanged text doesn't count as a change.
const text = (max: number) => z.string().transform((s) => s.replace(/\r\n?/g, "\n").trim()).pipe(z.string().max(max)).optional();
const date = z.preprocess((v) => (v === "" || v == null ? null : v), z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable());
const STATUSES = ["draft", "published", "archived"] as const;
const CODE = /^[A-Za-z0-9][A-Za-z0-9 _/-]{0,59}$/;

const productSchema = z.object({
  id: z.string().uuid().optional().or(z.literal("")),
  name: z.string().trim().min(2, "Enter a product name.").max(200),
  slug: text(200),
  sku: z.string().trim().max(60).refine((s) => s === "" || CODE.test(s), "Use letters, numbers, spaces and - _ / only.").optional(),
  description: text(10_000),
  category_id: z.string().uuid(),
  status: z.enum(STATUSES),
  price: z.coerce.number({ message: "Enter a price." }).positive("Enter a price.").max(10_000_000), // ₹
  sale_price: optNum, // ₹
  sale_starts: date,
  sale_ends: date,
  sizes: text(500), // "S, M, L"
  stock_qty: z.coerce.number().nonnegative().max(1_000_000).default(0),
  tags: text(500),
  meta_title: text(70),
  meta_description: text(170),
  is_preorder: bool,
  is_new_arrival: bool,
  is_hot_deal: bool,
  is_premium: bool,
  stitching_available: bool,
  stitching_charge: optNum, // ₹
  min_metres: optNum,
  metre_step: optNum,
  fabric: text(200),
  care_instructions: text(2000),
});

const colourSchema = z.object({
  name: z.string().trim().min(1).max(40),
  hex: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  hex2: z.string().regex(/^#[0-9a-fA-F]{6}$/).nullable().optional(),
  image_index: z.number().int().min(0).max(14).nullable(),
});
const variantSchema = z.object({
  size: z.string().trim().max(20),
  colour: z.string().trim().max(40).nullable(),
  stock_qty: z.number().nonnegative().max(1_000_000),
  sku: z.string().trim().max(60).nullable(),
  price: z.number().positive().max(10_000_000).nullable(), // ₹
});

export type ProductFormState = { error?: string } | undefined;

/** Comparable view of a product for the activity log (same shape from the form input and from the saved product). */
function snapshot(p: {
  name: string; slug: string; sku?: string | null; category_id: string; status?: ProductStatus; price: number;
  sale_price?: number | null; sale_starts_at?: string | null; sale_ends_at?: string | null; sizes: string[];
  colours?: { name: string }[]; stock_qty: number; variants: { size: string; colour?: string | null; stock_qty: number; sku?: string | null; price?: number | null }[];
  tags?: string[]; meta_title?: string | null; meta_description?: string | null; is_new_arrival: boolean; is_hot_deal: boolean;
  is_premium: boolean; is_preorder: boolean; stitching_available: boolean; stitching_charge: number | null;
  min_metres: number | null; metre_step: number | null; fabric: string | null; description: string | null; care_instructions: string | null;
}) {
  return {
    name: p.name, slug: p.slug, code: p.sku ?? null, category_id: p.category_id, status: p.status ?? null, price: p.price,
    sale_price: p.sale_price ?? null, sale_starts: p.sale_starts_at?.slice(0, 10) ?? null, sale_ends: p.sale_ends_at?.slice(0, 10) ?? null,
    sizes: p.sizes.join(", "), colours: (p.colours ?? []).map((c) => c.name).join(", "),
    stock: p.variants.length
      ? p.variants.map((v) => `${[v.size, v.colour].filter(Boolean).join(" / ")}: ${v.stock_qty}${v.sku ? ` (${v.sku})` : ""}${v.price != null ? ` ${formatINR(v.price)}` : ""}`).join(", ")
      : String(p.stock_qty),
    tags: (p.tags ?? []).join(", "), meta_title: p.meta_title ?? null, meta_description: p.meta_description ?? null,
    new_arrival: p.is_new_arrival, hot_deal: p.is_hot_deal, premium: p.is_premium, pre_order: p.is_preorder,
    stitching_available: p.stitching_available, stitching_charge: p.stitching_charge, min_metres: p.min_metres, metre_step: p.metre_step,
    fabric: p.fabric, description: p.description, care_instructions: p.care_instructions,
  };
}

function parseJson<T>(raw: FormDataEntryValue | null, schema: z.ZodType<T>, fallback: T): T | null {
  try {
    return schema.parse(raw ? JSON.parse(String(raw)) : fallback);
  } catch {
    return null;
  }
}

export async function saveProduct(_: ProductFormState, form: FormData): Promise<ProductFormState> {
  const me = await requireAdmin();
  const fields = Object.fromEntries([...form.entries()].filter(([k, v]) => typeof v === "string" && !k.endsWith("_json") && k !== "uploaded_images"));
  const parsed = productSchema.safeParse(fields);
  if (!parsed.success) {
    const i = parsed.error.issues[0];
    return { error: `${String(i.path[0]).replace(/_/g, " ")}: ${i.message}` };
  }
  const v = parsed.data;
  const category = (await db.categories.list()).find((c) => c.id === v.category_id);
  if (!category) return { error: "Choose a category." };

  const sizes = [...new Set((v.sizes ?? "").split(",").map((s) => s.trim()).filter(Boolean))].slice(0, 30);
  const colours = parseJson(form.get("colours_json"), z.array(colourSchema).max(30), []);
  const variantsRaw = parseJson(form.get("variants_json"), z.array(variantSchema).max(300), []);
  if (!colours || !variantsRaw) return { error: "The sizes and colours could not be read. Reload the page and try again." };
  if (new Set(colours.map((c) => c.name.toLowerCase())).size !== colours.length) return { error: "Two colours have the same name." };

  // Variants must match the sizes and colours above, once each
  const colourNames = colours.map((c) => c.name);
  const seen = new Set<string>();
  for (const x of variantsRaw) {
    if (sizes.length ? !sizes.includes(x.size) : x.size !== "") return { error: `Stock line “${x.size}” doesn't match the sizes.` };
    if (x.colour !== null && !colourNames.includes(x.colour)) return { error: `Stock line colour “${x.colour}” isn't in the colour list.` };
    const key = `${x.size}|${x.colour ?? ""}`;
    if (seen.has(key)) return { error: "The same size and colour appears twice in the stock table." };
    seen.add(key);
    if (x.sku && !CODE.test(x.sku)) return { error: `SKU “${x.sku}”: use letters, numbers, spaces and - _ / only.` };
  }
  const tracksStock = category.product_type !== "custom_made";
  const variants: VariantInput[] = tracksStock
    ? variantsRaw.map((x) => ({
        size: x.size,
        colour: x.colour,
        stock_qty: category.product_type === "running_material" ? Math.round(x.stock_qty * 10) / 10 : Math.floor(x.stock_qty),
        sku: x.sku || null,
        price: x.price != null ? rupeesToPaise(x.price) : null,
      }))
    : [];

  const price = rupeesToPaise(v.price);
  const salePrice = v.sale_price != null ? rupeesToPaise(v.sale_price) : null;
  if (salePrice != null && salePrice >= price) return { error: "The sale price must be lower than the regular price." };
  if (salePrice == null && (v.sale_starts || v.sale_ends)) return { error: "Add a sale price, or clear the sale dates." };
  if (v.sale_starts && v.sale_ends && v.sale_ends < v.sale_starts) return { error: "The sale can't end before it starts." };

  // Photos the browser uploaded to Cloudinary: accept only genuine uploads in our folder
  let uploads: z.infer<typeof uploadedImageSchema>[] = [];
  try {
    uploads = z.array(uploadedImageSchema).max(15).parse(JSON.parse(String(form.get("uploaded_images") || "[]")));
  } catch {
    return { error: "The photo list was not valid. Upload the photos again." };
  }
  const bad = uploads.filter((u) => !verifyUpload(u));
  if (bad.length) {
    await Promise.all(bad.map((u) => destroyImage(u.public_id)));
    return { error: "A photo could not be verified (wrong type, too big, or not from this site). Upload it again." };
  }
  const newImages: NewImage[] = uploads.map((u) => ({
    public_id: u.public_id,
    url: cloudinaryUrl(u.public_id, PHOTO_FULL),
    thumb_url: cloudinaryUrl(u.public_id, PHOTO_CARD),
    alt: v.name,
  }));

  const before = v.id ? await db.products.get(v.id) : null;
  const input: ProductInput = {
    id: v.id || undefined,
    name: v.name,
    slug: slugify(v.slug || v.name),
    sku: v.sku?.trim() || null,
    description: v.description || null,
    category_id: v.category_id,
    status: v.status,
    price,
    sale_price: salePrice,
    sale_starts_at: salePrice != null && v.sale_starts ? istDayStart(v.sale_starts) : null,
    sale_ends_at: salePrice != null && v.sale_ends ? istDayEnd(v.sale_ends) : null,
    sizes,
    colours: colours.map((c) => ({ name: c.name, hex: c.hex, hex2: c.hex2 ?? null, image_index: c.image_index })),
    stock_qty: v.stock_qty,
    variants,
    tags: [...new Set((v.tags ?? "").split(",").map((t) => t.trim()).filter(Boolean))].slice(0, 20),
    meta_title: v.meta_title || null,
    meta_description: v.meta_description || null,
    is_preorder: v.is_preorder,
    is_new_arrival: v.is_new_arrival,
    is_hot_deal: v.is_hot_deal,
    is_premium: v.is_premium,
    stitching_available: v.stitching_available,
    stitching_charge: v.stitching_charge != null ? rupeesToPaise(v.stitching_charge) : null,
    min_metres: v.min_metres,
    metre_step: v.metre_step,
    fabric: v.fabric || null,
    care_instructions: v.care_instructions || null,
  };
  const result = await db.products.save(input, newImages);
  if (!result.ok) return { error: result.error };

  const after = snapshot(input);
  const diff = before ? diffFields(snapshot(before), after, Object.keys(after) as (keyof typeof after)[]) : {};
  if (newImages.length) diff.photos_added = [null, newImages.length];
  await logActivity(me, {
    action: before ? "product.update" : "product.create",
    entity_type: "product",
    entity_id: result.id,
    summary: before ? `Edited ${input.name}` : `Added ${input.name}`,
    diff: before ? diff : null,
  });

  revalidatePath("/admin/products");
  redirect(before ? `/admin/products/${result.id}?flash=saved` : `/admin/products?flash=created&added=${result.id}`);
}

export async function deleteImage(_: ActionResult, form: FormData): Promise<ActionResult> {
  const me = await requireAdmin();
  const id = z.string().uuid().safeParse(form.get("id"));
  if (!id.success) return { error: "Photo not found." };
  const img = await db.products.deleteImage(id.data);
  if (!img) return { error: "Photo not found." };
  // Only admin uploads are ever deleted from Cloudinary, and only when no other product (e.g. a copy) still uses the file
  if (img.public_id && !(await db.products.publicIdInUse(img.public_id))) await destroyImage(img.public_id);
  const product = await db.products.get(img.product_id);
  await logActivity(me, { action: "product.photo_remove", entity_type: "product", entity_id: img.product_id, summary: `Removed a photo from ${product?.name ?? "a product"}` });
  revalidatePath(`/admin/products/${img.product_id}`);
  return { ok: "Photo removed." };
}

/** New photo order from the photo strip (first = main photo). */
export async function reorderImages(productId: string, imageIds: string[]): Promise<NonNullable<ActionResult>> {
  const me = await requireAdmin();
  const parsed = z.object({ productId: z.string().uuid(), imageIds: z.array(z.string().uuid()).min(1).max(15) }).safeParse({ productId, imageIds });
  if (!parsed.success) return { error: "Photo order not valid." };
  const before = await db.products.get(productId);
  if (!before) return { error: "Product not found." };
  if (!(await db.products.reorderImages(productId, imageIds))) return { error: "The photos changed meanwhile. Reload and try again." };
  const mainChanged = before.images[0]?.id !== imageIds[0];
  await logActivity(me, {
    action: "product.photo_order",
    entity_type: "product",
    entity_id: productId,
    summary: mainChanged ? `Changed the main photo of ${before.name}` : `Reordered photos of ${before.name}`,
  });
  revalidatePath(`/admin/products/${productId}`);
  revalidatePath("/admin/products");
  return { ok: mainChanged ? "Main photo changed." : "Photo order saved." };
}

const STATUS_WORD: Record<ProductStatus, string> = { published: "live", draft: "hidden", archived: "archived" };

/** Live switch in the products list: published ⇄ hidden (draft). */
export async function setLive(productId: string, active: boolean): Promise<NonNullable<ActionResult>> {
  const me = await requireAdmin();
  const id = z.string().uuid().safeParse(productId);
  if (!id.success || typeof active !== "boolean") return { error: "Product not found." };
  const product = await db.products.get(id.data);
  if (!product) return { error: "Product not found." };
  const status: ProductStatus = active ? "published" : "draft";
  await db.products.setStatus(id.data, status);
  await logActivity(me, {
    action: "product.status",
    entity_type: "product",
    entity_id: id.data,
    summary: `${product.name} is now ${STATUS_WORD[status]}`,
    diff: { status: [product.status ?? null, status] },
  });
  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${id.data}`);
  return { ok: active ? "Product is live on the store." : "Product hidden from the store." };
}

/** Turn the stitching add-on on or off for one unstitched product (products list switch). */
export async function setStitching(productId: string, available: boolean): Promise<NonNullable<ActionResult>> {
  const me = await requireAdmin();
  const id = z.string().uuid().safeParse(productId);
  if (!id.success || typeof available !== "boolean") return { error: "Product not found." };
  const product = await db.products.get(id.data);
  if (!product) return { error: "Product not found." };
  if (product.product_type !== "unstitched") return { error: "Only unstitched products can offer stitching." };
  if (!(await db.products.setStitching(id.data, available))) return { error: "Could not save. Try again." };
  await logActivity(me, {
    action: available ? "product.stitching_on" : "product.stitching_off",
    entity_type: "product",
    entity_id: id.data,
    summary: `Stitching ${available ? "turned on" : "turned off"} for ${product.name}`,
    diff: { stitching_available: [product.stitching_available, available] },
  });
  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${id.data}`);
  return { ok: true };
}

/** Copy a product as a hidden draft and open it. */
export async function duplicateProduct(_: ActionResult, form: FormData): Promise<ActionResult> {
  const me = await requireAdmin();
  const id = z.string().uuid().safeParse(form.get("id"));
  if (!id.success) return { error: "Product not found." };
  const src = await db.products.get(id.data);
  const result = await db.products.duplicate(id.data);
  if (!result.ok || !src) return { error: result.ok ? "Product not found." : result.error };
  await logActivity(me, { action: "product.duplicate", entity_type: "product", entity_id: result.id, summary: `Copied ${src.name} (new copy is hidden)` });
  revalidatePath("/admin/products");
  redirect(`/admin/products/${result.id}?flash=copied`);
}

/** Soft delete: hidden everywhere, can be restored from the Deleted view. */
export async function deleteProduct(_: ActionResult, form: FormData): Promise<ActionResult> {
  const me = await requireAdmin();
  const id = z.string().uuid().safeParse(form.get("id"));
  if (!id.success) return { error: "Product not found." };
  const product = await db.products.get(id.data);
  if (!product) return { error: "Product not found." };
  await db.products.softDelete(id.data);
  await logActivity(me, { action: "product.delete", entity_type: "product", entity_id: id.data, summary: `Deleted ${product.name} (can be restored)` });
  revalidatePath("/admin/products");
  redirect("/admin/products?flash=deleted");
}

/** Bulk bar on the products list. */
export async function bulkProducts(ids: string[], action: BulkProductAction): Promise<NonNullable<ActionResult>> {
  const me = await requireAdmin();
  const parsed = z
    .object({
      ids: z.array(z.string().uuid()).min(1, "Select products first.").max(500),
      action: z.discriminatedUnion("kind", [
        z.object({ kind: z.literal("status"), status: z.enum(STATUSES) }),
        z.object({ kind: z.literal("flag"), flag: z.enum(["is_new_arrival", "is_hot_deal", "is_premium"]), on: z.boolean() }),
        z.object({ kind: z.literal("stitching"), on: z.boolean() }),
        z.object({ kind: z.literal("price"), mode: z.enum(["set", "percent"]), value: z.number() }),
        z.object({ kind: z.literal("delete") }),
        z.object({ kind: z.literal("restore") }),
      ]),
    })
    .safeParse({ ids, action });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Not a valid change." };
  let a = parsed.data.action;
  if (a.kind === "price") {
    if (a.mode === "set" && !(a.value > 0 && a.value <= 10_000_000)) return { error: "Enter a price above ₹0." };
    if (a.mode === "percent" && !(a.value >= -90 && a.value <= 500 && a.value !== 0)) return { error: "Enter a change between −90% and +500%." };
    if (a.mode === "set") a = { ...a, value: rupeesToPaise(a.value) };
  }

  const { changed, skipped } = await db.products.bulk(parsed.data.ids, a);
  const what =
    a.kind === "status" ? `set to ${STATUS_WORD[a.status]}`
    : a.kind === "flag" ? `${a.on ? "added to" : "removed from"} ${{ is_new_arrival: "New Arrivals", is_hot_deal: "Hot Deals", is_premium: "Premium" }[a.flag]}`
    : a.kind === "stitching" ? `stitching turned ${a.on ? "on" : "off"}`
    : a.kind === "price" ? (a.mode === "set" ? `price set to ${formatINR(a.value)}` : `price changed by ${a.value > 0 ? "+" : ""}${a.value}%`)
    : a.kind === "delete" ? "deleted"
    : "restored";
  if (changed)
    await logActivity(me, {
      action: `product.bulk_${a.kind}`,
      entity_type: "product",
      summary: `${changed} product${changed === 1 ? "" : "s"} ${what}`,
      diff: { products: [null, parsed.data.ids.slice(0, 50).join(", ")] },
    });
  revalidatePath("/admin/products");
  const note = skipped.length ? ` ${skipped.length} skipped (${[...new Set(skipped.map((s) => s.reason))].join(", ")}).` : "";
  return changed ? { ok: `${changed} product${changed === 1 ? "" : "s"} ${what}.${note}` } : { error: `Nothing changed.${note}` };
}
