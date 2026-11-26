import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Category, ProductWithRelations } from "@/types";
import { USE_DASHBOARD_STORE, USE_MOCK } from "./mode";
import { db } from "@/lib/db";
import { mockCategories, mockProducts } from "./mock";

function mockList(f: Filter) {
  let list = mockProducts.filter((p) => p.is_active);
  if (f.categorySlug) list = list.filter((p) => p.category.slug === f.categorySlug);
  if (f.newArrivals) list = list.filter((p) => p.is_new_arrival);
  if (f.hotDeals) list = list.filter((p) => p.is_hot_deal);
  if (f.premium) list = list.filter((p) => p.is_premium);
  if (f.query) {
    const q = f.query.toLowerCase();
    list = list.filter((p) => p.name.toLowerCase().includes(q) || p.category.name.toLowerCase().includes(q));
  }
  list = [...list].sort((a, b) =>
    f.sort === "price_asc" ? a.price - b.price : f.sort === "price_desc" ? b.price - a.price : b.created_at.localeCompare(a.created_at),
  );
  const offset = f.offset ?? 0;
  return { products: list.slice(offset, offset + (f.limit ?? 24)), count: list.length };
}

const PRODUCT_SELECT = "*, category:categories(*), images:product_images(*), variants:product_variants(*)";
// !inner lets us filter products by a column on the joined category
const PRODUCT_SELECT_BY_CATEGORY =
  "*, category:categories!inner(*), images:product_images(*), variants:product_variants(*)";

let warned = false;
/** Logs a database problem once per server process (terminal only, not the dev overlay). */
function warnDb(where: string, message: string) {
  if (warned) return;
  warned = true;
  const offline = /fetch failed|ECONNREFUSED|ENOTFOUND/i.test(message);
  console.warn(
    `[${where}] ${message}` +
      (offline ? " — Supabase is not reachable. Set the keys in .env.local (see README.md). Showing empty product lists." : ""),
  );
}

type Filter = {
  categorySlug?: string;
  /** Products in a dashboard collection (dashboard store only) */
  collectionSlug?: string;
  query?: string;
  newArrivals?: boolean;
  hotDeals?: boolean;
  premium?: boolean;
  sort?: "newest" | "price_asc" | "price_desc";
  limit?: number;
  offset?: number;
};

export async function listProducts(f: Filter = {}): Promise<{ products: ProductWithRelations[]; count: number }> {
  if (USE_DASHBOARD_STORE) return db.shop.products(f);
  if (USE_MOCK) return mockList(f);
  const supabase = await createClient();
  let q = supabase
    .from("products")
    .select(f.categorySlug ? PRODUCT_SELECT_BY_CATEGORY : PRODUCT_SELECT, { count: "exact" })
    .eq("is_active", true);

  if (f.categorySlug) q = q.eq("category.slug", f.categorySlug);
  if (f.query) q = q.ilike("name", `%${f.query.replace(/[%_,()]/g, " ")}%`);
  if (f.newArrivals) q = q.eq("is_new_arrival", true);
  if (f.hotDeals) q = q.eq("is_hot_deal", true);
  if (f.premium) q = q.eq("is_premium", true);

  if (f.sort === "price_asc") q = q.order("price", { ascending: true });
  else if (f.sort === "price_desc") q = q.order("price", { ascending: false });
  else q = q.order("created_at", { ascending: false });

  const limit = f.limit ?? 24;
  const offset = f.offset ?? 0;
  q = q.range(offset, offset + limit - 1);

  const { data, count, error } = await q;
  if (error) {
    // Don't take the whole page down (e.g. database unreachable / not configured yet)
    warnDb("listProducts", error.message);
    return { products: [], count: 0 };
  }
  const products = (data ?? []) as unknown as ProductWithRelations[];
  products.forEach((p) => p.images.sort((a, b) => a.sort_order - b.sort_order));
  return { products, count: count ?? 0 };
}

export async function getProductBySlug(slug: string): Promise<ProductWithRelations | null> {
  if (USE_DASHBOARD_STORE) return db.shop.productBySlug(slug);
  if (USE_MOCK) return mockProducts.find((p) => p.slug === slug) ?? null;
  const supabase = await createClient();
  const { data } = await supabase.from("products").select(PRODUCT_SELECT).eq("slug", slug).maybeSingle();
  if (!data) return null;
  const p = data as unknown as ProductWithRelations;
  p.images.sort((a, b) => a.sort_order - b.sort_order);
  return p;
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  if (USE_DASHBOARD_STORE) return (await db.shop.categories()).find((c) => c.slug === slug) ?? null;
  if (USE_MOCK) return mockCategories.find((c) => c.slug === slug) ?? null;
  const supabase = await createClient();
  const { data } = await supabase.from("categories").select("*").eq("slug", slug).maybeSingle();
  return data;
}

export async function listCategories(): Promise<Category[]> {
  if (USE_DASHBOARD_STORE) return db.shop.categories();
  if (USE_MOCK) return mockCategories;
  const supabase = await createClient();
  const { data } = await supabase.from("categories").select("*").order("sort_order");
  return data ?? [];
}

/** Products by id, for server-side price recomputation at checkout. */
export async function getProductsByIds(ids: string[]): Promise<ProductWithRelations[]> {
  if (USE_DASHBOARD_STORE) return db.shop.productsByIds(ids);
  if (USE_MOCK) return mockProducts.filter((p) => ids.includes(p.id));
  const supabase = await createClient();
  const { data, error } = await supabase.from("products").select(PRODUCT_SELECT).in("id", ids);
  if (error) throw error;
  return (data ?? []) as unknown as ProductWithRelations[];
}

/**
 * Is this item in stock for the requested amount? Variants can be per size, per colour or per size × colour
 * (variant size "" = no size, colour null = no colour).
 */
export function isAvailable(
  p: ProductWithRelations,
  opts: { size?: string; colour?: string; quantity: number; lengthMetres?: number },
) {
  if (!p.is_active) return false;
  if (p.is_preorder || p.product_type === "custom_made") return true; // made to order
  const need = p.product_type === "running_material" ? (opts.lengthMetres ?? 0) * opts.quantity : opts.quantity;
  if (p.variants.length) {
    const bySize = p.variants.some((v) => v.size);
    const byColour = p.variants.some((v) => v.colour);
    if ((bySize && opts.size) || (byColour && opts.colour)) {
      const v = p.variants.find((x) => (!bySize || x.size === opts.size) && (!byColour || (x.colour ?? null) === (opts.colour ?? null)));
      return !!v && v.stock_qty >= need;
    }
  }
  return p.stock_qty >= need;
}
