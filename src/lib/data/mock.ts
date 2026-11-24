/**
 * PREVIEW DATA, used until the database is connected.
 * Products come from catalog.json: the boutique's real products (names, prices, sizes, descriptions, photos),
 * taken from the current store. catalog.json keeps the local paths (public/Assets/products/...); the site
 * serves those photos from Cloudinary via productPhoto() (see src/lib/images.ts).
 */
import type { Category, ProductImage, ProductType, ProductWithRelations, ShopSettings } from "@/types";
import { cloudImage, productPhoto, PHOTO_CARD, PHOTO_FULL } from "@/lib/images";
import catalog from "./catalog.json";


const CAT: Record<string, { name: string; type: ProductType; photo: string; description: string }> = {
  "unstitched-salwar-suits": {
    name: "Unstitched – Salwar Suits", type: "unstitched",
    photo: "/Assets/products/unstitched-salwar-suits/handloom-cotton-salwar-suit-sc-11113/01.webp",
    description: "Premium suit materials, sold as fabric or stitched to your measurements.",
  },
  "co-ord-sets": {
    name: "Co-ord Sets", type: "ready_made",
    photo: "/Assets/products/ready-made/cotton-co-ord-set-sc-10677/01.webp",
    description: "Easy matching sets for every day.",
  },
  "frocks-kurtis": {
    name: "Frocks & Kurtis – Custom Made", type: "custom_made", photo: "/Assets/placeholders/kurti.jpg", // placeholder (Unsplash) until the client's photos arrive
    description: "Made to order in your size or to your exact measurements.",
  },
  "ready-made": {
    name: "Ready Made", type: "ready_made",
    photo: "/Assets/products/ready-made/modal-muslin-salwar-set-sc-11090/01.jpg",
    description: "Ready to wear, dispatched within 48 hours.",
  },
  saree: {
    name: "Saree", type: "ready_made",
    photo: "/Assets/products/saree/pure-banarasi-brocade-saree-sc-8688/01.webp",
    description: "Handpicked sarees for festivals, weddings and every day.",
  },
  "home-linen": {
    name: "Home Linen", type: "ready_made",
    photo: "/Assets/products/linen/bedsheet-01/01.webp",
    description: "Bedsheets and linen for a beautiful home.",
  },
  "running-material": {
    name: "Running Material", type: "running_material",
    photo: "/Assets/products/running-material/pure-cotton-block-printed-running-fabric-sc-1033-copy/01.jpg",
    description: "Fabric sold by the metre. Choose the length you need.",
  },
  "kids-dresses": {
    name: "Kids Dresses – Custom Made", type: "custom_made", photo: "/Assets/placeholders/kids.jpg", // placeholder (Unsplash) until the client's photos arrive
    description: "Festive and everyday dresses for little ones, made to order.",
  },
};

export const mockCategories: Category[] = Object.entries(CAT).map(([slug, c], i) => ({
  id: `cat-${slug}`,
  slug,
  name: c.name,
  product_type: c.type,
  description: c.description,
  sort_order: i + 1,
}));

/**
 * Photo URL for a category (circles, menus), at roughly the given width.
 * All category pictures come from Cloudinary at that width.
 */
export const categoryPhoto = (slug: string, w = 400) => {
  const photo = CAT[slug]?.photo;
  if (!photo) return undefined;
  return cloudImage(photo, w);
};

type CatalogItem = {
  slug: string;
  name: string;
  category: string;
  price: number; // paise
  compare: number | null; // paise
  sizes: string[];
  colours: string[];
  tags: string[];
  isNew: boolean;
  isDeal: boolean;
  available: boolean;
  created: string | null;
  description: string;
  images: string[];
  colourOptions?: { name: string; hex: string; hex2: string | null; image: number }[];
};

/** Fabric line from the store's tags, e.g. "Pure Organza" (first tag that names a fabric). */
const FABRIC = /(silk|cotton|organza|chanderi|chiffon|georgette|linen|rayon|modal|muslin|tussar|crepe|tissue|banarasi|kota|satin|velvet|net|khadi|mul)/i;

export const mockProducts: ProductWithRelations[] = (catalog as CatalogItem[]).map((s, i) => {
  const category = mockCategories.find((c) => c.slug === s.category)!;
  const id = `prod-${i + 1}`;
  const images: ProductImage[] = s.images.map((url, j) => ({
    id: `${id}-img-${j}`,
    product_id: id,
    storage_path: url,
    url: productPhoto(url, PHOTO_FULL),
    thumb_url: productPhoto(url, PHOTO_CARD),
    alt: s.name,
    sort_order: j,
  }));
  const metres = category.product_type === "running_material";
  const stock = s.available ? (metres ? 50 : 10) : 0;
  // Colours are chosen with the colour picker; only list them in the text when there is no picker
  const colours = s.colours.length && !s.colourOptions?.length ? `\nAvailable colours: ${s.colours.join(", ")}` : "";
  const created = s.created ? new Date(s.created).toISOString() : new Date(Date.UTC(2026, 0, 1) - i * 60_000).toISOString();
  return {
    id,
    slug: s.slug,
    name: s.name,
    description: (s.description || `${s.name} from Amaris Boutique.`) + colours,
    category_id: category.id,
    product_type: category.product_type,
    price: s.price,
    compare_at_price: s.compare,
    sizes: s.sizes,
    stock_qty: stock,
    is_preorder: false,
    is_new_arrival: s.isNew,
    is_hot_deal: s.isDeal,
    is_active: true,
    stitching_available: category.product_type === "unstitched",
    stitching_charge: null,
    min_metres: metres ? 1 : null,
    metre_step: metres ? 0.5 : null,
    fabric: s.tags.find((t) => FABRIC.test(t)) ?? null,
    colours: (s.colourOptions ?? []).map((c) => ({ name: c.name, hex: c.hex, hex2: c.hex2, image_index: c.image >= 0 ? c.image : null })),
    care_instructions: "Dry clean recommended for the first wash. Wash dark colours separately in cold water.",
    created_at: created,
    updated_at: created,
    category,
    images,
    variants: s.sizes.map((size) => ({ id: `${id}-${size}`, product_id: id, size, stock_qty: s.available ? 5 : 0 })),
  };
});

export const mockSettings: ShopSettings = {
  default_stitching_charge: 50000,
  stitching_charge_by_category: {},
  shipping_kerala_per_item: 6000, // ₹60 per item within Kerala
  shipping_india_per_item: 9000, // ₹90 per item to other states
  free_shipping_above: 299900,
  international_rates: { AE: 250000, US: 350000, GB: 350000 },
  cod_enabled: false,
};
