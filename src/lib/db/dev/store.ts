import "server-only";
import fs from "node:fs";
import path from "node:path";
import type {
  ActivityEntry,
  Category,
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

/** A sample customer (the real customer accounts come with the database). */
export interface DevCustomer {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  created_at: string;
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
}

/** Bump when the stored shape changes, so upgrade() runs on stores (and in-memory caches) made before. */
const STORE_SCHEMA = 2;

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
  d.schema = STORE_SCHEMA;
  return d;
}

const FILE = path.join(process.cwd(), ".data", "dev-store.json");

type Cache = { data: DevData; mtimeMs: number };
// Kept on globalThis so hot reloads in development don't drop it.
const g = globalThis as unknown as { __amarisDevStore?: Cache };

function assertDev() {
  if (process.env.NODE_ENV === "production")
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
  const stat = fs.existsSync(FILE) ? fs.statSync(FILE) : null;
  if (!stat) {
    write(upgrade(seedDevStore()));
    return g.__amarisDevStore!.data;
  }
  if (!g.__amarisDevStore || g.__amarisDevStore.mtimeMs !== stat.mtimeMs) {
    g.__amarisDevStore = { data: upgrade(JSON.parse(fs.readFileSync(FILE, "utf8")) as DevData), mtimeMs: stat.mtimeMs };
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
