/**
 * Pricing + dispatch rules. Pure functions, used by BOTH the browser (cart display)
 * and the server (create-order). The server result is the one that gets charged.
 */
import type { DispatchType, Product, ProductType, ShippingAddress, ShopSettings, Sizing } from "@/types";

export interface LineInput {
  productType: ProductType;
  unitPrice: number; // paise, per piece or per metre
  quantity: number;
  lengthMetres?: number | null;
  stitching?: boolean;
  stitchingCharge?: number; // paise per piece
}

export function lineTotal(l: LineInput) {
  const base =
    l.productType === "running_material"
      ? Math.round(l.unitPrice * (l.lengthMetres ?? 0)) * l.quantity
      : l.unitPrice * l.quantity;
  const stitching = l.stitching ? (l.stitchingCharge ?? 0) * l.quantity : 0;
  return { base, stitching, total: base + stitching };
}

/**
 * 48 hours for in-stock items; 45–60 days for pre-order, custom-made, and
 * unstitched suits with the stitching add-on (they are stitched to order).
 */
export function dispatchTypeFor(
  product: Pick<Product, "product_type" | "is_preorder">,
  opts: { stitching?: boolean },
): DispatchType {
  if (product.is_preorder) return "made_to_order";
  if (product.product_type === "custom_made") return "made_to_order";
  if (product.product_type === "unstitched" && opts.stitching) return "made_to_order";
  return "in_stock";
}

export function stitchingChargeFor(
  product: Pick<Product, "stitching_charge">,
  categorySlug: string,
  settings: ShopSettings,
) {
  return (
    product.stitching_charge ??
    settings.stitching_charge_by_category[categorySlug] ??
    settings.default_stitching_charge
  );
}

/**
 * Kerala = India Post's Kerala postal circle, decided by PIN code (670000–695999, which also covers
 * Lakshadweep). Without a valid PIN, falls back to the state name.
 */
export function isKeralaAddress(a: Pick<ShippingAddress, "state" | "pincode">) {
  const pin = (a.pincode ?? "").replace(/\s/g, "");
  if (/^[1-9]\d{5}$/.test(pin)) {
    const n = Number(pin);
    return n >= 670000 && n <= 695999;
  }
  return /kerala/i.test(a.state ?? "");
}

/**
 * Shipping for an order. India: a per-item rate (Kerala or rest of India) × number of items,
 * free at or above free_shipping_above. Abroad: the country's flat rate.
 * Returns null when the country is not shippable (no international rate configured).
 */
export function shippingFeeFor(
  to: Pick<ShippingAddress, "country" | "state" | "pincode">,
  subtotal: number,
  itemCount: number,
  settings: ShopSettings,
): number | null {
  if (to.country === "IN") {
    if (settings.free_shipping_above != null && subtotal >= settings.free_shipping_above) return 0;
    const rate = isKeralaAddress(to) ? settings.shipping_kerala_per_item : settings.shipping_india_per_item;
    return rate * Math.max(1, itemCount);
  }
  return settings.international_rates[to.country] ?? null;
}

export function describeSizing(sizing: Sizing | null | undefined) {
  if (!sizing) return null;
  if (sizing.mode === "standard") return `Size ${sizing.size}`;
  return "Custom measurements";
}
