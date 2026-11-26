"use client";
import Link from "next/link";
import { useActionState, useState } from "react";
import { Plus, X } from "lucide-react";
import { saveSizeChart } from "./actions";
import { Field } from "@/components/admin/ui";
import { Select } from "@/components/admin/Select";
import { useActionToast } from "@/components/admin/Toaster";
import type { SizeChartData } from "@/types";

type Draft = Omit<SizeChartData, "id"> & { id?: string };

const BLANK: Draft = {
  name: "",
  unit: "inches",
  sizes: ["S", "M", "L", "XL"],
  rows: [
    { label: "Bust", values: ["", "", "", ""] },
    { label: "Waist", values: ["", "", "", ""] },
  ],
  note: null,
  category_slugs: [],
};

/** Edit a size chart as a table: sizes across, measurements down. Linked categories show it on product pages. */
export function SizeChartEditor({ chart, categories }: { chart: SizeChartData | null; categories: { slug: string; name: string; chart: string | null }[] }) {
  const [state, action, pending] = useActionState(saveSizeChart, undefined);
  useActionToast(state);
  const [c, setC] = useState<Draft>(() => (chart ? structuredClone(chart) : structuredClone(BLANK)));
  const set = (patch: Partial<Draft>) => setC((d) => ({ ...d, ...patch }));

  const addSize = () => set({ sizes: [...c.sizes, ""], rows: c.rows.map((r) => ({ ...r, values: [...r.values, ""] })) });
  const removeSize = (i: number) => set({ sizes: c.sizes.filter((_, j) => j !== i), rows: c.rows.map((r) => ({ ...r, values: r.values.filter((_, j) => j !== i) })) });
  const addRow = () => set({ rows: [...c.rows, { label: "", values: c.sizes.map(() => "") }] });
  const removeRow = (i: number) => set({ rows: c.rows.filter((_, j) => j !== i) });
  const cellCls = "!h-9 min-w-[4.5rem] !px-2 text-center text-sm";
  const iconBtn = "flex h-7 w-7 items-center justify-center rounded-full text-muted hover:bg-cream hover:text-sale";

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="chart" value={JSON.stringify({ ...c, note: c.note || null })} />
      <div className="grid gap-5 md:grid-cols-[1fr_12rem] [&>*]:min-w-0">
        <Field label="Chart name" htmlFor="sc-name">
          <input id="sc-name" value={c.name} onChange={(e) => set({ name: e.target.value })} maxLength={60} required placeholder="e.g. Women's standard sizes" />
        </Field>
        <Field label="Unit" htmlFor="sc-unit">
          <Select id="sc-unit" label="Unit" value={c.unit} onChange={(v) => set({ unit: v as Draft["unit"] })} options={[{ value: "inches", label: "Inches" }, { value: "cm", label: "Centimetres" }]} />
        </Field>
      </div>

      <div>
        <p className="mb-2 text-[13px] font-medium">Measurements</p>
        <div className="overflow-x-auto rounded-[14px] border border-sand">
          <table className="w-full border-collapse text-sm [&_td]:border-0 [&_th]:border-0">
            <thead>
              <tr className="bg-cream/50">
                <th className="!px-3 !py-2.5 text-left">Measurement</th>
                {c.sizes.map((s, i) => (
                  <th key={i} className="!px-1.5 !py-2">
                    <div className="flex items-center gap-1">
                      <input aria-label={`Size ${i + 1} name`} value={s} maxLength={12} onChange={(e) => set({ sizes: c.sizes.map((x, j) => (j === i ? e.target.value : x)) })} className={`${cellCls} font-medium`} />
                      <button type="button" className={iconBtn} onClick={() => removeSize(i)} disabled={c.sizes.length <= 1} aria-label={`Remove size ${s || i + 1}`}>
                        <X size={13} />
                      </button>
                    </div>
                  </th>
                ))}
                <th className="!px-2">
                  <button type="button" onClick={addSize} disabled={c.sizes.length >= 12} className="inline-flex items-center gap-1 text-[11px] tracking-[0.14em] whitespace-nowrap text-maroon uppercase">
                    <Plus size={13} /> Size
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {c.rows.map((r, ri) => (
                <tr key={ri} className="border-t border-sand/70">
                  <td className="!px-3 !py-2">
                    <input aria-label={`Measurement ${ri + 1} name`} value={r.label} maxLength={30} onChange={(e) => set({ rows: c.rows.map((x, j) => (j === ri ? { ...x, label: e.target.value } : x)) })} className="!h-9 min-w-[8rem] text-sm" />
                  </td>
                  {c.sizes.map((s, si) => (
                    <td key={si} className="!px-1.5 !py-2">
                      <input
                        aria-label={`${r.label || "Measurement"} for ${s || `size ${si + 1}`}`}
                        value={r.values[si] ?? ""}
                        maxLength={20}
                        onChange={(e) => set({ rows: c.rows.map((x, j) => (j === ri ? { ...x, values: c.sizes.map((_, k) => (k === si ? e.target.value : (x.values[k] ?? ""))) } : x)) })}
                        className={cellCls}
                      />
                    </td>
                  ))}
                  <td className="!px-2">
                    <button type="button" className={iconBtn} onClick={() => removeRow(ri)} disabled={c.rows.length <= 1} aria-label={`Remove ${r.label || "measurement"}`}>
                      <X size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button type="button" onClick={addRow} disabled={c.rows.length >= 20} className="mt-3 inline-flex items-center gap-1.5 text-[11px] tracking-[0.14em] text-maroon uppercase">
          <Plus size={13} /> Add measurement
        </button>
      </div>

      <Field label="Note under the chart" htmlFor="sc-note">
        <textarea id="sc-note" rows={2} maxLength={300} value={c.note ?? ""} onChange={(e) => set({ note: e.target.value })} />
      </Field>

      <fieldset>
        <legend className="mb-2 text-[13px] font-medium">Show on these categories</legend>
        <p className="mb-3 text-xs text-muted">A category uses one chart. Ticking it here moves it from its current chart.</p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => {
            const on = c.category_slugs.includes(cat.slug);
            return (
              <label key={cat.slug} className="flex cursor-pointer items-start gap-3 rounded-[12px] border border-sand/80 px-4 py-3 has-[:checked]:border-maroon has-[:checked]:bg-maroon/[0.03]">
                <input
                  type="checkbox"
                  checked={on}
                  onChange={() => set({ category_slugs: on ? c.category_slugs.filter((x) => x !== cat.slug) : [...c.category_slugs, cat.slug] })}
                  className="mt-0.5"
                />
                <span className="min-w-0 text-sm">
                  {cat.name}
                  {cat.chart && cat.chart !== chart?.name && <span className="block text-xs text-muted">Now uses: {cat.chart}</span>}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="flex justify-end gap-2 border-t border-sand/70 pt-5">
        <Link href="/admin/sizes" className="btn-outline btn-sm">Cancel</Link>
        <button type="submit" className="btn-primary btn-sm" disabled={pending}>
          {pending ? "Saving…" : chart ? "Save chart" : "Add chart"}
        </button>
      </div>
    </form>
  );
}
