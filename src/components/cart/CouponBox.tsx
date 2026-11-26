"use client";
import { useEffect, useState, useTransition } from "react";
import { X } from "lucide-react";
import { checkCoupon } from "@/app/(shop)/cart/actions";
import { formatINR } from "@/lib/format";

export const COUPON_KEY = "amaris-coupon";

/** The applied coupon code, kept in this browser so checkout can send it. */
export function readCouponCode(): string | null {
  try {
    return localStorage.getItem(COUPON_KEY);
  } catch {
    return null;
  }
}

/**
 * Coupon field in the cart summary. Checks the code on the server, shows the discount, and is
 * checked again whenever the cart changes (and once more at checkout).
 */
export function CouponBox({ itemsSubtotal, onDiscount }: { itemsSubtotal: number; onDiscount: (d: { code: string; amount: number; label: string } | null) => void }) {
  const [code, setCode] = useState("");
  const [applied, setApplied] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const apply = (value: string, quiet = false) =>
    start(async () => {
      const r = await checkCoupon(value, itemsSubtotal);
      if (r.ok) {
        setApplied(r.code!);
        setError(null);
        onDiscount({ code: r.code!, amount: r.discount, label: r.label });
        try {
          localStorage.setItem(COUPON_KEY, r.code!);
        } catch {}
      } else {
        if (!quiet || applied) setError(r.error);
        setApplied(null);
        onDiscount(null);
        try {
          localStorage.removeItem(COUPON_KEY);
        } catch {}
      }
    });

  // Re-check a saved code on load and whenever the cart total changes
  useEffect(() => {
    const saved = readCouponCode();
    if (saved) apply(saved, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsSubtotal]);

  if (applied)
    return (
      <div className="flex items-center justify-between gap-3 border border-dashed border-gold/60 bg-cream/50 px-3 py-2 text-sm">
        <span>
          Code <strong className="tracking-wider">{applied}</strong> applied
        </span>
        <button
          type="button"
          aria-label="Remove coupon"
          className="text-muted hover:text-maroon"
          onClick={() => {
            setApplied(null);
            onDiscount(null);
            try {
              localStorage.removeItem(COUPON_KEY);
            } catch {}
          }}
        >
          <X size={15} />
        </button>
      </div>
    );

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (code.trim()) apply(code.trim());
      }}
    >
      <label htmlFor="coupon" className="mb-1.5 block text-[11px] tracking-[0.14em] text-muted uppercase">
        Coupon code
      </label>
      <div className="flex gap-2">
        <input id="coupon" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} maxLength={30} autoComplete="off" className="!h-10 uppercase" />
        <button type="submit" className="btn-outline !h-10 shrink-0 !px-4 !py-0" disabled={pending || !code.trim()}>
          {pending ? "…" : "Apply"}
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-1.5 text-xs text-sale">
          {error}
        </p>
      )}
    </form>
  );
}

export function DiscountLine({ discount }: { discount: { code: string; amount: number; label: string } }) {
  return (
    <div className="flex justify-between text-success">
      <dt>
        Discount <span className="text-xs">({discount.label})</span>
      </dt>
      <dd>−{formatINR(discount.amount)}</dd>
    </div>
  );
}
