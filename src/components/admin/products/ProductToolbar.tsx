"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LayoutGrid, List, Search, SlidersHorizontal, X } from "lucide-react";
import { Select } from "@/components/admin/Select";

type Option = { value: string; label: string };

/** One height and padding for every toolbar control, so they line up exactly. */
const CONTROL = "!h-10 !py-0 !pl-3.5 text-sm leading-none !border-sand-strong/60";

const SHOW: Option[] = [
  { value: "", label: "All products" },
  { value: "published", label: "Live" },
  { value: "draft", label: "Hidden" },
  { value: "archived", label: "Archived" },
  { value: "deleted", label: "Deleted" },
];
const SORT: Option[] = [
  { value: "", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "name", label: "Name A–Z" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "stock_asc", label: "Stock: lowest first" },
  { value: "stock_desc", label: "Stock: highest first" },
];
const MORE: { key: string; label: string; options: Option[] }[] = [
  { key: "stock", label: "Stock", options: [{ value: "", label: "Any stock" }, { value: "low", label: "Low stock" }, { value: "out", label: "Sold out" }] },
  { key: "flag", label: "Shown in", options: [{ value: "", label: "Anywhere" }, { value: "new", label: "New Arrivals" }, { value: "deal", label: "Hot Deals" }, { value: "premium", label: "Premium" }] },
  { key: "stitching", label: "Stitching", options: [{ value: "", label: "Any" }, { value: "on", label: "Stitching on" }, { value: "off", label: "Fabric only" }] },
];

/**
 * Products toolbar: search (Enter or pause typing), category, show, sort, extra filters and list/grid view.
 * Everything lives in the URL, so a filtered list can be bookmarked or shared.
 */
export function ProductToolbar({ categories }: { categories: Option[] }) {
  const params = useSearchParams();
  const router = useRouter();
  const path = usePathname();
  const [pending, start] = useTransition();
  const [q, setQ] = useState(params.get("q") ?? "");
  const moreActive = MORE.filter((m) => params.get(m.key)).length;
  const [open, setOpen] = useState(moreActive > 0);
  const first = useRef(true);

  const apply = (changes: Record<string, string>) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(changes)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    next.delete("page");
    start(() => router.replace(next.size ? `${path}?${next}` : path, { scroll: false }));
  };

  // Search after a short pause in typing
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const t = setTimeout(() => {
      if ((params.get("q") ?? "") !== q.trim()) apply({ q: q.trim() });
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run when the typed text changes
  }, [q]);

  const view = params.get("view") === "grid" ? "grid" : "list";
  const anyFilter = ["q", "category", "status", ...MORE.map((m) => m.key)].some((k) => params.get(k));
  const select = (key: string, label: string, options: Option[]) => (
    <Select label={label} options={options} value={params.get(key) ?? ""} onChange={(v) => apply({ [key]: v })} className="min-w-0" />
  );

  return (
    <div aria-busy={pending}>
      <div className="flex flex-wrap items-center gap-3 xl:flex-nowrap">
        <div className="flex h-10 shrink-0 items-center gap-0.5 rounded-[var(--radius-control)] border border-sand-strong/60 bg-white p-1" role="group" aria-label="View">
          {(["list", "grid"] as const).map((v) => {
            const Icon = v === "list" ? List : LayoutGrid;
            return (
              <button
                key={v}
                type="button"
                aria-pressed={view === v}
                aria-label={v === "list" ? "List view" : "Grid view"}
                onClick={() => apply({ view: v === "grid" ? "grid" : "" })}
                className={`flex h-8 w-8 items-center justify-center rounded-[4px] transition-colors ${view === v ? "bg-maroon text-white shadow-sm" : "text-muted hover:text-ink"}`}
              >
                <Icon size={16} strokeWidth={1.5} />
              </button>
            );
          })}
        </div>

        <form
          role="search"
          className="relative min-w-[180px] flex-1 basis-[220px]"
          onSubmit={(e) => {
            e.preventDefault();
            apply({ q: q.trim() });
          }}
        >
          <label htmlFor="products-q" className="sr-only">Search products</label>
          <Search size={16} strokeWidth={1.5} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-muted" aria-hidden />
          <input
            id="products-q"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, code or tag"
            className={`${CONTROL} !pl-10 focus:!bg-white`}
          />
        </form>

        {/* Selects + Filters: one aligned row of equal-height controls (two rows on phones) */}
        <div className="grid w-full grid-cols-2 items-center gap-3 md:w-auto md:grid-cols-[repeat(3,11rem)_auto]">
          {select("category", "Category", [{ value: "", label: "All categories" }, ...categories])}
          {select("status", "Show", SHOW)}
          {select("sort", "Sort by", SORT)}
          <button
            type="button"
            aria-expanded={open}
            aria-controls="product-filters"
            onClick={() => setOpen((o) => !o)}
            className={`btn-outline btn-sm !h-10 !py-0 ${moreActive ? "!border-maroon !text-maroon" : ""}`}
          >
            <SlidersHorizontal size={14} strokeWidth={1.5} aria-hidden /> Filters
            {moreActive > 0 && <span className="ml-1 rounded-full bg-maroon px-1.5 text-[10px] leading-4 text-white">{moreActive}</span>}
          </button>
        </div>
      </div>

      <div id="product-filters" hidden={!open} className="mt-3 rounded-[12px] bg-cream/40 p-4">
        <div className="grid gap-4 sm:grid-cols-3">
          {MORE.map((m) => (
            <div key={m.key}>
              <p className="mb-1.5 text-xs text-muted">{m.label}</p>
              {select(m.key, m.label, m.options)}
            </div>
          ))}
        </div>
      </div>

      {anyFilter && (
        <div className="pt-3">
          <button
            type="button"
            onClick={() => {
              setQ("");
              apply(Object.fromEntries(["q", "category", "status", ...MORE.map((m) => m.key)].map((k) => [k, ""])));
            }}
            className="inline-flex items-center gap-1.5 text-[11px] tracking-[0.16em] text-muted uppercase hover:text-maroon"
          >
            <X size={13} strokeWidth={1.5} aria-hidden /> Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
