"use client";
import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Plus, Search, X } from "lucide-react";

export type PickerProduct = { id: string; name: string; image: string | null; category: string; live: boolean };

/**
 * Choose products and their order. The chosen ids go in a hidden field (JSON) named `name`.
 * Left: the chosen list (reorder / remove). Right: search the catalogue and add.
 */
export function ProductPicker({ name, all, initial }: { name: string; all: PickerProduct[]; initial: string[] }) {
  const [ids, setIds] = useState(initial.filter((id) => all.some((p) => p.id === id)));
  const [q, setQ] = useState("");
  const byId = useMemo(() => new Map(all.map((p) => [p.id, p])), [all]);
  const results = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return [];
    return all.filter((p) => !ids.includes(p.id) && (p.name.toLowerCase().includes(t) || p.category.toLowerCase().includes(t))).slice(0, 12);
  }, [q, all, ids]);

  const move = (i: number, dir: -1 | 1) =>
    setIds((list) => {
      const next = [...list];
      const j = i + dir;
      if (j < 0 || j >= next.length) return list;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const thumb = (p: PickerProduct) => (
    <span className="h-12 w-9 shrink-0 overflow-hidden rounded-[6px] bg-sand">
      {p.image && <img src={p.image} alt="" width={36} height={48} loading="lazy" className="h-full w-full object-cover" />}
    </span>
  );
  const icon = "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-cream hover:text-maroon disabled:opacity-30";

  return (
    <div className="grid gap-5 lg:grid-cols-2 [&>*]:min-w-0">
      <input type="hidden" name={name} value={JSON.stringify(ids)} />
      <div>
        <p className="mb-2 text-[13px] font-medium">
          In this collection <span className="text-muted">({ids.length})</span>
        </p>
        {ids.length === 0 ? (
          <p className="rounded-[12px] border border-dashed border-sand p-6 text-center text-sm text-muted">No products yet. Search on the right to add some.</p>
        ) : (
          <ol className="max-h-[28rem] space-y-1.5 overflow-y-auto pr-1">
            {ids.map((id, i) => {
              const p = byId.get(id)!;
              return (
                <li key={id} className="flex items-center gap-3 rounded-[12px] bg-cream/40 p-2">
                  <span className="w-5 text-center text-xs text-muted">{i + 1}</span>
                  {thumb(p)}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm">{p.name}</span>
                    <span className="block text-xs text-muted">
                      {p.category}
                      {!p.live && " · not live"}
                    </span>
                  </span>
                  <button type="button" className={icon} onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move ${p.name} up`}>
                    <ArrowUp size={14} />
                  </button>
                  <button type="button" className={icon} onClick={() => move(i, 1)} disabled={i === ids.length - 1} aria-label={`Move ${p.name} down`}>
                    <ArrowDown size={14} />
                  </button>
                  <button type="button" className={`${icon} hover:!text-sale`} onClick={() => setIds((l) => l.filter((x) => x !== id))} aria-label={`Remove ${p.name}`}>
                    <X size={15} />
                  </button>
                </li>
              );
            })}
          </ol>
        )}
      </div>
      <div>
        <label htmlFor={`${name}-search`} className="mb-2 block text-[13px] font-medium">
          Add products
        </label>
        <div className="relative">
          <Search size={16} strokeWidth={1.5} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-muted" aria-hidden />
          <input id={`${name}-search`} type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or category" className="!pl-10" />
        </div>
        <ul className="mt-2 space-y-1.5" aria-live="polite">
          {results.map((p) => (
            <li key={p.id}>
              <button type="button" onClick={() => setIds((l) => [...l, p.id])} className="flex w-full items-center gap-3 rounded-[12px] p-2 text-left transition-colors hover:bg-cream/60">
                {thumb(p)}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm">{p.name}</span>
                  <span className="block text-xs text-muted">{p.category}</span>
                </span>
                <Plus size={16} className="shrink-0 text-maroon" aria-hidden />
                <span className="sr-only">Add</span>
              </button>
            </li>
          ))}
          {q.trim() && results.length === 0 && <li className="p-2 text-sm text-muted">No matching products.</li>}
        </ul>
      </div>
    </div>
  );
}
