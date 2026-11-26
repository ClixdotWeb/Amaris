/**
 * Domain types. Mirror supabase/migrations/0001_init.sql.
 * All money is stored as integer paise (₹1 = 100 paise) to avoid float errors.
 */

export type ProductType = "ready_made" | "unstitched" | "custom_made" | "running_material";

export type DispatchType = "in_stock" | "made_to_order";

export type OrderStatus =
  | "pending_payment"
  | "paid"
  | "processing"
  | "dispatched"
  | "delivered"
  | "cancelled"
  | "refunded";

export type Measurements = Record<string, number>;

/** How a stitched / custom item is sized. */
export type Sizing =
  | { mode: "standard"; size: string }
  | { mode: "custom"; measurements: Measurements; notes?: string };

export interface Category {
  id: string;
  slug: string;
  name: string;
  product_type: ProductType;
  description: string | null;
  sort_order: number;
  /** Cover photo (full URL). null/undefined = the built-in photo. */
  image_url?: string | null;
  /** false = hidden from the shop */
  is_visible?: boolean;
}

export interface ProductImage {
  id: string;
  product_id: string;
  storage_path: string;
  url: string;
  /** Optional small copy (≈640px) for cards, menus and the cart; falls back to url */
  thumb_url?: string | null;
  alt: string | null;
  sort_order: number;
  /** Cloudinary public ID for photos uploaded in the admin (null for older photos). */
  public_id?: string | null;
}

/**
 * One stock line of a product: a size, a colour, or a size × colour combination.
 * size "" = no size (one size); colour null/undefined = no colour. Stock in pieces (metres for running material).
 */
export interface ProductVariant {
  id: string;
  product_id: string;
  size: string;
  colour?: string | null;
  stock_qty: number;
  sku?: string | null;
  /** Overrides the product price for this variant. Paise. */
  price?: number | null;
}

/** published = live on the store; draft = hidden (being prepared or paused); archived = retired, kept for records. */
export type ProductStatus = "draft" | "published" | "archived";

/** A colour the product comes in. hex (and hex2 for two-tone) is sampled from that colour's photo. */
export interface ProductColour {
  name: string;
  hex: string;
  hex2?: string | null;
  /** Index into the product's images showing this colour, or null if there is no photo of it */
  image_index: number | null;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category_id: string;
  product_type: ProductType;
  /** Per piece, or per metre for running material. Paise. */
  price: number;
  /** Original price to show as struck through (Hot Deals). Paise. */
  compare_at_price: number | null;
  /** Ready made only: sizes available. Empty = one size / no size (saree, linen). */
  sizes: string[];
  /** Total stock for products without size variants. Metres for running material. */
  stock_qty: number;
  /** Pre-order items dispatch in 45–60 days. */
  is_preorder: boolean;
  is_new_arrival: boolean;
  is_hot_deal: boolean;
  /** Shown in the Premium collection. */
  is_premium: boolean;
  /** Live on the store. Kept in step with status/deleted_at (= status "published" and not deleted). */
  is_active: boolean;
  /** Admin fields (optional so the storefront's preview data still type-checks). */
  status?: ProductStatus;
  /** Soft delete: hidden everywhere, restorable, old orders keep the link. */
  deleted_at?: string | null;
  /** Product code, e.g. "SC 11113". */
  sku?: string | null;
  tags?: string[];
  meta_title?: string | null;
  meta_description?: string | null;
  /** Sale price (paise) while the sale is on; optional start/end (ISO). See saleActive() in lib/pricing.ts. */
  sale_price?: number | null;
  sale_starts_at?: string | null;
  sale_ends_at?: string | null;
  /** Unstitched only: offer the stitching add-on. */
  stitching_available: boolean;
  /** Overrides the default stitching charge from settings. Paise. */
  stitching_charge: number | null;
  /** Running material only. */
  min_metres: number | null;
  metre_step: number | null;
  fabric: string | null;
  care_instructions: string | null;
  /** Colours to choose from (empty or missing = no colour choice). */
  colours?: ProductColour[];
  created_at: string;
  updated_at: string;
}

export interface ProductWithRelations extends Product {
  category: Category;
  images: ProductImage[];
  variants: ProductVariant[];
}

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  is_admin: boolean;
}

export interface Address {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  pincode: string;
  country: string; // ISO 3166-1 alpha-2, "IN" for India
  is_default: boolean;
}

/** Snapshot of the address stored on the order (addresses can change later). */
export type ShippingAddress = Omit<Address, "id" | "user_id" | "is_default">;

export interface Order {
  id: string;
  order_number: string;
  user_id: string;
  email: string;
  phone: string;
  shipping_address: ShippingAddress;
  status: OrderStatus;
  subtotal: number;
  stitching_total: number;
  shipping_fee: number;
  total: number;
  is_international: boolean;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  carrier: string | null;
  consignment_number: string | null;
  dispatched_at: string | null;
  policies_accepted_at: string;
  customer_notes: string | null;
  admin_notes: string | null;
  /** Set when a cancelled / refunded order's stock was put back, so it only happens once. */
  stock_restored_at?: string | null;
  /** How the customer pays: online (Razorpay) or cash on delivery */
  payment_method?: "online" | "cod";
  /** Cash on delivery charge (paise), included in total */
  cod_fee?: number;
  /** Coupon discount on the items (paise) and its code */
  discount?: number;
  coupon_code?: string | null;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  product_type: ProductType;
  image_url: string | null;
  unit_price: number;
  quantity: number;
  length_metres: number | null;
  size: string | null;
  colour?: string | null;
  stitching: boolean;
  stitching_charge: number;
  sizing: Sizing | null;
  dispatch_type: DispatchType;
  line_total: number;
  /** Made-to-order lines only: workshop progress */
  production_status?: ProductionStatus;
  production_note?: string | null;
}

