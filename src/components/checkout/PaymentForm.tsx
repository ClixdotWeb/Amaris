"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Banknote, Building2, CreditCard, Lock, ShieldCheck, Smartphone } from "lucide-react";
import { payTestOrder } from "@/app/(shop)/checkout/pay/actions";
import { useCart } from "@/components/cart/CartProvider";
import { COUPON_KEY } from "@/components/cart/CouponBox";
import { formatINR } from "@/lib/format";
import { clearBuyNow } from "./useCheckoutItems";

const METHODS = [
  { key: "upi", label: "UPI", hint: "Google Pay, PhonePe, Paytm", icon: Smartphone },
  { key: "card", label: "Card", hint: "Debit or credit card", icon: CreditCard },
  { key: "netbanking", label: "Net banking", hint: "All major banks", icon: Building2 },
  { key: "cod", label: "Cash on delivery", hint: "Pay when it arrives", icon: Banknote },
] as const;
const BANKS = ["State Bank of India", "Federal Bank", "South Indian Bank", "HDFC Bank", "ICICI Bank", "Canara Bank", "Axis Bank"];

/**
 * Payment step. In development (no Razorpay keys) this is a test payment: nothing is charged, the order is
 * marked paid exactly as Razorpay's confirmation would, and the customer sees the order confirmation.
 */
export function PaymentForm({
  orderId,
  total,
  buyNow = false,
  cod = null,
}: {
  orderId: string;
  total: number;
  buyNow?: boolean;
  /** Cash on delivery offered for this order (null = not offered), with its charge */
  cod?: { fee: number } | null;
}) {
  const methods = METHODS.filter((m) => m.key !== "cod" || cod);
  const codTotal = total + (cod?.fee ?? 0);
  const [method, setMethod] = useState<(typeof METHODS)[number]["key"]>("upi");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const { clear } = useCart();
  const router = useRouter();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        start(async () => {
          const r = await payTestOrder(orderId, method);
          if (r.error) return setError(r.error);
          // Buy now: only that item is done; the cart stays as it was
          if (buyNow) clearBuyNow();
          else {
            clear();
            try {
              localStorage.removeItem(COUPON_KEY);
            } catch {}
          }
          router.push(`/order/success/${orderId}${buyNow ? "?buy=now" : ""}`);
        });
      }}
      className="card p-6 md:p-8"
    >
      <h2 className="font-display text-2xl">Choose how to pay</h2>
      <div role="radiogroup" aria-label="Payment method" className={`mt-6 grid gap-3 sm:grid-cols-2 ${methods.length === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>
        {methods.map((m) => (
          <label
            key={m.key}
            className="flex cursor-pointer items-center gap-3 border border-sand bg-white p-4 transition-colors has-[:checked]:border-maroon has-[:checked]:bg-maroon/[0.03]"
          >
            <input type="radio" name="method" value={m.key} checked={method === m.key} onChange={() => setMethod(m.key)} className="sr-only" />
            <m.icon size={20} strokeWidth={1.4} className={method === m.key ? "text-maroon" : "text-muted"} aria-hidden />
            <span>
              <span className="block text-sm font-medium">{m.label}</span>
              <span className="block text-xs text-muted">{m.hint}</span>
            </span>
          </label>
        ))}
      </div>

      <div className="mt-6 space-y-4">
        {method === "upi" && (
          <label className="block">
            <span className="mb-1.5 block text-xs text-muted">UPI ID</span>
            <input name="upi" required placeholder="name@okbank" autoComplete="off" pattern="[\w.\-]+@[\w]+" title="Like name@okbank" />
          </label>
        )}
        {method === "card" && (
          <>
            <label className="block">
              <span className="mb-1.5 block text-xs text-muted">Card number</span>
              <input name="card" required inputMode="numeric" autoComplete="cc-number" placeholder="4111 1111 1111 1111" pattern="[\d ]{12,23}" />
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className="block">
                <span className="mb-1.5 block text-xs text-muted">Expiry (MM/YY)</span>
                <input name="exp" required autoComplete="cc-exp" placeholder="12/28" pattern="\d{2}/\d{2}" />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs text-muted">CVV</span>
                <input name="cvv" required inputMode="numeric" autoComplete="cc-csc" placeholder="123" pattern="\d{3,4}" />
              </label>
            </div>
            <label className="block">
              <span className="mb-1.5 block text-xs text-muted">Name on card</span>
              <input name="cardname" required autoComplete="cc-name" />
            </label>
          </>
        )}
        {method === "cod" && (
          <div className="bg-cream p-5 text-sm leading-relaxed">
            <p className="font-medium">Pay {formatINR(codTotal)} in cash when India Post delivers your order.</p>
            <p className="mt-1 text-muted">
              {cod?.fee ? `Includes a cash on delivery charge of ${formatINR(cod.fee)}. ` : ""}Please keep the exact amount ready. Your order is confirmed straight away.
            </p>
          </div>
        )}
        {method === "netbanking" && (
          <label className="block">
            <span className="mb-1.5 block text-xs text-muted">Your bank</span>
            <select name="bank" required defaultValue="">
              <option value="" disabled>
                Choose a bank
              </option>
              {BANKS.map((b) => (
                <option key={b}>{b}</option>
              ))}
            </select>
          </label>
        )}
      </div>

      <p hidden={method === "cod"} className="mt-6 flex gap-2 border border-gold/60 bg-gold-light/30 p-4 text-xs leading-relaxed">
        <ShieldCheck size={16} className="shrink-0 text-gold" aria-hidden />
        Test payment: no money is taken. Real payments by Razorpay (UPI, cards, net banking) start once the shop&apos;s Razorpay account is connected.
      </p>
      {error && (
        <p role="alert" className="mt-4 text-sm text-sale">
          {error}
        </p>
      )}
      <button type="submit" disabled={pending} className="btn-primary mt-6 w-full">
        <Lock size={14} aria-hidden />{" "}
        {pending
          ? method === "cod"
            ? "Placing your order…"
            : "Processing payment…"
          : method === "cod"
            ? `Place order · pay ${formatINR(codTotal)} on delivery`
            : `Pay ${formatINR(total)}`}
      </button>
    </form>
  );
}
