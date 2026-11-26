import "server-only";
import { headerNav, isGroup, type HeaderNavItem, type NavChild } from "@/config/navigation";
import { categoryPhoto } from "@/lib/data/mock";
import { USE_DASHBOARD_STORE } from "@/lib/data/mode";
import { listCategories } from "@/lib/data/products";
import { db } from "@/lib/db";

/**
 * The header menu, following the dashboard: hidden categories are left out, categories added in the
 * dashboard join the "Collections" dropdown, a category's own cover photo replaces the built-in one,
 * and active dashboard collections are listed too. Without the dashboard store it's the built-in menu.
 */
export async function getShopNav(): Promise<{ nav: HeaderNavItem[]; images: Record<string, string | undefined> }> {
  const images: Record<string, string | undefined> = {};
  if (!USE_DASHBOARD_STORE) {
    for (const c of headerNav.filter(isGroup).flatMap((g) => g.children)) images[c.slug] = categoryPhoto(c.slug, 400);
    return { nav: headerNav, images };
  }

  const [cats, collections] = await Promise.all([listCategories(), db.shop.collections()]);
  const bySlug = new Map(cats.map((c) => [c.slug, c]));
  const used = new Set<string>();
  const photo = (slug: string) => bySlug.get(slug)?.image_url || categoryPhoto(slug, 400);

  const nav: HeaderNavItem[] = headerNav
    .map((item): HeaderNavItem | null => {
      if (isGroup(item)) {
        const children = item.children.filter((c) => bySlug.has(c.slug));
        children.forEach((c) => used.add(c.slug));
        return children.length ? { ...item, children } : null;
      }
      const slug = item.href.startsWith("/shop/") ? item.href.slice(6) : null;
      if (slug) {
        if (!bySlug.has(slug)) return null;
        used.add(slug);
      }
      return item;
    })
    .filter((i): i is HeaderNavItem => i !== null);

  // New categories and collections go in the first dropdown ("Collections")
  const extra: NavChild[] = [
    ...cats.filter((c) => !used.has(c.slug)).map((c) => ({ label: c.name, href: `/shop/${c.slug}`, slug: c.slug })),
    ...collections.map((c) => ({ label: c.name, href: `/collections/${c.slug}`, slug: `collection:${c.slug}` })),
  ];
  const first = nav.find(isGroup);
  if (first && extra.length) first.children = [...first.children, ...extra];

  for (const c of cats) images[c.slug] = photo(c.slug);
  for (const c of collections) images[`collection:${c.slug}`] = c.image_url ?? undefined;
  return { nav, images };
}
