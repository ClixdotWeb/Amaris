/**
 * The data layer used by the admin dashboard. Pages and server actions call `db` (src/lib/db/index.ts)
 * and never talk to a database directly, so the backend can change without touching them:
 *   - "dev": local development store (a JSON file in .data/), used while the dashboard is being built
 *   - "postgres": written when the Postgres database on Coolify is connected
 * Business rules (allowed status changes, prices in paise…) live in src/lib/admin/, not in a backend.
 */
import type {
  Collection,
  Coupon,
  HomeContent,
  OrderItem,
  ProductionStatus,
  Review,
  SizeChartData,
  StockMovement,
  ProductColour,
  ProductStatus,
  ActivityEntry,
  AdminAccount,
  Category,
  Order,
  OrderStatus,
  OrderWithItems,
  ProductImage,
  ProductWithRelations,
  ShopSettings,
} from "@/types";

export type Page<T> = { rows: T[]; total: number; page: number; pageSize: number };

export interface ProductFilters {
  q?: string;
  categorySlug?: string;
  /** published = live, draft = hidden, archived; "deleted" lists soft-deleted products (otherwise they are excluded) */
  status?: ProductStatus | "deleted";
  /** Unstitched products with the stitching option on / off */
  stitching?: "on" | "off";
  /** Shown in New Arrivals / Hot Deals / Premium */
  flag?: "new" | "deal" | "premium";
  stock?: "out" | "low";
  sort?: ProductSort;
  page?: number;
  pageSize?: number;
}

export const PRODUCT_SORTS = ["newest", "oldest", "name", "price_asc", "price_desc", "stock_asc", "stock_desc"] as const;
export type ProductSort = (typeof PRODUCT_SORTS)[number];

/** Products at or below this many pieces count as low stock (dashboard, filters, stock bars). */
export const LOW_STOCK_THRESHOLD = 3;

/** One stock line in the form: size "" = no size, colour null = no colour. Money in paise. */
export interface VariantInput {
  size: string;
  colour: string | null;
  stock_qty: number;
  sku: string | null;
  price: number | null;
}

/** Everything the product form saves. Money in paise. */
export interface ProductInput {
  id?: string;
  name: string;
  slug: string;
  sku: string | null;
  description: string | null;
  category_id: string;
  status: ProductStatus;
  /** Regular price. */
  price: number;
  sale_price: number | null;
  sale_starts_at: string | null;
  sale_ends_at: string | null;
  sizes: string[];
  colours: ProductColour[];
  /** Used when there are no variants. */
  stock_qty: number;
  /** Stock per size / colour / size × colour. Empty = one stock figure (stock_qty). */
  variants: VariantInput[];
  tags: string[];
  meta_title: string | null;
  meta_description: string | null;
  is_preorder: boolean;
  is_new_arrival: boolean;
  is_hot_deal: boolean;
  is_premium: boolean;
  stitching_available: boolean;
  stitching_charge: number | null;
  min_metres: number | null;
  metre_step: number | null;
  fabric: string | null;
  care_instructions: string | null;
}

/** A photo already uploaded to (and verified with) Cloudinary, to attach to a product. */
export interface NewImage {
  public_id: string;
  url: string;
  thumb_url: string;
  alt: string | null;
}

export type SaveResult = { ok: true; id: string } | { ok: false; error: string };

/** One change applied to many products at once (products list bulk bar). */
export type BulkProductAction =
  | { kind: "status"; status: ProductStatus }
  | { kind: "flag"; flag: "is_new_arrival" | "is_hot_deal" | "is_premium"; on: boolean }
  | { kind: "stitching"; on: boolean }
  | { kind: "price"; mode: "set" | "percent"; value: number }
  | { kind: "delete" }
  | { kind: "restore" };

export interface LowStockRow {
  productId: string;
  name: string;
  /** "M", "Green" or "M / Green"; null when the product has one stock figure */
  size: string | null;
  stock: number;
  unit: "pcs" | "m";
  /** First product photo (small copy when there is one), for thumbnails */
  image: string | null;
  category: string | null;
}

export interface OrderFilters {
  status?: OrderStatus;
  /** Order number, customer name, email or phone */
  q?: string;
  page?: number;
  pageSize?: number;
}

/** Admin account with its password hash (never sent to the browser). */
export type AdminWithSecret = AdminAccount & { password_hash: string };

export type NewActivity = Omit<ActivityEntry, "id" | "created_at">;

