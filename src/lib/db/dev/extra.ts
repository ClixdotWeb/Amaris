import "server-only";
import { randomUUID } from "node:crypto";
import type { Category, Coupon, OrderWithItems, ProductWithRelations, Review, StockMovement } from "@/types";
import { LOW_STOCK_THRESHOLD, type AdminDb, type CustomerRow, type ProductionRow, type StockRow } from "../types";
import { mutateStore, readStore, type DevCustomer, type DevData } from "./store";
import { orderWithItems, paginate, statusOf, variantLabel, withRelations } from "./helpers";
import { effectivePrice } from "@/lib/pricing";
import { SALE_STATUSES } from "@/lib/admin/orderStatus";
import { istDay } from "@/lib/admin/dates";

/**
 * Dev store for Phases 3–11: inventory, categories, collections, size guide, customers, coupons,
 * home page content, reviews, the stitching queue, reports, and the storefront's read-only views.
 */

const DAY = 86_400_000;
/** Made-to-order lines are due 60 days after the order was paid. */
export const PRODUCTION_DAYS = 60;

class StoreError extends Error {}

function uniqueSlugIn<T extends { id: string; slug: string }>(rows: T[], base: string, exceptId?: string) {
  const root = base || "item";
  let slug = root;
  for (let n = 2; rows.some((r) => r.slug === slug && r.id !== exceptId); n++) slug = `${root}-${n}`;
  return slug;
}

/** Swap an item with its neighbour in a list ordered by sort_order, then renumber 0…n. */
function moveIn<T extends { id: string; sort_order: number }>(rows: T[], id: string, dir: -1 | 1) {
  const list = [...rows].sort((a, b) => a.sort_order - b.sort_order);
  const i = list.findIndex((r) => r.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= list.length) return;
  [list[i], list[j]] = [list[j], list[i]];
  list.forEach((r, n) => (r.sort_order = n));
}

const isLive = (d: DevData, p: { status?: string; is_active: boolean; deleted_at?: string | null; category_id: string }) => {
  const cat = d.categories.find((c) => c.id === p.category_id);
  return statusOf(p as never) === "published" && !p.deleted_at && cat?.is_visible !== false;
};

/** What the storefront shows: sale price applied, regular price struck through. */
function toShop(p: ProductWithRelations): ProductWithRelations {
  const e = effectivePrice(p);
  return { ...p, price: e.price, compare_at_price: e.compareAt };
}

/* ───── Customers ───── */
function customerRow(d: DevData, c: DevCustomer): CustomerRow {
  const orders = d.orders.filter((o) => o.user_id === c.id);
  const paid = orders.filter((o) => SALE_STATUSES.includes(o.status));
  return {
    id: c.id,
    full_name: c.full_name,
    email: c.email,
    phone: c.phone,
    created_at: c.created_at,
    is_blocked: !!c.is_blocked,
    notes: c.notes ?? null,
    orders: orders.length,
    spent: paid.reduce((s, o) => s + o.total, 0),
    last_order_at: orders.map((o) => o.created_at).sort().at(-1) ?? null,
  };
}

/* ───── Stitching queue ───── */
const PRODUCTION_ORDER_STATUSES = ["paid", "processing"];
function productionRows(d: DevData): ProductionRow[] {
  const rows: ProductionRow[] = [];
  for (const o of d.orders) {
    if (!PRODUCTION_ORDER_STATUSES.includes(o.status)) continue;
    for (const item of d.order_items.filter((i) => i.order_id === o.id && i.dispatch_type === "made_to_order")) {
      rows.push({
        item: { ...item, production_status: item.production_status ?? "not_started" },
        order: { id: o.id, order_number: o.order_number, created_at: o.created_at, status: o.status, customer: o.shipping_address.full_name, phone: o.phone },
        due_at: new Date(new Date(o.created_at).getTime() + PRODUCTION_DAYS * DAY).toISOString(),
      });
    }
  }
  return rows.sort((a, b) => a.due_at.localeCompare(b.due_at));
}

