"use client";
import { useState } from "react";
import type { ProductStatus } from "@/types";

const OPTIONS: { value: ProductStatus; label: string; hint: string; dot: string }[] = [
  { value: "published", label: "Live", hint: "Customers can see and buy it.", dot: "bg-success" },
  { value: "draft", label: "Hidden", hint: "Not on the store. For new products or a pause.", dot: "bg-warning" },
  { value: "archived", label: "Archived", hint: "Retired. Kept for past orders and records.", dot: "bg-muted" },
];

/** Live / Hidden / Archived as selectable cards (radio group). */
export function StatusPicker({ defaultValue }: { defaultValue: ProductStatus }) {
  const [value, setValue] = useState(defaultValue);
  return (
    <div role="radiogroup" aria-label="Status" className="grid gap-2">
      {OPTIONS.map((o) => (
        <label
          key={o.value}
          className={`flex cursor-pointer gap-3 rounded-[var(--radius-control)] border p-3 transition-colors ${
            value === o.value ? "border-maroon bg-maroon/[0.04]" : "border-sand hover:border-sand-strong"
          }`}
        >
          <input type="radio" name="status" value={o.value} checked={value === o.value} onChange={() => setValue(o.value)} className="mt-1" />
          <span>
            <span className="flex items-center gap-2 text-sm font-medium">
              <span aria-hidden className={`h-2 w-2 rounded-full ${o.dot}`} />
              {o.label}
            </span>
            <span className="block text-xs text-muted">{o.hint}</span>
          </span>
        </label>
      ))}
    </div>
  );
}
