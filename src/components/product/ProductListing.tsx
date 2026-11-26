import Link from "next/link";
import { Suspense } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { listProducts } from "@/lib/data/products";
import { categories } from "@/config/navigation";
import { ProductGrid } from "./ProductGrid";
import { SortSelect } from "./SortSelect";
import { PageHeader } from "@/components/layout/PageHeader";

const PAGE_SIZE = 24;
type Sort = "newest" | "price_asc" | "price_desc";

/** Shared listing used by category, New Arrivals, Hot Deals and Search pages. */
/** Compact page list: first, last and the pages either side of the current one, with gaps (null) between. */
function pageList(page: number, pages: number): (number | null)[] {
  const keep = new Set([1, pages, page - 1, page, page + 1].filter((n) => n >= 1 && n <= pages));
  const out: (number | null)[] = [];
  let prev = 0;
  for (const n of [...keep].sort((a, b) => a - b)) {
    if (n - prev > 1) out.push(n - prev === 2 ? n - 1 : null);
    out.push(n);
    prev = n;
  }
  return out;
}

export async function ProductListing({
  title,
  description,
  basePath,
  searchParams,
  filter,
  hideHeader = false,
}: {
  title: string;
  description?: string | null;
  basePath: string;
  searchParams: { sort?: string; page?: string; q?: string };
  filter: { categorySlug?: string; collectionSlug?: string; newArrivals?: boolean; hotDeals?: boolean; premium?: boolean; query?: string };
  hideHeader?: boolean;
}) {
  const page = Math.max(1, Number(searchParams.page) || 1);
  const sort = (["newest", "price_asc", "price_desc"].includes(searchParams.sort ?? "") ? searchParams.sort : "newest") as Sort;
  const { products, count } = await listProducts({ ...filter, sort, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE });
  const pages = Math.ceil(count / PAGE_SIZE);

  const pageHref = (p: number) => {
    const sp = new URLSearchParams();
    if (searchParams.q) sp.set("q", searchParams.q);
    if (sort !== "newest") sp.set("sort", sort);
    if (p > 1) sp.set("page", String(p));
    const s = sp.toString();
    return s ? `${basePath}?${s}` : basePath;
  };

  return (
    <>
      {!hideHeader && <PageHeader title={title} subtitle={description} />}

      {/* Category quick links */}
      <nav aria-label="Categories" className="border-b border-sand">
        <ul data-reveal-stagger className="no-scrollbar container-x flex gap-2 overflow-x-auto py-4">
          {[{ slug: "", name: "New Arrivals", href: "/new-arrivals" }, ...categories.map((c) => ({ ...c, href: `/shop/${c.slug}` })), { slug: "", name: "Premium", href: "/premium" }, { slug: "", name: "Hot Deals", href: "/hot-deals" }].map(
            (c) => (
              <li key={c.href} className="shrink-0">
                <Link
                  href={c.href}
                  className={`chip !px-4 !py-2 text-[12px] whitespace-nowrap ${basePath === c.href ? "chip-active" : ""}`}
                >
                  {c.name.replace(" – Custom Made", "")}
                </Link>
              </li>
            ),
          )}
        </ul>
      </nav>

      <section className="container-x py-10">
        <div data-reveal className="mb-8 flex items-center justify-between gap-4">
          <p className="text-sm text-muted">
            {count} {count === 1 ? "product" : "products"}
          </p>
          <Suspense>
            <SortSelect />
          </Suspense>
        </div>

        <ProductGrid products={products} />

        {pages > 1 && (
          <nav aria-label="Pagination" className="mt-16 flex flex-wrap items-center justify-center gap-2">
            {page > 1 && (
              <Link href={pageHref(page - 1)} className="chip" aria-label="Previous page">
                <ChevronLeft size={16} />
              </Link>
            )}
            {pageList(page, pages).map((n, k) =>
              n === null ? (
                <span key={`gap-${k}`} className="px-1 text-sm text-muted" aria-hidden>
                  …
                </span>
              ) : (
                <Link key={n} href={pageHref(n)} className={`chip ${n === page ? "chip-active" : ""}`} aria-current={n === page ? "page" : undefined}>
                  {n}
                </Link>
              ),
            )}
            {page < pages && (
              <Link href={pageHref(page + 1)} className="chip" aria-label="Next page">
                <ChevronRight size={16} />
              </Link>
            )}
          </nav>
        )}
      </section>
    </>
  );
}