/* ───── Inventory ───── */
function stockRows(d: DevData): StockRow[] {
  const rows: StockRow[] = [];
  for (const p of d.products) {
    if (p.deleted_at || p.product_type === "custom_made") continue;
    const cat = d.categories.find((c) => c.id === p.category_id);
    const imgs = d.images.filter((i) => i.product_id === p.id).sort((a, b) => a.sort_order - b.sort_order);
    const base = {
      productId: p.id,
      name: p.name,
      sku: p.sku ?? null,
      category: cat?.name ?? "",
      image: imgs[0] ? (imgs[0].thumb_url ?? imgs[0].url) : null,
      unit: (p.product_type === "running_material" ? "m" : "pcs") as StockRow["unit"],
      status: statusOf(p),
    };
    const vs = d.variants.filter((v) => v.product_id === p.id);
    if (vs.length) for (const v of vs) rows.push({ ...base, variantId: v.id, label: variantLabel(v), stock: v.stock_qty });
    else rows.push({ ...base, variantId: null, label: null, stock: p.stock_qty });
  }
  return rows;
}

export const extra: Pick<
  AdminDb,
  "categories" | "inventory" | "collections" | "sizeCharts" | "customers" | "coupons" | "content" | "reviews" | "production" | "reports" | "shop"
> = {
  categories: {
    async list() {
      return [...readStore().categories].sort((a, b) => a.sort_order - b.sort_order);
    },
    async save(input) {
      try {
        const id = mutateStore((d) => {
          const slug = uniqueSlugIn(d.categories, input.slug, input.id);
          if (input.id) {
            const c = d.categories.find((x) => x.id === input.id);
            if (!c) throw new StoreError("This category no longer exists.");
            // The product type decides the purchase options; it can't change once products use it
            if (c.product_type !== input.product_type && d.products.some((p) => p.category_id === c.id && !p.deleted_at))
              throw new StoreError("The product type can't change while the category has products.");
            Object.assign(c, { ...input, slug });
            return c.id;
          }
          const c: Category = {
            id: randomUUID(),
            name: input.name,
            slug,
            product_type: input.product_type,
            description: input.description,
            image_url: input.image_url,
            is_visible: input.is_visible,
            sort_order: d.categories.length,
          };
          d.categories.push(c);
          return c.id;
        });
        return { ok: true, id };
      } catch (e) {
        if (e instanceof StoreError) return { ok: false, error: e.message };
        throw e;
      }
    },
    async move(id, dir) {
      mutateStore((d) => moveIn(d.categories, id, dir));
    },
    async remove(id) {
      const d = readStore();
      const n = d.products.filter((p) => p.category_id === id).length;
      if (n) return { ok: false, error: `It still has ${n} product${n === 1 ? "" : "s"} (including deleted ones). Move them first.` };
      mutateStore((dd) => {
        dd.categories = dd.categories.filter((c) => c.id !== id);
        dd.categories.sort((a, b) => a.sort_order - b.sort_order).forEach((c, i) => (c.sort_order = i));
        dd.size_charts.forEach((s) => (s.category_slugs = s.category_slugs.filter((x) => d.categories.find((c) => c.id === id)?.slug !== x)));
      });
      return { ok: true };
    },
    async productCounts() {
      const out: Record<string, number> = {};
      for (const p of readStore().products) if (!p.deleted_at) out[p.category_id] = (out[p.category_id] ?? 0) + 1;
      return out;
    },
  },

  inventory: {
    async list(f) {
      const d = readStore();
      const q = f.q?.trim().toLowerCase();
      const cat = f.categorySlug ? d.categories.find((c) => c.slug === f.categorySlug) : null;
      const rows = stockRows(d)
        .filter((r) => !cat || r.category === cat.name)
        .filter((r) => !q || r.name.toLowerCase().includes(q) || (r.sku ?? "").toLowerCase().includes(q) || (r.label ?? "").toLowerCase().includes(q))
        .filter((r) =>
          f.stock === "out" ? r.stock <= 0 : f.stock === "low" ? r.stock > 0 && r.stock <= LOW_STOCK_THRESHOLD : f.stock === "in" ? r.stock > LOW_STOCK_THRESHOLD : true,
        )
        .sort((a, b) => a.name.localeCompare(b.name) || (a.label ?? "").localeCompare(b.label ?? ""));
      return paginate(rows, f.page, f.pageSize ?? 30);
    },
    async adjust(a, actor) {
      try {
        return mutateStore((d) => {
          const p = d.products.find((x) => x.id === a.productId && !x.deleted_at);
          if (!p) throw new StoreError("This product no longer exists.");
          const v = a.variantId ? d.variants.find((x) => x.id === a.variantId && x.product_id === p.id) : null;
          if (a.variantId && !v) throw new StoreError("This size / colour no longer exists.");
          const metres = p.product_type === "running_material";
          const before = v ? v.stock_qty : p.stock_qty;
          let after = a.mode === "set" ? a.amount : before + a.amount;
          after = metres ? Math.round(after * 10) / 10 : Math.round(after);
          if (after < 0) throw new StoreError(`That would take stock below zero (now ${before}).`);
          if (after > 100_000) throw new StoreError("That's more than 100,000.");
          if (after === before) throw new StoreError("Stock is already at that figure.");
          if (v) v.stock_qty = after;
          else p.stock_qty = after;
          const movement: StockMovement = {
            id: randomUUID(),
            product_id: p.id,
            product_name: p.name,
            variant_id: v?.id ?? null,
            label: v ? variantLabel(v) : null,
            change: Math.round((after - before) * 10) / 10,
            stock_after: after,
            reason: a.reason,
            note: a.note,
            actor_email: actor,
            created_at: new Date().toISOString(),
          };
          d.stock_movements.push(movement);
          return { ok: true as const, stock: after, movement };
        });
      } catch (e) {
        if (e instanceof StoreError) return { ok: false, error: e.message };
        throw e;
      }
    },
    async history(f) {
      const rows = readStore()
        .stock_movements.filter((m) => !f.productId || m.product_id === f.productId)
        .sort((a, b) => b.created_at.localeCompare(a.created_at));
      return paginate(rows, f.page, f.pageSize ?? 30);
    },
  },

  collections: {
    async list() {
      return [...readStore().collections].sort((a, b) => a.sort_order - b.sort_order);
    },
    async get(id) {
      return readStore().collections.find((c) => c.id === id) ?? null;
    },
    async save(input) {
      try {
        const id = mutateStore((d) => {
          const slug = uniqueSlugIn(d.collections, input.slug, input.id);
          const ids = [...new Set(input.product_ids)].filter((pid) => d.products.some((p) => p.id === pid));
          if (input.id) {
            const c = d.collections.find((x) => x.id === input.id);
            if (!c) throw new StoreError("This collection no longer exists.");
            Object.assign(c, { ...input, slug, product_ids: ids });
            return c.id;
          }
          const id = randomUUID();
          d.collections.push({ ...input, id, slug, product_ids: ids, sort_order: d.collections.length, created_at: new Date().toISOString() });
          return id;
        });
        return { ok: true, id };
      } catch (e) {
        if (e instanceof StoreError) return { ok: false, error: e.message };
        throw e;
      }
    },
    async move(id, dir) {
      mutateStore((d) => moveIn(d.collections, id, dir));
    },
    async remove(id) {
      mutateStore((d) => {
        d.collections = d.collections.filter((c) => c.id !== id);
        d.content.featured_collection_ids = d.content.featured_collection_ids.filter((x) => x !== id);
      });
    },
  },

  sizeCharts: {
    async list() {
      return readStore().size_charts;
    },
    async get(id) {
      return readStore().size_charts.find((s) => s.id === id) ?? null;
    },
    async save(input) {
      const id = mutateStore((d) => {
        // A category uses one chart: linking it here unlinks it from any other chart
        for (const s of d.size_charts) if (s.id !== input.id) s.category_slugs = s.category_slugs.filter((c) => !input.category_slugs.includes(c));
        if (input.id) {
          const s = d.size_charts.find((x) => x.id === input.id);
          if (s) {
            Object.assign(s, input);
            return s.id;
          }
        }
        const id = randomUUID();
        d.size_charts.push({ ...input, id });
        return id;
      });
      return { ok: true, id };
    },
    async remove(id) {
      mutateStore((d) => {
        d.size_charts = d.size_charts.filter((s) => s.id !== id);
      });
    },
  },

  customers: {
    async list(f) {
      const d = readStore();
      const q = f.q?.trim().toLowerCase();
      const digits = q?.replace(/\D/g, "");
      const rows = d.customers
        .map((c) => customerRow(d, c))
        .filter((c) => f.blocked === undefined || c.is_blocked === f.blocked)
        .filter((c) => !q || c.full_name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || (!!digits && digits.length >= 4 && c.phone.replace(/\D/g, "").includes(digits)))
        .sort((a, b) => (f.sort === "spent" ? b.spent - a.spent : f.sort === "orders" ? b.orders - a.orders : b.created_at.localeCompare(a.created_at)));
      return paginate(rows, f.page, f.pageSize ?? 25);
    },
    async get(id) {
      const d = readStore();
      const c = d.customers.find((x) => x.id === id);
      if (!c) return null;
      const orders = d.orders
        .filter((o) => o.user_id === id)
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .map((o) => orderWithItems(d, o.id)!) as OrderWithItems[];
      return { customer: customerRow(d, c), orders };
    },
    async update(id, patch) {
      return mutateStore((d) => {
        const c = d.customers.find((x) => x.id === id);
        if (!c) return null;
        if (patch.is_blocked !== undefined) c.is_blocked = patch.is_blocked;
        if (patch.notes !== undefined) c.notes = patch.notes;
        return customerRow(d, c);
      });
    },
  },

  coupons: {
    async list() {
      return [...readStore().coupons].sort((a, b) => b.created_at.localeCompare(a.created_at));
    },
    async get(id) {
      return readStore().coupons.find((c) => c.id === id) ?? null;
    },
    async findByCode(code) {
      const c = code.trim().toUpperCase();
      return readStore().coupons.find((x) => x.code === c) ?? null;
    },
    async save(input) {
      try {
        const id = mutateStore((d) => {
          const code = input.code.trim().toUpperCase();
          if (d.coupons.some((c) => c.code === code && c.id !== input.id)) throw new StoreError(`The code ${code} is already used by another coupon.`);
          if (input.id) {
            const c = d.coupons.find((x) => x.id === input.id);
            if (!c) throw new StoreError("This coupon no longer exists.");
            Object.assign(c, { ...input, code });
            return c.id;
          }
          const c: Coupon = { ...input, code, id: randomUUID(), used_count: 0, created_at: new Date().toISOString() };
          d.coupons.push(c);
          return c.id;
        });
        return { ok: true, id };
      } catch (e) {
        if (e instanceof StoreError) return { ok: false, error: e.message };
        throw e;
      }
    },
    async remove(id) {
      mutateStore((d) => {
        d.coupons = d.coupons.filter((c) => c.id !== id);
      });
    },
  },

  content: {
    async get() {
      return readStore().content;
    },
    async save(c) {
      mutateStore((d) => {
        d.content = c;
      });
    },
  },

  reviews: {
    async list(f) {
      const d = readStore();
      const rows = d.reviews
        .filter((r) => !f.status || r.status === f.status)
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .map((r) => {
          const p = d.products.find((x) => x.id === r.product_id);
          return { ...r, product_name: p?.name ?? "Deleted product", product_slug: p && !p.deleted_at ? p.slug : null };
        });
      return paginate(rows, f.page, f.pageSize ?? 25);
    },
    async setStatus(id, status) {
      return mutateStore((d) => {
        const r = d.reviews.find((x) => x.id === id);
        if (!r) return null;
        r.status = status;
        return r;
      });
    },
    async remove(id) {
      return mutateStore((d) => {
        const r = d.reviews.find((x) => x.id === id) ?? null;
        d.reviews = d.reviews.filter((x) => x.id !== id);
        return r;
      });
    },
    async counts() {
      const out: Record<Review["status"], number> = { pending: 0, approved: 0, hidden: 0 };
      for (const r of readStore().reviews) out[r.status]++;
      return out;
    },
  },

  production: {
    async list(f) {
      const rows = productionRows(readStore()).filter((r) => !f.status || r.item.production_status === f.status);
      return paginate(rows, f.page, f.pageSize ?? 30);
    },
    async get(itemId) {
      const d = readStore();
      const item = d.order_items.find((i) => i.id === itemId);
      const o = item && d.orders.find((x) => x.id === item.order_id);
      if (!item || !o || item.dispatch_type !== "made_to_order") return null;
      return {
        item: { ...item, production_status: item.production_status ?? "not_started" },
        order: { id: o.id, order_number: o.order_number, created_at: o.created_at, status: o.status, customer: o.shipping_address.full_name, phone: o.phone },
        due_at: new Date(new Date(o.created_at).getTime() + PRODUCTION_DAYS * DAY).toISOString(),
      };
    },
    async update(itemId, patch) {
      const ok = mutateStore((d) => {
        const item = d.order_items.find((i) => i.id === itemId && i.dispatch_type === "made_to_order");
        if (!item) return false;
        Object.assign(item, patch);
        return true;
      });
      return ok ? extra.production.get(itemId) : null;
    },
    async counts() {
      const out = { not_started: 0, cutting: 0, stitching: 0, ready: 0 };
      for (const r of productionRows(readStore())) out[r.item.production_status ?? "not_started"]++;
      return out;
    },
  },

  reports: {
    async sales(fromIso, toIso) {
      const d = readStore();
      const orders = d.orders.filter((o) => SALE_STATUSES.includes(o.status) && o.created_at >= fromIso && o.created_at <= toIso);
      const ids = new Set(orders.map((o) => o.id));
      const items = d.order_items.filter((i) => ids.has(i.order_id));

      const days = new Map<string, { revenue: number; orders: number }>();
      for (let t = new Date(fromIso).getTime(); t <= new Date(toIso).getTime(); t += DAY) days.set(istDay(new Date(t).toISOString()), { revenue: 0, orders: 0 });
      days.set(istDay(toIso), days.get(istDay(toIso)) ?? { revenue: 0, orders: 0 });
      for (const o of orders) {
        const k = istDay(o.created_at);
        const v = days.get(k) ?? { revenue: 0, orders: 0 };
        v.revenue += o.total;
        v.orders++;
        days.set(k, v);
      }

      const byProduct = new Map<string, { id: string | null; name: string; qty: number; revenue: number }>();
      const byCategory = new Map<string, { name: string; qty: number; revenue: number }>();
      const bySize = new Map<string, number>();
      for (const i of items) {
        const key = i.product_id ?? i.product_name;
        const qty = i.product_type === "running_material" ? (i.length_metres ?? 0) * i.quantity : i.quantity;
        const p = byProduct.get(key) ?? { id: i.product_id, name: i.product_name, qty: 0, revenue: 0 };
        p.qty += qty;
        p.revenue += i.line_total;
        byProduct.set(key, p);
        const prod = d.products.find((x) => x.id === i.product_id);
        const cat = d.categories.find((c) => c.id === prod?.category_id)?.name ?? "Other";
        const c = byCategory.get(cat) ?? { name: cat, qty: 0, revenue: 0 };
        c.qty += i.quantity;
        c.revenue += i.line_total;
        byCategory.set(cat, c);
        const size = i.size ?? (i.sizing?.mode === "standard" ? i.sizing.size : i.sizing ? "Custom" : null);
        if (size) bySize.set(size, (bySize.get(size) ?? 0) + i.quantity);
      }

      const revenue = orders.reduce((s, o) => s + o.total, 0);
      return {
        kpis: {
          revenue,
          orders: orders.length,
          aov: orders.length ? Math.round(revenue / orders.length) : 0,
          items: items.reduce((s, i) => s + i.quantity, 0),
          stitching: orders.reduce((s, o) => s + o.stitching_total, 0),
        },
        byDay: [...days.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([day, v]) => ({ day, ...v })),
        byProduct: [...byProduct.values()].sort((a, b) => b.revenue - a.revenue),
        byCategory: [...byCategory.values()].sort((a, b) => b.revenue - a.revenue),
        bySize: [...bySize.entries()].map(([size, qty]) => ({ size, qty })).sort((a, b) => b.qty - a.qty),
      };
    },
  },

  shop: {
    async products(f) {
      const d = readStore();
      const col = f.collectionSlug ? d.collections.find((c) => c.slug === f.collectionSlug && c.is_active) : null;
      if (f.collectionSlug && !col) return { products: [], count: 0 };
      const q = f.query?.toLowerCase().trim();
      const cats = new Map(d.categories.map((c) => [c.id, c]));
      const inCol = col ? new Set(col.product_ids) : null;
      // Filter and sort the plain rows first; photos and sizes are added only for the page shown (much faster)
      const list = d.products.filter((p) => {
        if (!isLive(d, p)) return false;
        const cat = cats.get(p.category_id);
        if (f.categorySlug && cat?.slug !== f.categorySlug) return false;
        if (f.newArrivals && !p.is_new_arrival) return false;
        if (f.hotDeals && !p.is_hot_deal) return false;
        if (f.premium && !p.is_premium) return false;
        if (inCol && !inCol.has(p.id)) return false;
        if (q && !p.name.toLowerCase().includes(q) && !(cat?.name ?? "").toLowerCase().includes(q) && !(p.tags ?? []).some((t) => t.toLowerCase().includes(q))) return false;
        return true;
      });
      const price = (p: (typeof list)[number]) => effectivePrice(p).price;
      list.sort((x, y) =>
        f.sort === "price_asc"
          ? price(x) - price(y)
          : f.sort === "price_desc"
            ? price(y) - price(x)
            : col && !f.sort
              ? col.product_ids.indexOf(x.id) - col.product_ids.indexOf(y.id)
              : y.created_at.localeCompare(x.created_at),
      );
      const offset = f.offset ?? 0;
      const page = list.slice(offset, offset + (f.limit ?? 24));
      return { products: page.map((p) => toShop(withRelations(d, p.id)!)), count: list.length };
    },
    async productBySlug(slug) {
      const d = readStore();
      const p = d.products.find((x) => x.slug === slug && isLive(d, x));
      return p ? toShop(withRelations(d, p.id)!) : null;
    },
    async productsByIds(ids) {
      const d = readStore();
      return d.products.filter((p) => ids.includes(p.id) && isLive(d, p)).map((p) => toShop(withRelations(d, p.id)!));
    },
    async categories() {
      return readStore()
        .categories.filter((c) => c.is_visible !== false)
        .sort((a, b) => a.sort_order - b.sort_order);
    },
    async collections() {
      return readStore()
        .collections.filter((c) => c.is_active)
        .sort((a, b) => a.sort_order - b.sort_order);
    },
    async collectionBySlug(slug) {
      return readStore().collections.find((c) => c.slug === slug && c.is_active) ?? null;
    },
    async sizeChartFor(categorySlug) {
      return readStore().size_charts.find((s) => s.category_slugs.includes(categorySlug)) ?? null;
    },
    async reviewsFor(productId) {
      return readStore()
        .reviews.filter((r) => r.product_id === productId && r.status === "approved")
        .sort((a, b) => b.created_at.localeCompare(a.created_at));
    },
    async addReview(r) {
      mutateStore((d) => {
        d.reviews.push({ ...r, id: randomUUID(), status: "pending", created_at: new Date().toISOString() });
      });
    },
    async createOrder(o) {
      return mutateStore((d) => {
        const email = o.email.trim().toLowerCase();
        let customer = d.customers.find((c) => c.email.toLowerCase() === email);
        if (!customer) {
          customer = { id: randomUUID(), full_name: o.full_name, email, phone: o.phone, created_at: new Date().toISOString(), is_blocked: false, notes: null };
          d.customers.push(customer);
        }
        const next = Math.max(1000, ...d.orders.map((x) => Number(x.order_number.replace(/\D/g, "")) || 0)) + 1;
        const id = randomUUID();
        const order_number = `AMR${next}`;
        d.orders.push({
          id,
          order_number,
          user_id: customer.id,
          email,
          phone: o.phone,
          shipping_address: o.shipping_address,
          status: "pending_payment",
          subtotal: o.subtotal,
          stitching_total: o.stitching_total,
          shipping_fee: o.shipping_fee,
          discount: o.discount,
          coupon_code: o.coupon_code,
          total: o.total,
          is_international: o.is_international,
          razorpay_order_id: null,
          razorpay_payment_id: null,
          carrier: o.is_international ? null : "India Post",
          consignment_number: null,
          dispatched_at: null,
          policies_accepted_at: new Date().toISOString(),
          customer_notes: o.customer_notes,
          admin_notes: null,
          created_at: new Date().toISOString(),
        });
        for (const it of o.items)
          d.order_items.push({ ...it, id: randomUUID(), order_id: id, ...(it.dispatch_type === "made_to_order" ? { production_status: "not_started" as const } : {}) });
        return { id, order_number };
      });
    },
    async payOrder(id, paymentRef, cod) {
      const paid = mutateStore((d) => {
        const o = d.orders.find((x) => x.id === id);
        if (!o || o.status !== "pending_payment") return false;
        // Cash on delivery: confirmed now, the money is collected by India Post on delivery
        o.status = "paid";
        o.payment_method = cod ? "cod" : "online";
        o.razorpay_payment_id = cod ? null : paymentRef;
        if (cod?.fee) {
          o.cod_fee = cod.fee;
          o.total += cod.fee;
        }
        o.created_at = new Date().toISOString(); // counts as today's sale
        // Same rule as restock() in index.ts, the other way round: variants match on size and colour
        for (const it of d.order_items.filter((i) => i.order_id === id && i.product_id)) {
          const p = d.products.find((x) => x.id === it.product_id);
          if (!p) continue;
          const amount = it.product_type === "running_material" ? (it.length_metres ?? 0) * it.quantity : it.quantity;
          const vs = d.variants.filter((v) => v.product_id === p.id);
          const bySize = vs.some((v) => v.size);
          const byColour = vs.some((v) => v.colour);
          const v = vs.length ? vs.find((x) => (!bySize || x.size === (it.size ?? "")) && (!byColour || (x.colour ?? null) === (it.colour ?? null))) : null;
          if (!v && !(it.product_type === "running_material" || it.dispatch_type === "in_stock")) continue;
          const before = v ? v.stock_qty : p.stock_qty;
          const after = Math.max(0, Math.round((before - amount) * 10) / 10);
          if (v) {
            v.stock_qty = after;
            p.stock_qty = vs.reduce((sum, x) => sum + x.stock_qty, 0);
          } else p.stock_qty = after;
          d.stock_movements.push({
            id: randomUUID(),
            product_id: p.id,
            product_name: p.name,
            variant_id: v?.id ?? null,
            label: v ? variantLabel(v) : null,
            change: Math.round((after - before) * 10) / 10,
            stock_after: after,
            reason: "sale",
            note: o.order_number,
            actor_email: null,
            created_at: new Date().toISOString(),
          });
        }
        if (o.coupon_code) {
          const c = d.coupons.find((x) => x.code === o.coupon_code);
          if (c) c.used_count++;
        }
        return true;
      });
      return paid ? orderWithItems(readStore(), id) : null;
    },
  },
};
