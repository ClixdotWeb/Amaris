"use client";
import { useState } from "react";
import { Check, Copy } from "lucide-react";

/** Copies a value (e.g. an India Post consignment number) so it can be pasted into the tracking form. */
export function CopyButton({ value, label = "Copy" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {}
      }}
      className="inline-flex items-center gap-1.5 text-[11px] tracking-[0.18em] text-maroon uppercase transition-colors hover:text-maroon-dark"
      aria-live="polite"
    >
      {copied ? <Check size={14} strokeWidth={1.6} /> : <Copy size={14} strokeWidth={1.6} />}
      {copied ? "Copied" : label}
    </button>
  );
}
