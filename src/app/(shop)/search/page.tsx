import { Search } from "lucide-react";
import { ProductListing } from "@/components/product/ProductListing";
import { PageHeader } from "@/components/layout/PageHeader";

export const metadata = { title: "Search" };

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string; sort?: string; page?: string }> }) {
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  return (
    <>
      <PageHeader title={q ? `Results for “${q}”` : "Search"} crumb="Search">
        <form action="/search" role="search" className="mx-auto flex max-w-xl overflow-hidden rounded-[3px] border border-[#ecc7ae]/40 bg-[#f8f1ea]/95">
          <label className="sr-only" htmlFor="q">Search products</label>
          <input
            id="q"
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Saree, cotton suit, kids frock…"
            autoFocus={!q}
            className="!rounded-none !border-0 !bg-transparent !shadow-none"
          />
          <button type="submit" className="flex items-center px-5 text-maroon-dark transition-colors hover:text-maroon" aria-label="Search">
            <Search size={18} />
          </button>
        </form>
      </PageHeader>
      {q && <ProductListing hideHeader title="Search" basePath="/search" searchParams={sp} filter={{ query: q }} />}
    </>
  );
}
