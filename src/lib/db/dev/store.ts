import "server-only";
import fs from "node:fs";
import { unstable_noStore as noStore } from "next/cache";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type {
  ActivityEntry,
  Category,
  Collection,
  Coupon,
  HomeContent,
  Review,
  SizeChartData,
  StockMovement,
  Order,
  OrderItem,
  Product,
  ProductImage,
  ProductVariant,
  ShopSettings,
} from "@/types";
import { seedDevStore } from "./seed";
import { productCode } from "@/lib/admin/productDisplay";
import type { AdminWithSecret } from "../types";
import { DEFAULT_HOME, DEFAULT_SIZE_CHART } from "@/lib/content/defaults";

/** A sample customer (the real customer accounts come with the database). */
export interface DevCustomer {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  created_at: string;
  /** Blocked customers can't sign in or check out (enforced by the real login system after the move). */
  is_blocked?: boolean;
  /** Private notes from the shop */
  notes?: string | null;
}

/** Everything the local development store holds. Shapes mirror the planned Postgres tables. */
export interface DevData {
  version: 1;
  /** Data format; upgrade() brings older stores up to STORE_SCHEMA. */
  schema?: number;
  seeded_at: string;
  categories: Category[];
  products: Product[];
  variants: ProductVariant[];
  images: ProductImage[];
  customers: DevCustomer[];
  orders: Order[];
  order_items: OrderItem[];
  settings: ShopSettings;
  /** Admin accounts. Empty until the first admin signs in (created from .env.local). */
  admins: AdminWithSecret[];
  activity: ActivityEntry[];
  stock_movements: StockMovement[];
  collections: Collection[];
  size_charts: SizeChartData[];
  coupons: Coupon[];
  reviews: Review[];
  content: HomeContent;
}

/** Bump when the stored shape changes, so upgrade() runs on stores (and in-memory caches) made before. */
const STORE_SCHEMA = 3;

/** Fills in tables and fields added after a store file was created, so old files keep working. */
export function upgrade(d: DevData): DevData {
  if (d.schema === STORE_SCHEMA) return d;
  d.admins ??= [];
  d.activity ??= [];
  for (const p of d.products) {
    if (p.status === undefined) p.status = p.is_active ? "published" : "draft";
    p.deleted_at ??= null;
    if (p.sku === undefined) p.sku = productCode(p.name);
    p.tags ??= [];
    p.meta_title ??= null;
    p.meta_description ??= null;
    // Phase 2: "original price" becomes a sale price (price = regular price, sale_price = what customers pay)
    if (p.sale_price === undefined) {
      if (p.compare_at_price != null && p.compare_at_price > p.price) {
        p.sale_price = p.price;
        p.price = p.compare_at_price;
      } else p.sale_price = null;
      p.compare_at_price = null;
    }
    p.sale_starts_at ??= null;
    p.sale_ends_at ??= null;
  }
  for (const v of d.variants) {
    v.colour ??= null;
    v.sku ??= null;
    v.price ??= null;
  }
  // Phase 3–11: catalogue, marketing and operations tables
  d.stock_movements ??= [];
  d.coupons ??= [];
  d.content ??= structuredClone(DEFAULT_HOME);
  d.size_charts ??= [{ id: randomUUID(), ...structuredClone(DEFAULT_SIZE_CHART) }];
  d.categories.forEach((c) => {
    c.image_url ??= null;
    c.is_visible ??= true;
  });
  d.customers.forEach((c) => {
    c.is_blocked ??= false;
    c.notes ??= null;
  });
  d.order_items.forEach((i) => {
    if (i.dispatch_type === "made_to_order") i.production_status ??= "not_started";
  });
  if (!d.collections) {
    // One sample collection so the page and the shop have something to show
    const picks = d.products.filter((p) => p.status === "published" && !p.deleted_at).slice(0, 8).map((p) => p.id);
    d.collections = [
      { id: randomUUID(), slug: "festive-edit", name: "Festive Edit", description: "Silks and rich weaves for weddings and festivals.", image_url: null, is_active: true, sort_order: 0, product_ids: picks, created_at: new Date().toISOString() },
    ];
  }
  if (!d.reviews) {
    const live = d.products.filter((p) => p.status === "published" && !p.deleted_at);
    const now = Date.now();
    const sample: [string, number, string][] = [
      ["Anjali M.", 5, "Beautiful fabric and exactly like the photos. The stitching fit perfectly."],
      ["Reshma K.", 4, "Lovely colour. Delivery took a few days but it was well packed."],
      ["Divya P.", 5, "Got so many compliments at the wedding. Will order again!"],
      ["Neethu S.", 3, "Nice suit, the colour is slightly darker than on screen."],
    ];
    d.reviews = sample.map(([name, rating, body], i) => ({
      id: randomUUID(),
      product_id: live[i % Math.max(1, live.length)]?.id ?? "",
      name,
      rating,
      title: null,
      body,
      status: i === 3 ? "pending" : "approved",
      created_at: new Date(now - (i + 1) * 86_400_000).toISOString(),
    }));
  }
  d.schema = STORE_SCHEMA;
  return d;
}

