import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { listCategories } from "@/lib/data/products";
import { ProductForm } from "../ProductForm";
import { archiveProduct, deleteImage } from "../actions";
import type { ProductWithRelations } from "@/types";

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const { id } = await params;
  const { saved } = await searchParams;
  const supabase = await createClient();
  const [{ data }, categories] = await Promise.all([
    supabase
      .from("products")
      .select("*, category:categories(*), images:product_images(*), variants:product_variants(*)")
      .eq("id", id)
      .maybeSingle(),
    listCategories(),
  ]);
  if (!data) notFound();
  const product = data as unknown as ProductWithRelations;
  product.images.sort((a, b) => a.sort_order - b.sort_order);

  return (
    <section>
      <h1>Edit: {product.name}</h1>
      {saved && <p role="status">Saved.</p>}
      <Link href={`/product/${product.slug}`} target="_blank">View on site</Link>

      <h2>Images</h2>
      <ul>
        {product.images.map((img) => (
          <li key={img.id}>
            <img src={img.url} alt={img.alt ?? ""} width={120} />
            <form action={deleteImage}>
              <input type="hidden" name="id" value={img.id} />
              <button type="submit">Remove</button>
            </form>
          </li>
        ))}
      </ul>

      <ProductForm categories={categories} product={product} />

      <form action={archiveProduct}>
        <input type="hidden" name="id" value={product.id} />
        <button type="submit">Hide product from store</button>
      </form>
    </section>
  );
}
