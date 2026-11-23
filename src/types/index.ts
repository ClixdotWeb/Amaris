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
}

export interface ProductImage {
  id: string;
  product_id: string;
  storage_path: string;
  url: string;
  alt: string | null;
  sort_order: number;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  size: string;
  stock_qty: number;
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
  is_active: boolean;
  /** Unstitched only: offer the stitching add-on. */
  stitching_available: boolean;
  /** Overrides the default stitching charge from settings. Paise. */
  stitching_charge: number | null;
  /** Running material only. */
  min_metres: number | null;
  metre_step: number | null;
  fabric: string | null;
  care_instructions: string | null;
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
  stitching: boolean;
  stitching_charge: number;
  sizing: Sizing | null;
  dispatch_type: DispatchType;
  line_total: number;
}

export interface OrderWithItems extends Order {
  items: OrderItem[];
}

/** Admin-editable values the client still has to confirm. Stored in the `settings` table. */
export interface ShopSettings {
  default_stitching_charge: number; // paise
  /** Optional per-category stitching charge, keyed by category slug. Paise. */
  stitching_charge_by_category: Record<string, number>;
  domestic_shipping_fee: number; // paise
  /** Free domestic shipping at or above this subtotal. null = never free. Paise. */
  free_shipping_above: number | null;
  /** International flat rates by ISO country code. Countries not listed cannot check out. Paise. */
  international_rates: Record<string, number>;
  cod_enabled: boolean;
}
