"use client";
import { MEASUREMENT_FIELDS, MEASUREMENT_UNIT } from "@/config/shop";
import type { Measurements, Sizing } from "@/types";
import { SizeChart } from "./SizeChart";

/**
 * Standard size OR manual measurements.
 * Used by custom-made products and by unstitched suits when stitching is chosen.
 */
export function SizingPicker({
  sizes,
  value,
  onChange,
  showSizeChart = false,
}: {
  sizes: readonly string[];
  value: Sizing | null;
  onChange: (s: Sizing | null) => void;
  /** Show the "Size chart" link (adult sizes only). */
  showSizeChart?: boolean;
}) {
  const mode = value?.mode ?? "standard";
  const measurements: Measurements = value?.mode === "custom" ? value.measurements : {};

  const tab = (m: "standard" | "custom", label: string) => (
    <button
      type="button"
      role="tab"
      aria-selected={mode === m}
      onClick={() => onChange(m === "standard" ? null : { mode: "custom", measurements: {} })}
      className={`flex-1 py-3 text-[12px] tracking-[0.14em] uppercase transition ${
        mode === m ? "bg-ink text-white" : "bg-white text-muted hover:text-ink"
      }`}
    >
      {label}
    </button>
  );

  return (
    <fieldset>
      <legend>Size</legend>
      {showSizeChart && <SizeChart />}
      <div role="tablist" className="flex overflow-hidden rounded-[3px] border border-ink">
        {tab("standard", "Standard size")}
        {tab("custom", "My measurements")}
      </div>

      {mode === "standard" && (
        <div role="radiogroup" aria-label="Standard size" className="mt-4 flex flex-wrap gap-2">
          {sizes.map((s) => {
            const on = value?.mode === "standard" && value.size === s;
            return (
              <button
                key={s}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => onChange({ mode: "standard", size: s })}
                className={`chip ${on ? "chip-active" : ""}`}
              >
                {s}
              </button>
            );
          })}
        </div>
      )}

      {mode === "custom" && (
        <div className="mt-4 rounded-[3px] border border-sand bg-white p-4">
          <p className="mb-4 text-xs text-muted">All measurements in {MEASUREMENT_UNIT}. Fields marked * are required.</p>
          <div className="grid grid-cols-2 gap-3">
            {MEASUREMENT_FIELDS.map((f) => (
              <label key={f.key} className="block">
                <span className="mb-1 block text-xs text-muted">
                  {f.label}
                  {f.required && " *"}
                </span>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.25"
                  min={0}
                  required={f.required}
                  className="!py-2"
                  value={measurements[f.key] ?? ""}
                  onChange={(e) => {
                    const next = { ...measurements };
                    if (e.target.value === "") delete next[f.key];
                    else next[f.key] = Number(e.target.value);
                    onChange({ mode: "custom", measurements: next, notes: value?.mode === "custom" ? value.notes : undefined });
                  }}
                />
              </label>
            ))}
          </div>
          <label className="mt-3 block">
            <span className="mb-1 block text-xs text-muted">Notes for the tailor (optional)</span>
            <textarea
              rows={2}
              maxLength={500}
              value={value?.mode === "custom" ? (value.notes ?? "") : ""}
              onChange={(e) => onChange({ mode: "custom", measurements, notes: e.target.value })}
            />
          </label>
        </div>
      )}
    </fieldset>
  );
}

export function isSizingComplete(s: Sizing | null) {
  if (!s) return false;
  if (s.mode === "standard") return !!s.size;
  return MEASUREMENT_FIELDS.filter((f) => f.required).every((f) => s.measurements[f.key] > 0);
}