export interface ActivityFilters {
  actor?: string;
  entityType?: ActivityEntry["entity_type"];
  entityId?: string;
  /** ISO date-times, inclusive */
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

export type OrderPatch = Partial<
  Pick<Order, "status" | "admin_notes" | "carrier" | "consignment_number" | "dispatched_at">
>;

/* ───── Inventory ───── */
export interface StockRow {
  productId: string;
  /** null for a product with one stock figure */
  variantId: string | null;
  name: string;
  sku: string | null;
  category: string;
  image: string | null;
  /** "M", "Green", "M / Green" or null */
  label: string | null;
  stock: number;
  unit: "pcs" | "m";
  status: ProductStatus;
}
export interface StockFilters {
  q?: string;
  categorySlug?: string;
  stock?: "out" | "low" | "in";
  page?: number;
  pageSize?: number;
}
export interface StockAdjust {
  productId: string;
  variantId: string | null;
  /** add: change by amount (negative to remove); set: new stock figure */
  mode: "add" | "set";
  amount: number;
  reason: StockMovement["reason"];
  note: string | null;
}

/* ───── Catalogue ───── */
export interface CategoryInput {
  id?: string;
  name: string;
  slug: string;
  product_type: Category["product_type"];
  description: string | null;
  image_url: string | null;
  is_visible: boolean;
}
export type CollectionInput = Omit<Collection, "id" | "created_at" | "sort_order"> & { id?: string };
export type SizeChartInput = Omit<SizeChartData, "id"> & { id?: string };
export type CouponInput = Omit<Coupon, "id" | "created_at" | "used_count"> & { id?: string };

/* ───── Customers ───── */
export interface CustomerRow {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  created_at: string;
  is_blocked: boolean;
  notes: string | null;
  orders: number;
  /** Paid orders only, cancelled and refunded excluded (paise) */
  spent: number;
  last_order_at: string | null;
}
export interface CustomerFilters {
  q?: string;
  blocked?: boolean;
  sort?: "newest" | "spent" | "orders";
  page?: number;
  pageSize?: number;
}

/* ───── Stitching queue ───── */
export interface ProductionRow {
  item: OrderItem;
  order: { id: string; order_number: string; created_at: string; status: OrderStatus; customer: string; phone: string };
  /** Paid date + 60 days */
  due_at: string;
}

/* ───── Reports ───── */
export interface SalesReport {
  kpis: { revenue: number; orders: number; aov: number; items: number; stitching: number };
  byDay: { day: string; revenue: number; orders: number }[];
  byProduct: { id: string | null; name: string; qty: number; revenue: number }[];
  byCategory: { name: string; qty: number; revenue: number }[];
  bySize: { size: string; qty: number }[];
}

/* ───── Shop (what the storefront reads) ───── */
/** An order placed at checkout, already priced by priceCart (src/lib/checkout.ts). */
export interface NewShopOrder {
  email: string;
  phone: string;
  full_name: string;
  shipping_address: Order["shipping_address"];
  items: Omit<OrderItem, "id" | "order_id">[];
  subtotal: number;
  stitching_total: number;
  shipping_fee: number;
  discount: number;
  coupon_code: string | null;
  total: number;
  is_international: boolean;
  customer_notes: string | null;
}
export interface ShopProductFilter {
  categorySlug?: string;
  query?: string;
  newArrivals?: boolean;
  hotDeals?: boolean;
  premium?: boolean;
  collectionSlug?: string;
  sort?: "newest" | "price_asc" | "price_desc";
  limit?: number;
  offset?: number;
}

export interface AdminDb {
  categories: {
    list(): Promise<Category[]>;
    save(input: CategoryInput): Promise<SaveResult>;
    /** Move one place up or down in the menu order. */
    move(id: string, dir: -1 | 1): Promise<void>;
    /** Only categories with no products can be removed. */
    remove(id: string): Promise<{ ok: true } | { ok: false; error: string }>;
    /** Products per category id (deleted products not counted). */
    productCounts(): Promise<Record<string, number>>;
  };
  inventory: {
    list(f: StockFilters): Promise<Page<StockRow>>;
    adjust(a: StockAdjust, actor: string | null): Promise<{ ok: true; stock: number; movement: StockMovement } | { ok: false; error: string }>;
    history(f: { productId?: string; page?: number; pageSize?: number }): Promise<Page<StockMovement>>;
  };
  collections: {
    list(): Promise<Collection[]>;
    get(id: string): Promise<Collection | null>;
    save(input: CollectionInput): Promise<SaveResult>;
    move(id: string, dir: -1 | 1): Promise<void>;
    remove(id: string): Promise<void>;
  };
  sizeCharts: {
    list(): Promise<SizeChartData[]>;
    get(id: string): Promise<SizeChartData | null>;
    save(input: SizeChartInput): Promise<SaveResult>;
    remove(id: string): Promise<void>;
  };
  customers: {
    list(f: CustomerFilters): Promise<Page<CustomerRow>>;
    get(id: string): Promise<{ customer: CustomerRow; orders: OrderWithItems[] } | null>;
    update(id: string, patch: { is_blocked?: boolean; notes?: string | null }): Promise<CustomerRow | null>;
  };
  coupons: {
    list(): Promise<Coupon[]>;
    get(id: string): Promise<Coupon | null>;
    findByCode(code: string): Promise<Coupon | null>;
    save(input: CouponInput): Promise<SaveResult>;
    remove(id: string): Promise<void>;
  };
  content: {
    get(): Promise<HomeContent>;
    save(c: HomeContent): Promise<void>;
  };
  reviews: {
    list(f: { status?: Review["status"]; page?: number; pageSize?: number }): Promise<Page<Review & { product_name: string; product_slug: string | null }>>;
    setStatus(id: string, status: Review["status"]): Promise<Review | null>;
    remove(id: string): Promise<Review | null>;
    counts(): Promise<Record<Review["status"], number>>;
  };
  production: {
    list(f: { status?: ProductionStatus; page?: number; pageSize?: number }): Promise<Page<ProductionRow>>;
    get(itemId: string): Promise<ProductionRow | null>;
    update(itemId: string, patch: { production_status?: ProductionStatus; production_note?: string | null }): Promise<ProductionRow | null>;
    counts(): Promise<Record<ProductionStatus, number>>;
  };
  reports: {
    sales(fromIso: string, toIso: string): Promise<SalesReport>;
  };
  /** Read-only views for the storefront (published, not deleted, sale prices applied). */
  shop: {
    products(f: ShopProductFilter): Promise<{ products: ProductWithRelations[]; count: number }>;
    productBySlug(slug: string): Promise<ProductWithRelations | null>;
    productsByIds(ids: string[]): Promise<ProductWithRelations[]>;
    categories(): Promise<Category[]>;
    collections(): Promise<Collection[]>;
    collectionBySlug(slug: string): Promise<Collection | null>;
    sizeChartFor(categorySlug: string): Promise<SizeChartData | null>;
    reviewsFor(productId: string): Promise<Review[]>;
    addReview(r: Pick<Review, "product_id" | "name" | "rating" | "title" | "body">): Promise<void>;
    /** Saves an order waiting for payment (customer found by email, or added). */
    createOrder(o: NewShopOrder): Promise<{ id: string; order_number: string }>;
    /** Pending → paid once: takes the items out of stock, records the stock change, counts the coupon. */
    payOrder(id: string, paymentRef: string, cod?: { fee: number }): Promise<OrderWithItems | null>;
  };
  products: {
    list(f: ProductFilters): Promise<Page<ProductWithRelations>>;
    get(id: string): Promise<ProductWithRelations | null>;
    /** Saves the product, its per-size stock and new photos in one step (all or nothing). */
    save(input: ProductInput, newImages: NewImage[]): Promise<SaveResult>;
    /** published / draft / archived (keeps is_active in step). */
    setStatus(id: string, status: ProductStatus): Promise<void>;
    /** Copy as a hidden draft (new slug and SKU suffix); returns the new id. */
    duplicate(id: string): Promise<SaveResult>;
    softDelete(id: string): Promise<void>;
    restore(id: string): Promise<void>;
    /** Apply one change to many products; returns how many changed and any skipped with the reason. */
    bulk(ids: string[], action: BulkProductAction): Promise<{ changed: number; skipped: { id: string; reason: string }[] }>;
    /** New photo order (all of the product's image ids). Colour → photo links follow their photos. */
    reorderImages(productId: string, imageIds: string[]): Promise<boolean>;
    /** Is a Cloudinary file still used by any product photo? (copies share files) */
    publicIdInUse(publicId: string): Promise<boolean>;
    /** Stitching add-on on/off. Only unstitched products can offer it; returns false for any other product. */
    setStitching(id: string, available: boolean): Promise<boolean>;
    /** Removes the photo row and returns it (so the caller can delete the file from Cloudinary). */
    deleteImage(id: string): Promise<ProductImage | null>;
    lowStock(threshold: number): Promise<LowStockRow[]>;
  };
  orders: {
    list(f: OrderFilters): Promise<Page<OrderWithItems>>;
    get(id: string): Promise<OrderWithItems | null>;
    /** Orders created at or after this time (ISO), newest first. */
    createdSince(iso: string): Promise<OrderWithItems[]>;
    countByStatus(statuses: OrderStatus[]): Promise<number>;
    update(id: string, patch: OrderPatch): Promise<OrderWithItems | null>;
    /** Puts the order's stock back. Does nothing (returns false) if it was already done. */
    restoreStock(id: string): Promise<boolean>;
  };
  settings: {
    get(): Promise<ShopSettings>;
    save(s: ShopSettings): Promise<void>;
  };
  admins: {
    list(): Promise<AdminAccount[]>;
    count(): Promise<number>;
    findByEmail(email: string): Promise<AdminWithSecret | null>;
    add(a: Pick<AdminWithSecret, "email" | "full_name" | "password_hash" | "created_by">): Promise<SaveResult>;
    /** Refuses to remove the last admin. */
    remove(id: string): Promise<{ ok: true; removed: AdminAccount } | { ok: false; error: string }>;
    touchLogin(id: string): Promise<void>;
  };
  activity: {
    log(e: NewActivity): Promise<void>;
    list(f: ActivityFilters): Promise<Page<ActivityEntry>>;
    /** Distinct actor emails, for the filter. */
    actors(): Promise<string[]>;
  };
}
