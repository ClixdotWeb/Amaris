import Link from "next/link";
import { Check } from "lucide-react";

const STEPS = [
  { n: 1, label: "Cart", href: "/cart" },
  { n: 2, label: "Details", href: "/checkout" },
  { n: 3, label: "Payment", href: null },
  { n: 4, label: "Confirmed", href: null },
];

/** Cart → Details → Payment → Confirmed, so customers always know where they are. */
export function CheckoutSteps({ current, buyNow = false }: { current: 1 | 2 | 3 | 4; buyNow?: boolean }) {
  const steps = buyNow ? [{ n: 1, label: "Product", href: null }, ...STEPS.slice(1)] : STEPS;
  return (
    <ol className="mx-auto flex max-w-2xl items-center" aria-label="Checkout steps">
      {steps.map((s, i) => {
        const done = s.n < current;
        const here = s.n === current;
        const dot = (
          <span
            className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs ${
              here ? "border-maroon bg-maroon text-white" : done ? "border-maroon text-maroon" : "border-sand text-muted"
            }`}
          >
            {done ? <Check size={14} aria-hidden /> : s.n}
          </span>
        );
        return (
          <li key={s.n} className="flex flex-1 items-center last:flex-none" aria-current={here ? "step" : undefined}>
            <span className="flex flex-col items-center gap-2">
              {done && s.href && current < 4 ? <Link href={s.href}>{dot}</Link> : dot}
              <span className={`text-[10px] tracking-[0.16em] uppercase ${here ? "text-maroon" : "text-muted"}`}>{s.label}</span>
            </span>
            {i < steps.length - 1 && <span aria-hidden className={`mx-2 mb-6 h-px flex-1 ${done ? "bg-maroon" : "bg-sand"}`} />}
          </li>
        );
      })}
    </ol>
  );
}
