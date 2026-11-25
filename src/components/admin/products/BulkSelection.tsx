"use client";
import { createContext, useContext, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { useToast } from "@/components/admin/Toaster";
import { Select } from "@/components/admin/Select";
import type { BulkProductAction } from "@/lib/db/types";

/**
 * Row selection for the products list + the bulk bar that appears when rows are selected.
 * Selection is for the current page of results; it clears when the page or filters change.
 */
type Ctx = { selected: Set<string>; toggle: (id: string) => void; setMany: (ids: string[], on: boolean) => void; clear: () => void };
const SelectionContext = createContext<Ctx | null>(null);
const useSelection = () => {
  const c = useContext(SelectionContext);
  if (!c) throw new Error("useSelection outside SelectionProvider");
  return c;
};

export function SelectionProvider({ resetKey, children }: { resetKey: string; children: React.ReactNode }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  useEffect(() => setSelected(new Set()), [resetKey]);
  const value: Ctx = {
    selected,
    toggle: (id) =>
      setSelected((s) => {
        const n = new Set(s);
        if (n.has(id)) n.delete(id);
        else n.add(id);
        return n;
      }),
    setMany: (ids, on) =>
      setSelected((s) => {
        const n = new Set(s);
        ids.forEach((id) => (on ? n.add(id) : n.delete(id)));
        return n;
      }),
    clear: () => setSelected(new Set()),
  };
  return <SelectionContext.Provider value={value}>{children}</SelectionContext.Provider>;
}

export function RowCheck({ id, label }: { id: string; label: string }) {
  const { selected, toggle } = useSelection();
  return <input type="checkbox" checked={selected.has(id)} onChange={() => toggle(id)} aria-label={`Select ${label}`} className="h-4 w-4" />;
}

export function PageCheck({ ids }: { ids: string[] }) {
  const { selected, setMany } = useSelection();
  const all = ids.length > 0 && ids.every((id) => selected.has(id));
  const some = !all && ids.some((id) => selected.has(id));
  return (
    <input
      type="checkbox"
      checked={all}
      ref={(el) => {
        if (el) el.indeterminate = some;
      }}
      onChange={() => setMany(ids, !all)}
      aria-label="Select all products on this page"
      className="h-4 w-4"
    />
  );
}

const FLAGS = [
  { value: "is_new_arrival", label: "New Arrivals" },
  { value: "is_hot_deal", label: "Hot Deals" },
  { value: "is_premium", label: "Premium" },
] as const;

/** Sticky bar at the bottom of the screen while products are selected. */
export function BulkBar({
  run,
  deletedView,
}: {
  run: (ids: string[], action: BulkProductAction) => Promise<{ ok?: boolean | string; error?: string }>;
  deletedView: boolean;
}) {
  const { selected, clear } = useSelection();
  const [pending, start] = useTransition();
  const [panel, setPanel] = useState<"price" | null>(null);
  const [priceMode, setPriceMode] = useState<"percent" | "set">("percent");
  const [priceValue, setPriceValue] = useState("");
  const [confirming, setConfirming] = useState<{ text: string; action: BulkProductAction; danger: boolean } | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (confirming) dialog.current?.showModal();
    else dialog.current?.close();
  }, [confirming]);
  const toast = useToast();
  const router = useRouter();
  const count = selected.size;
  if (count === 0) return null;

  const go = (action: BulkProductAction, confirmText?: string) => {
    if (confirmText) return setConfirming({ text: confirmText, action, danger: action.kind === "delete" });
    run_(action);
  };
  const run_ = (action: BulkProductAction) => {
    setConfirming(null);
    start(async () => {
      const r = await run([...selected], action);
      if (r.error) toast(r.error, "error");
      else {
        toast(typeof r.ok === "string" ? r.ok : "Done.");
        clear();
        setPanel(null);
        router.refresh();
      }
    });
  };
  const choose = (value: string) => {
    if (!value) return;
    const [kind, a, b] = value.split(":");
    if (kind === "status") go({ kind: "status", status: a as "published" | "draft" | "archived" });
    if (kind === "flag") go({ kind: "flag", flag: a as (typeof FLAGS)[number]["value"], on: b === "on" });
    if (kind === "stitching") go({ kind: "stitching", on: a === "on" });
    if (kind === "price") setPanel("price");
    if (kind === "delete") go({ kind: "delete" }, `Delete ${count} product${count === 1 ? "" : "s"}? They can be restored from Show: Deleted.`);
  };

  return (
    <div role="region" aria-label="Bulk actions" className="sticky bottom-3 z-30 mx-auto w-full max-w-3xl">
      <div className="card flex flex-wrap items-center gap-3 rounded-card border-maroon/30 px-4 py-3 shadow-pop" aria-busy={pending}>
        <span className="rounded-full bg-maroon px-2.5 py-0.5 text-xs text-white">{count}</span>
        <span className="text-sm">selected</span>
        {deletedView ? (
          <button type="button" className="btn-primary btn-sm" disabled={pending} onClick={() => go({ kind: "restore" })}>
            Restore
          </button>
        ) : (
          <Select
            label="Choose an action"
            placeholder="Choose an action…"
            value=""
            disabled={pending}
            onChange={choose}
            className="w-56"
            groups={[
              { label: "Status", options: [{ value: "status:published", label: "Set Live" }, { value: "status:draft", label: "Set Hidden" }, { value: "status:archived", label: "Archive" }] },
              { label: "Collections", options: [...FLAGS.map((f) => ({ value: `flag:${f.value}:on`, label: `Add to ${f.label}` })), ...FLAGS.map((f) => ({ value: `flag:${f.value}:off`, label: `Remove from ${f.label}` }))] },
              { label: "Stitching (unstitched suits)", options: [{ value: "stitching:on", label: "Turn stitching on" }, { value: "stitching:off", label: "Turn stitching off" }] },
              { label: "Price", options: [{ value: "price", label: "Change price…" }] },
              { label: "Delete", options: [{ value: "delete", label: "Delete…" }] },
            ]}
          />
        )}
        {pending && <span className="text-xs text-muted">Working…</span>}
        <button type="button" onClick={clear} className="ml-auto inline-flex items-center gap-1 text-[11px] tracking-[0.14em] text-muted uppercase hover:text-ink">
          <X size={13} strokeWidth={1.5} aria-hidden /> Clear
        </button>

        {panel === "price" && (
          <form
            className="flex w-full flex-wrap items-end gap-3 border-t border-sand pt-3"
            onSubmit={(e) => {
              e.preventDefault();
              const v = Number(priceValue);
              if (!priceValue || Number.isNaN(v)) return toast("Enter a number.", "error");
              go({ kind: "price", mode: priceMode, value: v }, priceMode === "set" ? `Set the price of ${count} products to ₹${v}?` : `Change the price of ${count} products by ${v > 0 ? "+" : ""}${v}%? Prices round to whole rupees.`);
            }}
          >
            <div>
              <span className="mb-1 block text-xs text-muted">How</span>
              <Select
                label="How to change the price"
                size="sm"
                className="w-40"
                value={priceMode}
                onChange={(v) => setPriceMode(v as "percent" | "set")}
                options={[{ value: "percent", label: "Change by %" }, { value: "set", label: "Set to ₹" }]}
              />
            </div>
            <label className="block">
              <span className="mb-1 block text-xs text-muted">{priceMode === "percent" ? "Percent (e.g. 10 or -15)" : "New price (₹)"}</span>
              <input value={priceValue} onChange={(e) => setPriceValue(e.target.value)} inputMode="decimal" className="!w-40 !py-2 text-sm" autoFocus />
            </label>
            <button type="submit" className="btn-primary btn-sm" disabled={pending}>Apply</button>
            <button type="button" className="btn-outline btn-sm" onClick={() => setPanel(null)}>Cancel</button>
          </form>
        )}
      </div>
      <dialog
        ref={dialog}
        onClose={() => setConfirming(null)}
        aria-labelledby="bulk-confirm-title"
        className="m-auto w-[min(92vw,28rem)] rounded-card border border-sand bg-ivory p-6 text-ink shadow-pop backdrop:bg-ink/40"
      >
        <h2 id="bulk-confirm-title" className="font-display text-2xl">Are you sure?</h2>
        <p className="mt-2 text-sm text-muted">{confirming?.text}</p>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" className="btn-outline btn-sm" onClick={() => setConfirming(null)}>Cancel</button>
          <button type="button" className={`${confirming?.danger ? "btn-danger" : "btn-primary"} btn-sm`} onClick={() => confirming && run_(confirming.action)}>
            {confirming?.danger ? "Delete" : "Apply"}
          </button>
        </div>
      </dialog>
    </div>
  );
}
