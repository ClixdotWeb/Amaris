import "server-only";
import type { OrderWithItems, Product, ProductStatus, ProductVariant, ProductWithRelations } from "@/types";
import type { Page } from "../types";
import type { DevData } from "./store";

/* Small helpers shared by the dev store modules. */

export function paginate<T>(all: T[], page = 1, pageSize = 25): Page<T> {
  const p = Math.max(1, Math.floor(page));
  return { rows: all.slice((p - 1) * pageSize, p * pageSize), total: all.length, page: p, pageSize };
}

/** Total stock: sum of variants when the product has them. */
export function stockOf(d: DevData, id: string, own: number) {
  const vs = d.variants.filter((v) => v.product_id === id);
  return vs.length ? vs.reduce((s, v) => s + v.stock_qty, 0) : own;
}

export const statusOf = (p: Product): ProductStatus => p.status ?? (p.is_active ? "published" : "draft");

/** Keeps the storefront's is_active flag in step with status + soft delete. */
export function applyStatus(p: Product, status: ProductStatus) {
  p.status = status;
  p.is_active = status === "published" && !p.deleted_at;
}

export const variantLabel = (v: Pick<ProductVariant, "size" | "colour">) => [v.size, v.colour].filter(Boolean).join(" / ") || null;

export function withRelations(d: DevData, id: string): ProductWithRelations | null {
  const p = d.products.find((x) => x.id === id);
  if (!p) return null;
  const category = d.categories.find((c) => c.id === p.category_id)!;
  return {
    ...p,
    category,
    images: d.images.filter((i) => i.product_id === id).sort((a, b) => a.sort_order - b.sort_order),
    variants: d.variants.filter((v) => v.product_id === id),
  };
}

export function orderWithItems(d: DevData, id: string): OrderWithItems | null {
  const o = d.orders.find((x) => x.id === id);
  return o ? { ...o, items: d.order_items.filter((i) => i.order_id === id) } : null;
}

