"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { availableProductIds } from "./actions";
import { ShoppingBag, Lock } from "lucide-react";
import { useCart } from "@/components/cart/CartProvider";
import { CartLineItem } from "@/components/cart/CartLineItem";
import { PageHeader } from "@/components/layout/PageHeader";
import { formatINR } from "@/lib/format";
import { CouponBox, DiscountLine } from "@/components/cart/CouponBox";
import { CheckoutSteps } from "@/components/checkout/CheckoutSteps";

export default function CartPage() {
  const { items, subtotal, stitchingTotal, ready, remove } = useCart();
  // Items whose product was removed or hidden in the shop are taken out of the cart, with a note
  const [removed, setRemoved] = useState<string[]>([]);
  useEffect(() => {
    if (!ready || !items.length) return;
    let cancelled = false;
    availableProductIds(items.map((i) => i.productId)).then((ok) => {
      if (cancelled) return;
      const gone = items.filter((i) => !ok.includes(i.productId));
      if (!gone.length) return;
      gone.forEach((i) => remove(i.key));
      setRemoved((r) => [...r, ...gone.map((i) => i.name)]);
    });
    return () => {
      cancelled = true;
    };
    // Check once the saved cart is loaded
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);
  const removedNote = removed.length > 0 && (
    <p role="status" className="container-x mt-8 border border-gold/60 bg-gold-light/30 p-4 text-sm">
      {removed.join(", ")} {removed.length === 1 ? "is" : "are"} no longer available and {removed.length === 1 ? "was" : "were"} removed from your cart.
    </p>
  );
  const [discount, setDiscount] = useState<{ code: string; amount: number; label: string } | null>(null);

  // The cart is read from this browser; until then show the page shape instead of a blank screen
  if (!ready)
    return (
      <>
        <PageHeader title="Your cart" crumb="Cart" />
        <section aria-busy className="container-x grid gap-12 py-12 lg:grid-cols-[1fr_380px]">
          <ul className="space-y-6 border-t border-sand pt-6">
            {[0, 1].map((n) => (
              <li key={n} className="flex gap-5">
                <span className="h-36 w-28 animate-pulse bg-cream" />
                <span className="flex-1 space-y-3 pt-2">
                  <span className="block h-4 w-2/3 animate-pulse bg-cream" />
                  <span className="block h-3 w-1/3 animate-pulse bg-cream" />
                </span>
              </li>
            ))}
          </ul>
          <div className="card h-64 animate-pulse" />
        </section>
      </>
    );

  if (!items.length)
    return (
      <>
        <PageHeader title="Your cart" crumb="Cart" />
        {removedNote}
        <section className="container-x flex flex-col items-center py-24 text-center">
          <ShoppingBag size={48} strokeWidth={1} className="text-gold" />
          <p className="mt-6 font-display text-3xl">Your cart is empty</p>
          <p className="mt-2 text-sm text-muted">Looks like you haven&apos;t added anything yet.</p>
          <Link href="/new-arrivals" className="btn-primary mt-8">Continue shopping</Link>
        </section>
      </>
    );

  return (
    <>
      <PageHeader title="Your cart" crumb="Cart" />
      {removedNote}
      <div className="container-x pt-12">
        <CheckoutSteps current={1} />
      </div>
      <section className="container-x grid gap-12 py-12 lg:grid-cols-[1fr_380px]">
        <ul className="border-t border-sand">
          {items.map((i) => (
            <CartLineItem key={i.key} item={i} />
          ))}
        </ul>

        <aside aria-label="Cart summary" className="card h-fit p-6 lg:sticky lg:top-40">
          <h2 className="font-display text-2xl">Order summary</h2>
          <dl className="mt-6 space-y-3 text-sm">
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
              <dt className="text-muted">Shipping</dt>
              <dd className="text-muted">At checkout</dd>
            </div>
            <div className="flex justify-between border-t border-sand pt-4 text-base">
              <dt>Subtotal</dt>
              <dd className="text-xl font-medium">{formatINR(subtotal - (discount?.amount ?? 0))}</dd>
            </div>
          </dl>
          <div className="mt-6">
            <CouponBox itemsSubtotal={subtotal - stitchingTotal} onDiscount={setDiscount} />
          </div>
          <Link href="/checkout" className="btn-primary mt-6 w-full">
            <Lock size={14} /> Checkout
          </Link>
          <Link href="/" className="mt-4 block text-center text-xs tracking-[0.14em] text-muted uppercase hover:text-maroon">
            Continue shopping
          </Link>
        </aside>
      </section>
    </>
  );
}
