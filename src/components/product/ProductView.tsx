"use client";
import { createContext, useContext, useState } from "react";

/** Shares the photo on show between the gallery and the purchase form (colour picker ↔ gallery). */
const Ctx = createContext<{ image: number; setImage: (i: number) => void } | null>(null);

export function ProductView({ children }: { children: React.ReactNode }) {
  const [image, setImage] = useState(0);
  return <Ctx.Provider value={{ image, setImage }}>{children}</Ctx.Provider>;
}

/** Falls back to local state when used outside <ProductView>. */
export function useProductImage() {
  const ctx = useContext(Ctx);
  const [local, setLocal] = useState(0);
  return ctx ?? { image: local, setImage: setLocal };
}