const FILE = path.join(process.cwd(), ".data", "dev-store.json");

type Cache = { data: DevData; mtimeMs: number };
// Kept on globalThis so hot reloads in development don't drop it.
const g = globalThis as unknown as { __amarisDevStore?: Cache };

function assertDev() {
  // LOCAL_PREVIEW=1 (npm run preview): a fast production build on this computer, still on the dev store
  if (process.env.NODE_ENV === "production" && process.env.LOCAL_PREVIEW !== "1")
    throw new Error("The local development store can't be used in production. Connect the database (DATA_BACKEND=postgres).");
}

function write(data: DevData) {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  const json = JSON.stringify(data);
  const tmp = `${FILE}.tmp`;
  fs.writeFileSync(tmp, json);
  try {
    fs.renameSync(tmp, FILE);
  } catch {
    // Windows can refuse the rename if another program has the file open; write in place instead.
    fs.writeFileSync(FILE, json);
    fs.rmSync(tmp, { force: true });
  }
  g.__amarisDevStore = { data, mtimeMs: fs.statSync(FILE).mtimeMs };
}

/** Current data. Seeds the store on first use and reloads it if the file was changed or deleted outside the app. */
export function readStore(): DevData {
  assertDev();
  // Pages that read the store always show the latest data (never a copy saved at build time)
  try {
    noStore();
  } catch {}
  const stat = fs.existsSync(FILE) ? fs.statSync(FILE) : null;
  if (!stat) {
    write(upgrade(seedDevStore()));
    return g.__amarisDevStore!.data;
  }
  if (!g.__amarisDevStore || g.__amarisDevStore.mtimeMs !== stat.mtimeMs) {
    const raw = JSON.parse(fs.readFileSync(FILE, "utf8")) as DevData;
    const old = raw.schema !== STORE_SCHEMA;
    g.__amarisDevStore = { data: upgrade(raw), mtimeMs: stat.mtimeMs };
    // Save the upgraded store straight away, so ids created by upgrade() stay the same after a restart
    if (old) write(g.__amarisDevStore.data);
  }
  // A cache loaded by older code (dev hot reload) is upgraded too
  if (g.__amarisDevStore.data.schema !== STORE_SCHEMA) upgrade(g.__amarisDevStore.data);
  return g.__amarisDevStore.data;
}

/**
 * Changes the store all-or-nothing: `fn` works on a copy, and the copy is saved only if `fn` doesn't throw.
 * Node runs this synchronously, so two changes can't interleave.
 */
export function mutateStore<T>(fn: (draft: DevData) => T): T {
  const draft = structuredClone(readStore());
  const result = fn(draft);
  write(draft);
  return result;
}
