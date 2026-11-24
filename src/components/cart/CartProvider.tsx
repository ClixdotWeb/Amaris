"use client";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { DispatchType, ProductType, Sizing } from "@/types";
import { lineTotal } from "@/lib/pricing";

/**
 * Cart lives in localStorage. Prices here are for DISPLAY only —
 * the server re-prices everything in /api/checkout/create-order.
 */
export interface CartItem {
  key: string; // unique per product + options
  productId: string;
  slug: string;
  name: string;
  image: string | null;
  productType: ProductType;
  unitPrice: number; // paise
  quantity: number;
  size?: string;
  colour?: string;
  lengthMetres?: number;
  stitching?: boolean;
  stitchingCharge?: number;
  sizing?: Sizing;
  dispatch: DispatchType;
}

interface CartContextValue {
  items: CartItem[];
  count: number;
  subtotal: number; // includes stitching
  stitchingTotal: number;
  add: (item: Omit<CartItem, "key">) => void;
  updateQuantity: (key: string, quantity: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  ready: boolean;
}

const STORAGE_KEY = "amaris_cart_v1";
const CartContext = createContext<CartContextValue | null>(null);

const keyFor = (i: Omit<CartItem, "key">) =>
  JSON.stringify([i.productId, i.size, i.colour, i.lengthMetres, i.stitching, i.sizing]);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setItems(JSON.parse(saved));
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {}
  }, [items, ready]);

  const value = useMemo<CartContextValue>(() => {
    const totals = items.map((i) => lineTotal(i));
    return {
      items,
      ready,
      count: items.reduce((n, i) => n + i.quantity, 0),
      subtotal: totals.reduce((s, t) => s + t.total, 0),
      stitchingTotal: totals.reduce((s, t) => s + t.stitching, 0),
      add: (item) =>
        setItems((prev) => {
          const key = keyFor(item);
          const existing = prev.find((p) => p.key === key);
          // Custom-measured items are never merged: each is its own garment
          if (existing && item.sizing?.mode !== "custom")
            return prev.map((p) => (p.key === key ? { ...p, quantity: p.quantity + item.quantity } : p));
          return [...prev, { ...item, key: existing ? `${key}:${Date.now()}` : key }];
        }),
      updateQuantity: (key, quantity) =>
        setItems((prev) => prev.map((p) => (p.key === key ? { ...p, quantity: Math.max(1, quantity) } : p))),
      remove: (key) => setItems((prev) => prev.filter((p) => p.key !== key)),
      clear: () => setItems([]),
    };
  }, [items, ready]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
