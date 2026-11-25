import "server-only";
import { randomUUID } from "node:crypto";
import type { AdminAccount, OrderWithItems, Product, ProductStatus, ProductVariant, ProductWithRelations } from "@/types";
import { LOW_STOCK_THRESHOLD, type AdminDb, type AdminWithSecret, type LowStockRow, type Page, type ProductInput, type ProductSort } from "../types";
import { mutateStore, readStore, type DevData } from "./store";

const MAX_IMAGES = 15;

function paginate<T>(all: T[], page = 1, pageSize = 25): Page<T> {
  const p = Math.max(1, Math.floor(page));
  return { rows: all.slice((p - 1) * pageSize, p * pageSize), total: all.length, page: p, pageSize };
}

/** Total stock: sum of variants when the product has them. */
function stockOf(d: DevData, id: string, own: number) {
  const vs = d.variants.filter((v) => v.product_id === id);
  return vs.length ? vs.reduce((s, v) => s + v.stock_qty, 0) : own;
}

const statusOf = (p: Product): ProductStatus => p.status ?? (p.is_active ? "published" : "draft");

/** Keeps the storefront's is_active flag in step with status + soft delete. */
function applyStatus(p: Product, status: ProductStatus) {
  p.status = status;
  p.is_active = status === "published" && !p.deleted_at;
}

const variantLabel = (v: Pick<ProductVariant, "size" | "colour">) => [v.size, v.colour].filter(Boolean).join(" / ") || null;

function productSorter(d: DevData, sort: ProductSort = "newest") {
  const by: Record<ProductSort, (a: Product, b: Product) => number> = {
    newest: (a, b) => b.created_at.localeCompare(a.created_at),
    oldest: (a, b) => a.created_at.localeCompare(b.created_at),
    name: (a, b) => a.name.localeCompare(b.name),
    price_asc: (a, b) => a.price - b.price,
    price_desc: (a, b) => b.price - a.price,
    stock_asc: (a, b) => stockOf(d, a.id, a.stock_qty) - stockOf(d, b.id, b.stock_qty),
    stock_desc: (a, b) => stockOf(d, b.id, b.stock_qty) - stockOf(d, a.id, a.stock_qty),
  };
  return (a: Product, b: Product) => by[sort](a, b) || b.created_at.localeCompare(a.created_at);
}

