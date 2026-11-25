import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatINR } from "@/lib/format";

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const { q, category } = await searchParams;
  const supabase = await createClient();
  let query = supabase
    .from("products")
    .select("id, name, slug, price, stock_qty, is_active, is_new_arrival, is_hot_deal, is_premium, is_preorder, category:categories!inner(slug, name)")
    .order("created_at", { ascending: false })
    .limit(200);
  if (q) query = query.ilike("name", `%${q}%`);
  if (category) query = query.eq("category.slug", category);
  const [{ data: products }, { data: categories }] = await Promise.all([
    query,
    supabase.from("categories").select("slug, name").order("sort_order"),
  ]);

  return (
    <section>
      <h1>Products</h1>
      <Link href="/admin/products/new">Add product</Link>

      <form>
        <input type="search" name="q" defaultValue={q} placeholder="Search by name" />
        <select name="category" defaultValue={category ?? ""}>
          <option value="">All categories</option>
          {categories?.map((c) => (
            <option key={c.slug} value={c.slug}>{c.name}</option>
          ))}
        </select>
        <button type="submit">Filter</button>
      </form>

      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Category</th>
            <th>Price</th>
            <th>Stock</th>
            <th>Flags</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {(products ?? []).map((p) => {
            const cat = p.category as unknown as { name: string };
            return (
              <tr key={p.id}>
                <td><Link href={`/admin/products/${p.id}`}>{p.name}</Link></td>
                <td>{cat.name}</td>
                <td>{formatINR(p.price)}</td>
                <td>{p.stock_qty}</td>
                <td>
                  {[p.is_new_arrival && "New", p.is_hot_deal && "Deal", p.is_premium && "Premium", p.is_preorder && "Pre-order"].filter(Boolean).join(", ")}
                </td>
                <td>{p.is_active ? "Live" : "Hidden"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}
