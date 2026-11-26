"use client";
import { useEffect, useState } from "react";
import { checkCoupon } from "@/app/(shop)/cart/actions";
import { DiscountLine } from "@/components/cart/CouponBox";
import Link from "next/link";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { Lock, Info } from "lucide-react";
import { useCheckoutItems } from "./useCheckoutItems";
import { CartLineItem } from "@/components/cart/CartLineItem";
import { AddressFields } from "./AddressFields";
import { formatINR } from "@/lib/format";
import { shippingFeeFor } from "@/lib/pricing";
import { CUSTOMS_NOTE, DELIVERY_AFTER_DISPATCH } from "@/config/shop";
import { site } from "@/config/site";
import { readCouponCode } from "@/components/cart/CouponBox";
import type { Address, ShippingAddress, ShopSettings } from "@/types";

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void; on: (e: string, cb: (r: unknown) => void) => void };
  }
}

const EMPTY: ShippingAddress = { full_name: "", phone: "", line1: "", line2: "", city: "", state: "", pincode: "", country: "IN" };

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="card p-6 md:p-8">
      <h2 className="mb-6 flex items-center gap-3 font-display text-2xl">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-maroon font-sans text-sm text-white">{n}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

export function CheckoutForm({
  email: initialEmail,
  savedAddresses,
  settings,
  preview = false,
  testPayments = false,
  buyNow = false,
}: {
  email: string;
  savedAddresses: Address[];
  settings: Pick<ShopSettings, "shipping_kerala_per_item" | "shipping_india_per_item" | "free_shipping_above" | "international_rates">;
  /** Preview mode (no database): everything renders but payment is disabled. */
  preview?: boolean;
  /** Development: order saved in the dashboard store, then the test payment page */
  testPayments?: boolean;
  /** Checking out one item from "Buy now" (the cart is left alone) */
  buyNow?: boolean;
}) {
  const router = useRouter();
  const { items, subtotal, stitchingTotal, clear, ready } = useCheckoutItems(buyNow);

  const first = savedAddresses[0];
  const [address, setAddress] = useState<ShippingAddress>(first ? { ...first, line2: first.line2 ?? "" } : EMPTY);
  const [email, setEmail] = useState(initialEmail);
  const [notes, setNotes] = useState("");
  const [saveAddress, setSaveAddress] = useState(!first);
  const [confirmedAddress, setConfirmedAddress] = useState(false);
  const [acceptedPolicies, setAcceptedPolicies] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Coupon applied in the cart (checked again here; the server checks it once more when the order is saved)
  const [discount, setDiscount] = useState<{ code: string; amount: number; label: string } | null>(null);
  const itemsSubtotal = subtotal - stitchingTotal;
  useEffect(() => {
    const code = readCouponCode();
    if (!code) return setDiscount(null);
    checkCoupon(code, itemsSubtotal).then((r) => setDiscount(r.ok ? { code: r.code!, amount: r.discount, label: r.label } : null));
  }, [itemsSubtotal]);

  if (!ready) return null;
  if (!items.length)
    return (
      <div className="py-20 text-center">
        <p className="font-display text-3xl">{buyNow ? "Nothing to check out" : "Your cart is empty"}</p>
        <Link href="/" className="btn-primary mt-6">Continue shopping</Link>
      </div>
    );

  const itemCount = items.reduce((n, i) => n + i.quantity, 0);
  const shipping = shippingFeeFor(address, subtotal, itemCount, settings as ShopSettings);
  const international = address.country !== "IN";
  // India: the rate depends on the PIN code (Kerala or not), so wait for it before adding shipping
  const needsPin = !international && !/^[1-9]\d{5}$/.test(address.pincode.trim()) && !address.state.trim();
  const total = subtotal - (discount?.amount ?? 0) + (needsPin ? 0 : (shipping ?? 0));
  const hasMadeToOrder = items.some((i) => i.dispatch === "made_to_order");

  async function pay(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    // Say exactly what is missing instead of a button that silently does nothing
    const missing: string[] = [];
    if (needsPin) missing.push("Enter your PIN code (or state) so we can work out delivery.");
    else if (shipping === null) missing.push("Sorry, we don't deliver to this country yet. Please contact us.");
    if (!confirmedAddress) missing.push("Tick the box to confirm your address, PIN code and phone number.");
    if (!acceptedPolicies) missing.push("Tick the box to agree to the Terms, Return & Refund and Shipping policies.");
    if (missing.length) {
      setError(missing.join(" "));
      return;
    }
    if (preview) {
      setError("Preview mode: payments are disabled until the database and Razorpay keys are connected.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(testPayments ? "/api/checkout/test-order" : "/api/checkout/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            size: i.size,
            colour: i.colour,
            lengthMetres: i.lengthMetres,
            stitching: i.stitching,
            sizing: i.sizing,
          })),
          address,
          email,
          customerNotes: notes || undefined,
          couponCode: readCouponCode() ?? undefined,
          acceptedPolicies,
          confirmedAddress,
          saveAddress,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.issues?.[0]?.message ?? data.error ?? "Something went wrong.");
      if (testPayments) {
        router.push(`/checkout/pay/${data.orderId}${buyNow ? "?buy=now" : ""}`);
        return;
      }

      const rzp = new window.Razorpay({
        key: data.keyId,
        order_id: data.razorpayOrderId,
        amount: data.amount,
        currency: data.currency,
        name: site.name,
        description: `Order ${data.orderNumber}`,
        prefill: data.prefill,
        theme: { color: "#6e1f2a" },
        handler: async (resp: Record<string, string>) => {
          const v = await fetch("/api/checkout/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(resp),
          });
          if (v.ok) {
            clear();
            router.push(`/order/success/${data.orderId}`);
          } else {
            setError(`Payment received but could not be verified. Please contact us with order ${data.orderNumber}.`);
          }
        },
        modal: { ondismiss: () => setBusy(false) },
      });
      rzp.on("payment.failed", () => setError("Payment failed. Please try again."));
      rzp.open();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={pay} className="grid gap-8 lg:grid-cols-[1fr_420px] lg:gap-12">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      <div className="space-y-6">
        {preview && (
          <p className="flex gap-2 border border-gold bg-gold-light/40 p-4 text-sm">
            <Info size={18} className="shrink-0 text-gold" />
            Preview mode: you can fill in the form, but payment is disabled until the database and Razorpay are connected.
          </p>
        )}

        <Step n={1} title="Contact">
          <label>
            <span className="mb-1.5 block text-xs text-muted">Email for order updates</span>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
        </Step>

        <Step n={2} title="Delivery address">
          {savedAddresses.length > 0 && (
            <fieldset className="mb-6 space-y-2">
              <legend>Saved addresses</legend>
              {savedAddresses.map((a) => (
                <label key={a.id} className="flex cursor-pointer gap-3 border border-sand p-3 text-sm has-[:checked]:border-maroon">
                  <input
                    type="radio"
                    name="saved-address"
                    onChange={() => setAddress({ ...a, line2: a.line2 ?? "" })}
                    defaultChecked={a.id === first?.id}
                  />
                  <span>
                    <span className="font-medium">{a.full_name}</span>, {a.line1}, {a.city} {a.pincode}
                  </span>
                </label>
              ))}
            </fieldset>
          )}
          <AddressFields
            value={address}
            onChange={setAddress}
            countries={Object.keys(settings.international_rates)}
          />
          <div className="mt-5 space-y-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} />
              Save this address to my account
            </label>
            <label>
              <span className="mb-1.5 block text-xs text-muted">Order notes (optional)</span>
              <textarea rows={2} value={notes} maxLength={1000} onChange={(e) => setNotes(e.target.value)} />
            </label>

            {/* Brief §6: ask the customer to verify address, PIN code and phone */}
            <label className="flex gap-3 border border-gold/60 bg-gold-light/30 p-4 text-sm">
              <input type="checkbox" checked={confirmedAddress} onChange={(e) => setConfirmedAddress(e.target.checked)} className="mt-0.5" />
              <span>
                I have checked my address, PIN code <strong>({address.pincode || "—"})</strong> and phone number{" "}
                <strong>({address.phone || "—"})</strong>. Wrong details can delay delivery.
              </span>
            </label>
          </div>
        </Step>
      </div>

      <aside className="h-fit space-y-5 lg:sticky lg:top-40">
        <section className="card p-6">
          <h2 className="font-display text-2xl">Order summary</h2>
          <ul className="mt-2">
            {items.map((i) => (
              <CartLineItem key={i.key} item={i} readOnly />
            ))}
          </ul>
          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Items</dt>
              <dd>{formatINR(subtotal - stitchingTotal)}</dd>
            </div>
            {stitchingTotal > 0 && (
              <div className="flex justify-between">
                <dt className="text-muted">Stitching</dt>
                <dd>{formatINR(stitchingTotal)}</dd>
              </div>
            )}
            {discount && <DiscountLine discount={discount} />}
            <div className="flex justify-between">
              <dt className="text-muted">Shipping {international ? "(courier)" : "(India Post)"}</dt>
              <dd>{needsPin ? <span className="text-muted">Enter PIN code</span> : shipping === null ? "Not available" : shipping === 0 ? "Free" : formatINR(shipping)}</dd>
            </div>
            <div className="flex items-baseline justify-between border-t border-sand pt-4">
              <dt className="text-base">Total</dt>
              <dd className="text-2xl font-medium">{formatINR(total)}</dd>
            </div>
          </dl>

          <div className="mt-5 space-y-2 bg-cream p-4 text-xs leading-relaxed text-muted">
            {hasMadeToOrder && <p className="text-ink">Some items are made to order and will be dispatched in 45–60 days.</p>}
            <p>
              Delivery after dispatch: Kerala {DELIVERY_AFTER_DISPATCH.kerala}, rest of India {DELIVERY_AFTER_DISPATCH.restOfIndia}
              {international && `, international ${DELIVERY_AFTER_DISPATCH.international.toLowerCase()}`}.
            </p>
            {international && <p>{CUSTOMS_NOTE}</p>}
          </div>

          {/* Brief §8: required consent */}
          <label className="mt-5 flex gap-3 text-sm">
            <input type="checkbox" checked={acceptedPolicies} onChange={(e) => setAcceptedPolicies(e.target.checked)} className="mt-0.5" />
            <span>
              I agree to the{" "}
              <Link href="/policies/terms" target="_blank" className="text-maroon underline">Terms</Link>,{" "}
              <Link href="/policies/return-refund" target="_blank" className="text-maroon underline">Return & Refund</Link> and{" "}
              <Link href="/policies/shipping" target="_blank" className="text-maroon underline">Shipping</Link> policies.
            </span>
          </label>

          {error && <p role="alert" className="mt-4 text-sm text-sale">{error}</p>}

          <button type="submit" disabled={busy} className="btn-primary mt-5 w-full">
            <Lock size={14} />
            {busy ? (testPayments ? "Saving your order…" : "Processing…") : testPayments ? "Continue to payment" : `Pay ${formatINR(total)}`}
          </button>
          <p className="mt-3 text-center text-xs text-muted">Secure payment by Razorpay · UPI, cards, net banking</p>
        </section>
      </aside>
    </form>
  );
}