export interface OrderWithItems extends Order {
  items: OrderItem[];
}

/** Admin-editable values the client still has to confirm. Stored in the `settings` table. */
export interface ShopSettings {
  default_stitching_charge: number; // paise
  /** Optional per-category stitching charge, keyed by category slug. Paise. */
  stitching_charge_by_category: Record<string, number>;
  /** India Post, per item, to the Kerala postal circle (PIN 670000–695999). Paise. */
  shipping_kerala_per_item: number;
  /** India Post, per item, to the rest of India. Paise. */
  shipping_india_per_item: number;
  /** Free domestic shipping at or above this subtotal. null = never free. Paise. */
  free_shipping_above: number | null;
  /** International flat rates by ISO country code. Countries not listed cannot check out. Paise. */
  international_rates: Record<string, number>;
  cod_enabled: boolean;
  /** Extra charge for cash on delivery (paise); 0 = none */
  cod_fee?: number;
  /** Cash on delivery only for orders up to this total (paise); null = no limit */
  cod_max_order?: number | null;
}

/* ───────────── Admin dashboard ───────────── */

/** An admin account (the client's staff who can use the dashboard). One role: admin. */
export interface AdminAccount {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
  /** Email of the admin who added this account; null for the first admin. */
  created_by: string | null;
  last_login_at: string | null;
}

/** One line in the activity log: who changed what, and when. Never edited or deleted. */
export interface ActivityEntry {
  id: string;
  actor_email: string | null;
  /** e.g. "product.update", "order.status", "admin.add" */
  action: string;
  entity_type: "product" | "order" | "settings" | "admin" | "session" | "inventory" | "category" | "collection" | "size_chart" | "customer" | "coupon" | "content" | "review";
  entity_id: string | null;
  summary: string;
  /** Changed fields: { field: [old, new] } */
  diff: Record<string, [unknown, unknown]> | null;
  ip: string | null;
  created_at: string;
}

/* ───────────── Catalogue, marketing and operations (dashboard Phases 3–11) ───────────── */

/** One change to a stock figure, with the reason. Never edited. */
export interface StockMovement {
  id: string;
  product_id: string;
  product_name: string;
  /** Variant id, or null for a product with one stock figure */
  variant_id: string | null;
  /** "M", "Green", "M / Green" or null */
  label: string | null;
  change: number;
  stock_after: number;
  reason: "restock" | "correction" | "damaged" | "returned" | "sale" | "cancelled";
  note: string | null;
  actor_email: string | null;
  created_at: string;
}

/** A hand-picked group of products with its own page in the shop (/collections/slug). */
export interface Collection {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
  /** In display order */
  product_ids: string[];
  created_at: string;
}

/** A size chart shown on product pages of the categories it is linked to. */
export interface SizeChartData {
  id: string;
  name: string;
  unit: "inches" | "cm";
  /** Size names, e.g. XS … XXL */
  sizes: string[];
  rows: { label: string; values: string[] }[];
  note: string | null;
  /** Category slugs that use this chart */
  category_slugs: string[];
}

export interface Coupon {
  id: string;
  /** Upper-case */
  code: string;
  description: string | null;
  type: "percent" | "flat";
  /** Percent (1–100) or paise */
  value: number;
  /** Smallest order subtotal (paise) */
  min_order: number;
  /** Largest discount for percent coupons (paise), or null */
  max_discount: number | null;
  starts_at: string | null;
  ends_at: string | null;
  /** Total uses allowed, or null for no limit */
  usage_limit: number | null;
  used_count: number;
  is_active: boolean;
  created_at: string;
}

export interface Review {
  id: string;
  product_id: string;
  name: string;
  rating: number;
  title: string | null;
  body: string;
  status: "pending" | "approved" | "hidden";
  created_at: string;
}

/** Home page content edited in the dashboard. Empty fields fall back to the built-in text and photos. */
export interface HomeContent {
  hero: {
    left: string;
    right: string;
    tagline: string;
    description: string;
    href: string;
    image_url: string;
    /** Focus point of the photo as CSS object-position ("36% 50%"): stays in view on wide and tall screens */
    position: string;
  }[];
  announcements: string[];
  promo_tiles: { eyebrow: string; title: string; href: string; image_url: string }[];
  /** Collections shown as rails on the home page, by id */
  featured_collection_ids: string[];
  /** Background of every shop page */
  wallpaper: SiteWallpaper;
}

/**
 * The shop's background. default = the built-in damask; pattern = an uploaded image repeated like wallpaper;
 * photo = one uploaded picture filling the screen; none = plain ivory.
 */
export interface SiteWallpaper {
  mode: "default" | "pattern" | "photo" | "none";
  image_url: string;
  /** 0–100: how strongly it shows through */
  strength: number;
  /** Pattern only: width of one repeat in pixels */
  size: number;
}

/** Where a made-to-order line is in the workshop. */
export type ProductionStatus = "not_started" | "cutting" | "stitching" | "ready";
