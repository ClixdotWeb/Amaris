import { Star } from "lucide-react";

/** Read-only star rating (whole stars; the exact average is shown as text next to it). */
export function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex text-gold" aria-label={`${value.toFixed(1)} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={size} strokeWidth={1.4} fill={n <= Math.round(value) ? "currentColor" : "none"} aria-hidden />
      ))}
    </span>
  );
}
