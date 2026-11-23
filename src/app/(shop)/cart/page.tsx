"use client";
import Link from "next/link";
import { ShoppingBag, Lock } from "lucide-react";
import { useCart } from "@/components/cart/CartProvider";
import { CartLineItem } from "@/components/cart/CartLineItem";
import { PageHeader } from "@/components/layout/PageHeader";
import { formatINR } from "@/lib/format";

export default function CartPage() {
  const { items, subtotal, stitchingTotal, ready } = useCart();

  if (!ready) return <PageHeader title="Your cart" crumb="Cart" />;

  if (!items.length)
    return (
      <>
        <PageHeader title="Your cart" crumb="Cart" />
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
            <div className="flex justify-between">
              <dt className="text-muted">Shipping</dt>
              <dd className="text-muted">At checkout</dd>
            </div>
            <div className="flex justify-between border-t border-sand pt-4 text-base">
              <dt>Subtotal</dt>
              <dd className="text-xl font-medium">{formatINR(subtotal)}</dd>
            </div>
          </dl>
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
