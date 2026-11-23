import { MEASUREMENT_FIELDS, MEASUREMENT_UNIT } from "@/config/shop";
import type { Sizing } from "@/types";

/** Shows the chosen standard size or the list of entered measurements. */
export function SizingSummary({ sizing }: { sizing?: Sizing | null }) {
  if (!sizing) return null;
  if (sizing.mode === "standard") return <p className="text-xs text-muted">Size: {sizing.size}</p>;
  return (
    <details className="text-xs text-muted">
      <summary className="cursor-pointer text-maroon">Custom measurements ({MEASUREMENT_UNIT})</summary>
      <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
        {MEASUREMENT_FIELDS.filter((f) => sizing.measurements[f.key] != null).map((f) => (
          <div key={f.key} className="flex justify-between gap-2">
            <dt>{f.label}</dt>
            <dd className="text-ink">{sizing.measurements[f.key]}</dd>
          </div>
        ))}
      </dl>
      {sizing.notes && <p className="mt-2">Notes: {sizing.notes}</p>}
    </details>
  );
}
