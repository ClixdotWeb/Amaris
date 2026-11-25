import type { MetadataRoute } from "next";
import { site } from "@/config/site";
import { categories } from "@/config/navigation";
import { createAdminClient } from "@/lib/supabase/server";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPaths = [
    "", "/new-arrivals", "/premium", "/hot-deals", "/contact", "/track-order",
    "/policies/return-refund", "/policies/shipping", "/policies/privacy", "/policies/terms",
    ...categories.map((c) => `/shop/${c.slug}`),
  ];

  let products: { slug: string; updated_at: string }[] = [];
  try {
    const { data } = await createAdminClient().from("products").select("slug, updated_at").eq("is_active", true);
    products = data ?? [];
  } catch {
    // Supabase not configured yet
  }

  return [
    ...staticPaths.map((p) => ({ url: `${site.url}${p}` })),
    ...products.map((p) => ({ url: `${site.url}/product/${p.slug}`, lastModified: p.updated_at })),
  ];
}