function withRelations(d: DevData, id: string): ProductWithRelations | null {
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

function orderWithItems(d: DevData, id: string): OrderWithItems | null {
  const o = d.orders.find((x) => x.id === id);
  return o ? { ...o, items: d.order_items.filter((i) => i.order_id === id) } : null;
}

/** Same rule as the SQL function decrement_stock_for_order, in reverse. Variants match on size and colour. */
function restock(d: DevData, orderId: string) {
  for (const it of d.order_items.filter((i) => i.order_id === orderId && i.product_id)) {
    const p = d.products.find((x) => x.id === it.product_id);
    if (!p) continue;
    const vs = d.variants.filter((v) => v.product_id === p.id);
    const amount = it.product_type === "running_material" ? (it.length_metres ?? 0) * it.quantity : it.quantity;
    if (vs.length) {
      const bySize = vs.some((v) => v.size);
      const byColour = vs.some((v) => v.colour);
      const v = vs.find((x) => (!bySize || x.size === (it.size ?? "")) && (!byColour || (x.colour ?? null) === (it.colour ?? null)));
      if (v) {
        v.stock_qty += amount;
        p.stock_qty = vs.reduce((s, x) => s + x.stock_qty, 0);
        continue;
      }
    }
    if (it.product_type === "running_material" || it.dispatch_type === "in_stock") p.stock_qty += amount;
  }
}

/** Unique slug: base, base-2, base-3… */
function uniqueSlug(d: DevData, base: string, exceptId?: string) {
  let slug = base;
  for (let n = 2; d.products.some((p) => p.slug === slug && p.id !== exceptId); n++) slug = `${base}-${n}`;
  return slug;
}

export const devDb: AdminDb = {
  categories: {
    async list() {
      return [...readStore().categories].sort((a, b) => a.sort_order - b.sort_order);
    },
  },

  products: {
    async list(f) {
      const d = readStore();
      const q = f.q?.trim().toLowerCase();
      const qCode = q?.replace(/[\s-]/g, "");
      const cat = f.categorySlug ? d.categories.find((c) => c.slug === f.categorySlug) : null;
      const ids = d.products
        .filter((p) => (f.status === "deleted" ? !!p.deleted_at : !p.deleted_at))
        .filter((p) => !f.status || f.status === "deleted" || statusOf(p) === f.status)
        .filter(
          (p) =>
            !q ||
            p.name.toLowerCase().includes(q) ||
            p.slug.includes(q) ||
            (!!qCode && (p.sku ?? "").toLowerCase().replace(/[\s-]/g, "").includes(qCode)) ||
            (p.tags ?? []).some((t) => t.toLowerCase().includes(q)),
        )
        .filter((p) => !f.categorySlug || p.category_id === cat?.id)
        .filter((p) => !f.stitching || (p.product_type === "unstitched" && p.stitching_available === (f.stitching === "on")))
        .filter((p) => !f.flag || (f.flag === "new" ? p.is_new_arrival : f.flag === "deal" ? p.is_hot_deal : p.is_premium))
        .filter((p) => {
          if (!f.stock) return true;
          if (p.product_type === "custom_made" || p.is_preorder) return false; // made to order: no stock
          const qty = stockOf(d, p.id, p.stock_qty);
          return f.stock === "out" ? qty <= 0 : qty > 0 && qty <= LOW_STOCK_THRESHOLD;
        })
        .sort(productSorter(d, f.sort))
        .map((p) => p.id);
      const page = paginate(ids, f.page, f.pageSize);
      return { ...page, rows: page.rows.map((id) => withRelations(d, id)!) };
    },

    async get(id) {
      return withRelations(readStore(), id);
    },

    async save(input: ProductInput, newImages) {
      try {
        return mutateStore((d) => {
          const category = d.categories.find((c) => c.id === input.category_id);
          if (!category) throw new SaveError("Unknown category.");
          if (d.products.some((p) => p.slug === input.slug && p.id !== input.id)) throw new SaveError("That web address is already used by another product.");
          // Codes must be unique when set or changed (older catalogue items may share one; they can still be saved unchanged)
          const prevSku = input.id ? d.products.find((p) => p.id === input.id)?.sku ?? null : null;
          const skuChanged = (input.sku ?? "").toLowerCase() !== (prevSku ?? "").toLowerCase();
          if (input.sku && skuChanged && d.products.some((p) => p.id !== input.id && !p.deleted_at && (p.sku ?? "").toLowerCase() === input.sku!.toLowerCase()))
            throw new SaveError(`Product code ${input.sku} is already used by another product.`);
          const variantSkus = input.variants.map((v) => v.sku).filter((s): s is string => !!s);
          if (new Set(variantSkus.map((s) => s.toLowerCase())).size !== variantSkus.length) throw new SaveError("Two variants have the same SKU.");

          const now = new Date().toISOString();
          const existing = input.id ? d.products.find((p) => p.id === input.id) : undefined;
          if (input.id && !existing) throw new SaveError("Product not found.");
          const id = existing?.id ?? randomUUID();
          const hasVariants = input.variants.length > 0 && category.product_type !== "custom_made";

          const row: Product = {
            id,
            slug: input.slug,
            name: input.name,
            sku: input.sku,
            description: input.description,
            category_id: category.id,
            product_type: category.product_type,
            price: input.price,
            compare_at_price: null, // replaced by sale_price (kept for the storefront's preview data)
            sale_price: input.sale_price,
            sale_starts_at: input.sale_starts_at,
            sale_ends_at: input.sale_ends_at,
            sizes: input.sizes,
            colours: input.colours,
            stock_qty: hasVariants ? input.variants.reduce((s, v) => s + v.stock_qty, 0) : input.stock_qty,
            tags: input.tags,
            meta_title: input.meta_title,
            meta_description: input.meta_description,
            is_preorder: input.is_preorder,
            is_new_arrival: input.is_new_arrival,
            is_hot_deal: input.is_hot_deal,
            is_premium: input.is_premium,
            is_active: false,
            status: input.status,
            deleted_at: existing?.deleted_at ?? null,
            stitching_available: category.product_type === "unstitched" && input.stitching_available,
            stitching_charge: input.stitching_charge,
            min_metres: input.min_metres,
            metre_step: input.metre_step,
            fabric: input.fabric,
            care_instructions: input.care_instructions,
            created_at: existing?.created_at ?? now,
            updated_at: now,
          };
          applyStatus(row, input.status);
          if (existing) Object.assign(existing, row);
          else d.products.push(row);

          // Variants: replaced as a whole, keeping ids of lines that stay (same size + colour)
          const old = d.variants.filter((v) => v.product_id === id);
          d.variants = d.variants.filter((v) => v.product_id !== id);
          if (hasVariants)
            for (const v of input.variants)
              d.variants.push({
                id: old.find((o) => o.size === v.size && (o.colour ?? null) === v.colour)?.id ?? randomUUID(),
                product_id: id,
                size: v.size,
                colour: v.colour,
                stock_qty: v.stock_qty,
                sku: v.sku,
                price: v.price,
              });

          const current = d.images.filter((i) => i.product_id === id);
          if (current.length + newImages.length > MAX_IMAGES) throw new SaveError(`A product can have at most ${MAX_IMAGES} photos.`);
          let order = current.reduce((m, i) => Math.max(m, i.sort_order + 1), 0);
          for (const img of newImages)
            d.images.push({
              id: randomUUID(),
              product_id: id,
              storage_path: img.public_id,
              public_id: img.public_id,
              url: img.url,
              thumb_url: img.thumb_url,
              alt: img.alt,
              sort_order: order++,
            });

          return { ok: true as const, id };
        });
      } catch (e) {
        if (e instanceof SaveError) return { ok: false, error: e.message };
        throw e;
      }
    },

    async setStatus(id, status) {
      mutateStore((d) => {
        const p = d.products.find((x) => x.id === id);
        if (p) {
          applyStatus(p, status);
          p.updated_at = new Date().toISOString();
        }
      });
    },

    async duplicate(id) {
      return mutateStore((d) => {
        const src = d.products.find((x) => x.id === id);
        if (!src) return { ok: false as const, error: "Product not found." };
        const now = new Date().toISOString();
        const copyId = randomUUID();
        const copy: Product = {
          ...structuredClone(src),
          id: copyId,
          name: `${src.name} (copy)`,
          slug: uniqueSlug(d, `${src.slug}-copy`),
          sku: null, // codes must be unique: set the new one when editing
          deleted_at: null,
          created_at: now,
          updated_at: now,
        };
        applyStatus(copy, "draft");
        d.products.push(copy);
        for (const v of d.variants.filter((x) => x.product_id === id)) d.variants.push({ ...v, id: randomUUID(), product_id: copyId, sku: null });
        // Photos point at the same Cloudinary files; a file is only deleted when no product uses it any more
        for (const img of d.images.filter((x) => x.product_id === id)) d.images.push({ ...img, id: randomUUID(), product_id: copyId });
        return { ok: true as const, id: copyId };
      });
    },

    async softDelete(id) {
      mutateStore((d) => {
        const p = d.products.find((x) => x.id === id);
        if (!p) return;
        p.deleted_at = new Date().toISOString();
        applyStatus(p, statusOf(p));
      });
    },

    async restore(id) {
      mutateStore((d) => {
        const p = d.products.find((x) => x.id === id);
        if (!p) return;
        p.deleted_at = null;
        applyStatus(p, statusOf(p) === "published" ? "draft" : statusOf(p)); // comes back hidden; publish when ready
        p.updated_at = new Date().toISOString();
      });
    },

    async bulk(ids, action) {
      return mutateStore((d) => {
        const skipped: { id: string; reason: string }[] = [];
        let changed = 0;
        const now = new Date().toISOString();
        for (const id of ids) {
          const p = d.products.find((x) => x.id === id);
          if (!p) {
            skipped.push({ id, reason: "not found" });
            continue;
          }
          switch (action.kind) {
            case "status":
              applyStatus(p, action.status);
              break;
            case "flag":
              p[action.flag] = action.on;
              break;
            case "stitching":
              if (p.product_type !== "unstitched") {
                skipped.push({ id, reason: "not an unstitched suit" });
                continue;
              }
              p.stitching_available = action.on;
              break;
            case "price": {
              const next = action.mode === "set" ? action.value : Math.round((p.price * (100 + action.value)) / 100);
              if (next < 0) {
                skipped.push({ id, reason: "price would go below zero" });
                continue;
              }
              p.price = Math.round(next / 100) * 100; // whole rupees
              if (p.sale_price != null && p.sale_price >= p.price) p.sale_price = null; // a "sale" must be lower
              break;
            }
            case "delete":
              p.deleted_at = now;
              applyStatus(p, statusOf(p));
              break;
            case "restore":
              p.deleted_at = null;
              applyStatus(p, statusOf(p) === "published" ? "draft" : statusOf(p));
              break;
          }
          p.updated_at = now;
          changed++;
        }
        return { changed, skipped };
      });
    },

    async reorderImages(productId, imageIds) {
      return mutateStore((d) => {
        const imgs = d.images.filter((i) => i.product_id === productId).sort((a, b) => a.sort_order - b.sort_order);
        if (imgs.length !== imageIds.length || !imgs.every((i) => imageIds.includes(i.id))) return false;
        const p = d.products.find((x) => x.id === productId);
        // colour → photo links are by position; remember which photo each colour pointed at
        const colourImage = (p?.colours ?? []).map((c) => (c.image_index != null ? imgs[c.image_index]?.id ?? null : null));
        imageIds.forEach((iid, i) => {
          d.images.find((x) => x.id === iid)!.sort_order = i;
        });
        if (p?.colours)
          p.colours = p.colours.map((c, i) => ({ ...c, image_index: colourImage[i] ? imageIds.indexOf(colourImage[i]!) : c.image_index }));
        return true;
      });
    },

    async publicIdInUse(publicId) {
      return readStore().images.some((i) => i.public_id === publicId);
    },

    async setStitching(id, available) {
      return mutateStore((d) => {
        const p = d.products.find((x) => x.id === id);
        if (!p || p.product_type !== "unstitched") return false;
        p.stitching_available = available;
        p.updated_at = new Date().toISOString();
        return true;
      });
    },

    async deleteImage(id) {
      return mutateStore((d) => {
        const img = d.images.find((i) => i.id === id) ?? null;
        if (!img) return null;
        const p = d.products.find((x) => x.id === img.product_id);
        const siblings = d.images.filter((i) => i.product_id === img.product_id).sort((a, b) => a.sort_order - b.sort_order);
        const removedIndex = siblings.findIndex((i) => i.id === id);
        d.images = d.images.filter((i) => i.id !== id);
        // keep colour → photo links pointing at the same photos
        if (p?.colours)
          p.colours = p.colours.map((c) =>
            c.image_index == null ? c : { ...c, image_index: c.image_index === removedIndex ? null : c.image_index > removedIndex ? c.image_index - 1 : c.image_index },
          );
        return img;
      });
    },

    async lowStock(threshold) {
      const d = readStore();
      const rows: LowStockRow[] = [];
      for (const p of d.products) {
        if (!p.is_active || p.is_preorder || p.product_type === "custom_made") continue;
        const unit = p.product_type === "running_material" ? "m" : "pcs";
        const vs = d.variants.filter((v) => v.product_id === p.id);
        const first = d.images.filter((i) => i.product_id === p.id).sort((x, y) => x.sort_order - y.sort_order)[0];
        const extra = { image: first ? (first.thumb_url ?? first.url) : null, category: d.categories.find((c) => c.id === p.category_id)?.name ?? null };
        if (vs.length) {
          for (const v of vs) if (v.stock_qty <= threshold) rows.push({ productId: p.id, name: p.name, size: variantLabel(v), stock: v.stock_qty, unit, ...extra });
        } else if (p.stock_qty <= threshold) {
          rows.push({ productId: p.id, name: p.name, size: null, stock: p.stock_qty, unit, ...extra });
        }
      }
      return rows.sort((a, b) => a.stock - b.stock);
    },
  },

  orders: {
    async list(f) {
      const d = readStore();
      const q = f.q?.trim().toLowerCase();
      const digits = q?.replace(/\D/g, "");
      const ids = d.orders
        .filter((o) => !f.status || o.status === f.status)
        .filter(
          (o) =>
            !q ||
            o.order_number.toLowerCase().includes(q) ||
            o.email.toLowerCase().includes(q) ||
            o.shipping_address.full_name.toLowerCase().includes(q) ||
            (!!digits && digits.length >= 4 && o.phone.replace(/\D/g, "").includes(digits)),
        )
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .map((o) => o.id);
      const page = paginate(ids, f.page, f.pageSize);
      return { ...page, rows: page.rows.map((id) => orderWithItems(d, id)!) };
    },

    async get(id) {
      return orderWithItems(readStore(), id);
    },

    async createdSince(iso) {
      const d = readStore();
      return d.orders
        .filter((o) => o.created_at >= iso)
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .map((o) => orderWithItems(d, o.id)!);
    },

    async countByStatus(statuses) {
      return readStore().orders.filter((o) => statuses.includes(o.status)).length;
    },

    async update(id, patch) {
      return mutateStore((d) => {
        const o = d.orders.find((x) => x.id === id);
        if (!o) return null;
        Object.assign(o, patch);
        return orderWithItems(d, id);
      });
    },

    async restoreStock(id) {
      return mutateStore((d) => {
        const o = d.orders.find((x) => x.id === id);
        if (!o || o.stock_restored_at) return false;
        restock(d, id);
        o.stock_restored_at = new Date().toISOString();
        return true;
      });
    },
  },

  settings: {
    async get() {
      return readStore().settings;
    },
    async save(s) {
      mutateStore((d) => {
        d.settings = s;
      });
    },
  },

  admins: {
    async list() {
      return readStore()
        .admins.map(publicAdmin)
        .sort((a, b) => a.created_at.localeCompare(b.created_at));
    },
    async count() {
      return readStore().admins.length;
    },
    async findByEmail(email) {
      const e = email.trim().toLowerCase();
      return readStore().admins.find((a) => a.email === e) ?? null;
    },
    async add(a) {
      try {
        return mutateStore((d) => {
          const email = a.email.trim().toLowerCase();
          if (d.admins.some((x) => x.email === email)) throw new SaveError("That email is already an admin.");
          const id = randomUUID();
          d.admins.push({ ...a, id, email, created_at: new Date().toISOString(), last_login_at: null });
          return { ok: true as const, id };
        });
      } catch (e) {
        if (e instanceof SaveError) return { ok: false, error: e.message };
        throw e;
      }
    },
    async remove(id) {
      try {
        return mutateStore((d) => {
          const target = d.admins.find((a) => a.id === id);
          if (!target) throw new SaveError("Admin not found.");
          if (d.admins.length <= 1) throw new SaveError("You can't remove the last admin.");
          d.admins = d.admins.filter((a) => a.id !== id);
          return { ok: true as const, removed: publicAdmin(target) };
        });
      } catch (e) {
        if (e instanceof SaveError) return { ok: false, error: e.message };
        throw e;
      }
    },
    async touchLogin(id) {
      mutateStore((d) => {
        const a = d.admins.find((x) => x.id === id);
        if (a) a.last_login_at = new Date().toISOString();
      });
    },
  },

  activity: {
    async log(e) {
      mutateStore((d) => {
        d.activity.push({ ...e, id: randomUUID(), created_at: new Date().toISOString() });
      });
    },
    async list(f) {
      const rows = readStore()
        .activity.filter((a) => !f.actor || a.actor_email === f.actor)
        .filter((a) => !f.entityType || a.entity_type === f.entityType)
        .filter((a) => !f.entityId || a.entity_id === f.entityId)
        .filter((a) => !f.from || a.created_at >= f.from)
        .filter((a) => !f.to || a.created_at <= f.to)
        .sort((a, b) => b.created_at.localeCompare(a.created_at));
      return paginate(rows, f.page, f.pageSize);
    },
    async actors() {
      return [...new Set(readStore().activity.map((a) => a.actor_email).filter((x): x is string => !!x))].sort();
    },
  },
};

function publicAdmin(a: AdminWithSecret): AdminAccount {
  const { password_hash: _secret, ...rest } = a;
  void _secret;
  return rest;
}

class SaveError extends Error {}
