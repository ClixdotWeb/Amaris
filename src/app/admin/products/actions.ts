"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { rupeesToPaise, slugify } from "@/lib/format";

const optNum = z.preprocess((v) => (v === "" || v == null ? null : Number(v)), z.number().nonnegative().nullable());
const bool = z.preprocess((v) => v === "on" || v === "true", z.boolean());

const productSchema = z.object({
  id: z.string().uuid().optional().or(z.literal("")),
  name: z.string().min(2),
  slug: z.string().optional(),
  description: z.string().optional(),
  category_id: z.string().uuid(),
  price: z.coerce.number().nonnegative(), // ₹
  compare_at_price: optNum, // ₹
  sizes: z.string().optional(), // "S, M, L"
  stock_qty: z.coerce.number().nonnegative().default(0),
  is_preorder: bool,
  is_new_arrival: bool,
  is_hot_deal: bool,
  is_premium: bool,
  is_active: bool,
  stitching_available: bool,
  stitching_charge: optNum, // ₹
  min_metres: optNum,
  metre_step: optNum,
  fabric: z.string().optional(),
  care_instructions: z.string().optional(),
});

export type ProductFormState = { error?: string } | undefined;

export async function saveProduct(_: ProductFormState, form: FormData): Promise<ProductFormState> {
  await requireAdmin();
  const parsed = productSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: `${parsed.error.issues[0].path.join(".")}: ${parsed.error.issues[0].message}` };
  const v = parsed.data;
  const supabase = await createClient();

  // product_type always follows the category
  const { data: category } = await supabase.from("categories").select("product_type").eq("id", v.category_id).single();
  if (!category) return { error: "Unknown category" };

  const sizes = (v.sizes ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const row = {
    name: v.name,
    slug: slugify(v.slug || v.name),
    description: v.description || null,
    category_id: v.category_id,
    product_type: category.product_type,
    price: rupeesToPaise(v.price),
    compare_at_price: v.compare_at_price != null ? rupeesToPaise(v.compare_at_price) : null,
    sizes,
    // For sized ready-made items, total stock = sum of per-size stock (keeps dashboard low-stock accurate)
    stock_qty:
      category.product_type === "ready_made" && sizes.length
        ? sizes.reduce((s, size) => s + (Number(form.get(`variant_stock[${size}]`) ?? 0) || 0), 0)
        : v.stock_qty,
    is_preorder: v.is_preorder,
    is_new_arrival: v.is_new_arrival,
    is_hot_deal: v.is_hot_deal,
    is_premium: v.is_premium,
    is_active: v.is_active,
    stitching_available: category.product_type === "unstitched" && v.stitching_available,
    stitching_charge: v.stitching_charge != null ? rupeesToPaise(v.stitching_charge) : null,
    min_metres: v.min_metres,
    metre_step: v.metre_step,
    fabric: v.fabric || null,
    care_instructions: v.care_instructions || null,
  };

  const { data: saved, error } = v.id
    ? await supabase.from("products").update(row).eq("id", v.id).select("id").single()
    : await supabase.from("products").insert(row).select("id").single();
  if (error || !saved) return { error: error?.code === "23505" ? "That slug is already used." : "Could not save product." };

  // Per-size stock (ready made with sizes). Form fields: variant_stock[S], variant_stock[M], ...
  if (category.product_type === "ready_made") {
    await supabase.from("product_variants").delete().eq("product_id", saved.id);
    const variants = sizes.map((size) => ({
      product_id: saved.id,
      size,
      stock_qty: Number(form.get(`variant_stock[${size}]`) ?? 0) || 0,
    }));
    if (variants.length) await supabase.from("product_variants").insert(variants);
  }

  // New images
  const files = form.getAll("images").filter((f): f is File => f instanceof File && f.size > 0);
  const { count } = await supabase.from("product_images").select("id", { count: "exact", head: true }).eq("product_id", saved.id);
  let order = count ?? 0;
  for (const file of files) {
    const path = `${saved.id}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
    const { error: upErr } = await supabase.storage.from("product-images").upload(path, file, { contentType: file.type });
    if (upErr) return { error: `Image upload failed: ${upErr.message}` };
    const { data: pub } = supabase.storage.from("product-images").getPublicUrl(path);
    await supabase.from("product_images").insert({
      product_id: saved.id,
      storage_path: path,
      url: pub.publicUrl,
      alt: v.name,
      sort_order: order++,
    });
  }

  revalidatePath("/", "layout");
  redirect(`/admin/products/${saved.id}?saved=1`);
}

export async function deleteImage(form: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const id = String(form.get("id"));
  const { data: img } = await supabase.from("product_images").select("storage_path, product_id").eq("id", id).single();
  if (img) {
    await supabase.storage.from("product-images").remove([img.storage_path]);
    await supabase.from("product_images").delete().eq("id", id);
    revalidatePath(`/admin/products/${img.product_id}`);
  }
}

/** Hides instead of deleting, so old orders keep their product link. */
export async function archiveProduct(form: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  await supabase.from("products").update({ is_active: false }).eq("id", String(form.get("id")));
  revalidatePath("/", "layout");
  redirect("/admin/products");
}
