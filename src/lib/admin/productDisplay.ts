import { LOW_STOCK_THRESHOLD } from "@/lib/db/types";
import type { ProductWithRelations } from "@/types";

/**
 * Display helpers for products in the admin (safe in the browser too).
 */

/** The boutique's product code from the name, e.g. "Handloom Cotton Salwarsuit - SC 11113" → "SC 11113". Replaced by the SKU field in Phase 2. */
export function productCode(name: string): string | null {
  const m = name.match(/\bSC[\s-]*(\d{3,6})\b/i);
  return m ? `SC ${m[1]}` : null;
}

/** Name without the trailing code, for a cleaner list ("Handloom Cotton Salwarsuit"). */
export function productTitle(name: string) {
  return name.replace(/\s*-?\s*\bSC[\s-]*\d{3,6}\b\s*$/i, "").trim() || name;
}

export type StockLevel = { kind: "made_to_order" } | { kind: "out" | "low" | "ok"; qty: number; unit: "pcs" | "m" };

export function stockLevel(p: ProductWithRelations): StockLevel {
  if (p.product_type === "custom_made" || p.is_preorder) return { kind: "made_to_order" };
  const qty = p.variants.length ? p.variants.reduce((s, v) => s + v.stock_qty, 0) : p.stock_qty;
  const unit = p.product_type === "running_material" ? "m" : "pcs";
  return { kind: qty <= 0 ? "out" : qty <= LOW_STOCK_THRESHOLD ? "low" : "ok", qty, unit };
}
