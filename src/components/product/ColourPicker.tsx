"use client";
import type { ProductColour } from "@/types";

/** Swatch fill: one colour, or a diagonal split for two-tone colours ("Black & White"). */
export const swatchFill = (c: ProductColour) =>
  c.hex2 ? `linear-gradient(135deg, ${c.hex} 50%, ${c.hex2} 50%)` : c.hex;

/** Round colour swatches, same rhythm as the size chips. The chosen colour's name shows in the legend. */
export function ColourPicker({
  colours,
  value,
  onChange,
}: {
  colours: ProductColour[];
  value: string;
  onChange: (name: string) => void;
}) {
  return (
    <fieldset>
      <legend>
        Colour{value && <span className="ml-2 tracking-normal text-muted normal-case">: {value}</span>}
      </legend>
      <div className="flex flex-wrap gap-2.5">
        {colours.map((c) => {
          const on = c.name === value;
          return (
            <button
              key={c.name}
              type="button"
              title={c.name}
              aria-label={c.name}
              aria-pressed={on}
              onClick={() => onChange(c.name)}
              className={`flex h-10 w-10 items-center justify-center rounded-full border bg-white transition-colors duration-150 ${
                on ? "border-maroon" : "border-sand hover:border-ink"
              }`}
            >
              <span className="h-7 w-7 rounded-full shadow-[inset_0_0_0_1px_rgba(43,42,44,0.12)]" style={{ background: swatchFill(c) }} />
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
