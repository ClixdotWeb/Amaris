"use client";
import { useEffect, useMemo, useState } from "react";
import { useCart, type CartItem } from "@/components/cart/CartProvider";
import { lineTotal } from "@/lib/pricing";

/**
 * "Buy now" checks out one item on its own, without touching the cart. The item waits in this tab's
 * sessionStorage until the order is paid (or the tab is closed).
 */
const BUY_NOW_KEY = "amaris_buy_now";

export function saveBuyNow(item: Omit<CartItem, "key">) {
  try {
    sessionStorage.setItem(BUY_NOW_KEY, JSON.stringify({ ...item, key: "buy-now" }));
  } catch {}
}

export function clearBuyNow() {
  try {
    sessionStorage.removeItem(BUY_NOW_KEY);
  } catch {}
}

function readBuyNow(): CartItem | null {
  try {
    const raw = sessionStorage.getItem(BUY_NOW_KEY);
    return raw ? (JSON.parse(raw) as CartItem) : null;
  } catch {
    return null;
  }
}

/** The items being checked out: the "Buy now" item, or the cart. Same shape either way. */
export function useCheckoutItems(buyNow: boolean) {
  const cart = useCart();
  const [single, setSingle] = useState<CartItem | null>(null);
  const [loaded, setLoaded] = useState(!buyNow);
  useEffect(() => {
    if (!buyNow) return;
    setSingle(readBuyNow());
    setLoaded(true);
  }, [buyNow]);

  return useMemo(() => {
    if (!buyNow) return { items: cart.items, subtotal: cart.subtotal, stitchingTotal: cart.stitchingTotal, ready: cart.ready, clear: cart.clear };
    const items = single ? [single] : [];
    const totals = items.map((i) => lineTotal(i));
    return {
      items,
      subtotal: totals.reduce((s, t) => s + t.total, 0),
      stitchingTotal: totals.reduce((s, t) => s + t.stitching, 0),
      ready: loaded,
      clear: clearBuyNow,
    };
  }, [buyNow, cart, single, loaded]);
}
