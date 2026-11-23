"use client";
import Link from "next/link";
import { Minus, Plus, X } from "lucide-react";
import { useCart, type CartItem } from "./CartProvider";
import { formatINR } from "@/lib/format";
import { lineTotal } from "@/lib/pricing";
import { SizingSummary } from "@/components/product/SizingSummary";
import { DispatchNote } from "@/components/product/DispatchNote";

/** One cart row. Shows stitching price + measurements (brief §8). */
export function CartLineItem({ item, readOnly = false }: { item: CartItem; readOnly?: boolean }) {
  const { updateQuantity, remove } = useCart();
  const t = lineTotal(item);
  const thumb = readOnly ? "w-16" : "w-24 md:w-28";

  return (
    <li className="flex gap-4 border-b border-sand py-5 md:gap-6">
      <Link href={`/product/${item.slug}`} className={`${thumb} relative shrink-0`}>
        <div className="aspect-[3/4] overflow-hidden bg-cream">
          {item.image && <img src={item.image} alt={item.name} className="h-full w-full object-cover" />}
        </div>
        {readOnly && (
          <span className="absolute -top-2 -right-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-muted px-1 text-[10px] text-white">
            {item.quantity}
          </span>
        )}
      </Link>

      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex justify-between gap-3">
          <Link href={`/product/${item.slug}`} className={`font-display leading-snug hover:text-maroon ${readOnly ? "text-base" : "text-lg"}`}>
            {item.name}
          </Link>
          <p className="shrink-0 text-sm font-medium">{formatINR(t.total)}</p>
        </div>
        <p className="text-xs text-muted">
          {formatINR(item.unitPrice)}
          {item.productType === "running_material" ? " / metre" : " each"}
          {item.size && ` · Size ${item.size}`}
          {item.lengthMetres && ` · ${item.lengthMetres} m`}
        </p>
        {item.stitching && <p className="text-xs text-maroon">+ Stitching {formatINR(item.stitchingCharge ?? 0)} each</p>}
        <SizingSummary sizing={item.sizing} />
        <DispatchNote type={item.dispatch} compact />

        {!readOnly && (
          <div className="flex items-center justify-between pt-2">
            {item.productType === "running_material" ? (
              <span className="text-xs text-muted">Length set on product page</span>
            ) : (
              <div className="inline-flex items-center rounded-[3px] border border-sand bg-white">
                <button type="button" aria-label="Decrease" className="px-3 py-2" onClick={() => updateQuantity(item.key, item.quantity - 1)}>
                  <Minus size={12} />
                </button>
                <span className="min-w-8 text-center text-sm">{item.quantity}</span>
                <button type="button" aria-label="Increase" className="px-3 py-2" onClick={() => updateQuantity(item.key, item.quantity + 1)}>
                  <Plus size={12} />
                </button>
              </div>
            )}
            <button type="button" onClick={() => remove(item.key)} className="flex items-center gap-1 text-xs text-muted hover:text-sale">
              <X size={14} /> Remove
            </button>
          </div>
        )}
      </div>
    </li>
  );
}
