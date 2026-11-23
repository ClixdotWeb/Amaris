/**
 * SAMPLE DATA for design / preview. Product names and descriptions are placeholders written for Amaris.
 * Photos are from Unsplash (free Unsplash License) and must be replaced with the client's own photos.
 */
import type { Category, ProductImage, ProductType, ProductWithRelations, ShopSettings } from "@/types";

export const img = (id: string, w = 900) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

/** Fixed-size crop centred on faces, for wide banners made from tall photos. */
export const imgCrop = (id: string, w: number, h: number) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&crop=faces,entropy&w=${w}&h=${h}&q=80`;

/** Unsplash photo ids, grouped by what they show. Chosen for a modern, styled ("Pinterest") look. */
export const PHOTOS = {
  saree: [
    "1619516388835-2b60acc4049e", // pink-red silk saree, garden
    "1614940685083-c5409b57da6e", // red silk saree, balcony
    "1727430228383-aa1fb59db8bf", // red silk saree, sea backdrop
    "1617627143750-d86bc21e42bb", // pink-orange saree between trees
    "1678705730064-a7ecbab4b3fb", // beige saree, red blouse
    "1770838447151-05a876cdee3d", // blue saree, smiling
    "1641699862936-be9f49b1c38d", // purple silk saree
    "1679006831648-7c9ea12e5807", // teal silk saree
    "1612595391900-29390866733a", // Kerala kasavu saree
    "1739429942851-9083ee185d3d", // green saree, golden light
  ],
  suit: [
    "1733470381571-c3d082e68457", // red suit set, floral arch
    "1733470324488-d0e10d014d80", // cream suit set, floral arch
    "1733470381436-bb5a2a441708", // powder blue suit set, floral arch
    "1705920824583-0e783235394d", // lilac suit with dupatta
    "1733470381591-c5dfb9df3c3d", // black embroidered suit set
    "1773439878281-5aa23c34dcaa", // grey suit, embroidered dupatta
    "1773439878577-5969ffc1b198", // green and pink suit
    "1571908599407-cdb918ed83bf", // beige embroidered anarkali
  ],
  coord: [
    "1769063382610-6be8acb7552f", // printed co-ord, pastel
    "1766994063823-ed214f883548", // navy floral co-ord
    "1768033976371-0e4ef195dfa2", // pink floral co-ord
    "1762777777819-4d9aa5529368", // pink co-ord, bow
    "1767785829347-cc13bd969514", // printed co-ord, arch
    "1764928947261-f5687e0faa4a", // red floral co-ord
  ],
  kurti: [
    "1745313452052-0e4e341f326c", // white floral kurta set
    "1741847639057-b51a25d42892", // pink floral kurta set
    "1676269029657-4faa15fc6c03", // pink anarkali frock
    "1708534419572-6e6614a53ca1", // embroidered kurti, park
    "1708534246051-7f47b279e94b", // wine kurti, park
    "1701252072712-e939599623f2", // yellow kurta
    "1765529374927-052599af9c82", // printed kurta set
  ],
  occasion: [
    "1668371679302-a8ec781e876e", // red anarkali gown
    "1747847471517-952a3eb93a89", // blue bridal lehenga
    "1729146768775-3662af38016e", // ivory lehenga
    "1571908599538-7e1e6e92b064", // gold embroidered set
    "1794893552686-6dcb717f20df", // blush lehenga
  ],
  linen: ["1564019472231-4586c552dc27", "1635594202056-9ea3b497e5c0", "1598535746036-87d13382f6a6"],
  fabric: [
    "1779386752783-d1af92a174e2", "1783764245498-31991c8a6cae", "1783763624907-b9974ce1dbe3",
    "1783762774159-b0c266382e2f", "1779470703519-05af825e87cd",
  ],
  kids: [
    "1597294151491-1d22b38698d6", // girl in red and yellow pavadai
    "1785393153529-107a4729b0d2", // girl with flowers
    "1760287363878-1a09af715b80", // yellow tiered frock (garment)
  ],
  wide: {
    lehengaTrio: "1571587289339-cb7da03fb5a6", // three women in pastel lehengas (landscape)
    blush: "1794893552686-6dcb717f20df", // blush lehenga, studio (landscape)
    kerala: "1787295779668-6ad1171580ff", // three women in kasavu sarees picking flowers (portrait, crop)
    embroidery: "1787220272461-2c53528c9349",
  },
};

const CAT: Record<string, { name: string; type: ProductType; photo: string; description: string }> = {
  "unstitched-salwar-suits": {
    name: "Unstitched – Salwar Suits", type: "unstitched", photo: PHOTOS.suit[0],
    description: "Premium suit materials, sold as fabric or stitched to your measurements.",
  },
  "co-ord-sets": { name: "Co-ord Sets", type: "ready_made", photo: PHOTOS.coord[0], description: "Easy matching sets for every day." },
  "frocks-kurtis": {
    name: "Frocks & Kurtis – Custom Made", type: "custom_made", photo: PHOTOS.kurti[2],
    description: "Made to order in your size or to your exact measurements.",
  },
  "ready-made": { name: "Ready Made", type: "ready_made", photo: PHOTOS.occasion[0], description: "Ready to wear, dispatched within 48 hours." },
  saree: { name: "Saree", type: "ready_made", photo: PHOTOS.saree[0], description: "Handpicked sarees for festivals, weddings and every day." },
  "home-linen": { name: "Home Linen", type: "ready_made", photo: PHOTOS.linen[0], description: "Bedsheets and linen for a beautiful home." },
  "running-material": {
    name: "Running Material", type: "running_material", photo: PHOTOS.fabric[1],
    description: "Fabric sold by the metre. Choose the length you need.",
  },
  "kids-dresses": {
    name: "Kids Dresses – Custom Made", type: "custom_made", photo: PHOTOS.kids[0],
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

export const categoryPhoto = (slug: string) => CAT[slug]?.photo;

type Seed = {
  name: string;
  cat: string;
  price: number; // ₹
  compare?: number; // ₹
  photos: string[];
  sizes?: string[];
  stock?: number;
  isNew?: boolean;
  deal?: boolean;
  preorder?: boolean;
  fabric?: string;
};

const { saree: S, suit: U, coord: C, kurti: K, occasion: O, linen: L, fabric: F, kids: D } = PHOTOS;

const SEEDS: Seed[] = [
  // Unstitched suits
  { name: "Gulmohar Chikankari Suit Material", cat: "unstitched-salwar-suits", price: 1450, photos: [U[0], U[3]], isNew: true, fabric: "Georgette top with thread work, crepe bottom, chiffon dupatta" },
  { name: "Ivory Bloom Chanderi Suit Set", cat: "unstitched-salwar-suits", price: 1890, compare: 2390, photos: [U[1], U[2]], deal: true, fabric: "Chanderi silk top, cotton bottom, organza dupatta" },
  { name: "Powder Blue Mirror Work Suit", cat: "unstitched-salwar-suits", price: 1690, photos: [U[2], U[1]], isNew: true, fabric: "Cotton silk with mirror work" },
  { name: "Lilac Mist Georgette Suit", cat: "unstitched-salwar-suits", price: 2150, photos: [U[3], U[0]], fabric: "Georgette with embroidered dupatta" },
  { name: "Midnight Embroidered Suit Material", cat: "unstitched-salwar-suits", price: 2290, photos: [U[4], U[5]], fabric: "Rayon with thread embroidery" },
  // Sarees
  { name: "Kasavu Gold Border Saree", cat: "saree", price: 2890, photos: [S[8], S[4]], isNew: true, fabric: "Cotton with zari border" },
  { name: "Rani Pink Silk Saree", cat: "saree", price: 3450, compare: 4200, photos: [S[0], S[3]], deal: true, fabric: "Soft silk with zari pallu" },
  { name: "Sindoor Red Kanjivaram Saree", cat: "saree", price: 4890, photos: [S[1], S[2]], isNew: true, fabric: "Kanjivaram silk blend" },
  { name: "Ocean Blue Cotton Saree", cat: "saree", price: 1890, photos: [S[5], S[9]], fabric: "Handloom cotton" },
  { name: "Lavender Zari Saree", cat: "saree", price: 3190, photos: [S[6], S[7]], fabric: "Art silk with zari" },
  { name: "Peacock Teal Silk Saree", cat: "saree", price: 3690, photos: [S[7], S[6]], isNew: true, fabric: "Silk blend" },
  // Co-ord sets
  { name: "Pastel Garden Co-ord Set", cat: "co-ord-sets", price: 1690, photos: [C[0], C[4]], sizes: ["S", "M", "L", "XL"], isNew: true, fabric: "Cotton" },
  { name: "Pink Meadow Co-ord Set", cat: "co-ord-sets", price: 1590, compare: 1990, photos: [C[2], C[3]], sizes: ["S", "M", "L", "XL", "XXL"], deal: true, fabric: "Rayon" },
  { name: "Navy Bloom Co-ord Set", cat: "co-ord-sets", price: 1790, photos: [C[1], C[5]], sizes: ["M", "L", "XL"], fabric: "Cotton blend" },
  { name: "Petal Bow Co-ord Set", cat: "co-ord-sets", price: 1750, photos: [C[3], C[2]], sizes: ["S", "M", "L"], fabric: "Cotton" },
  // Frocks & kurtis (custom)
  { name: "Blush Anarkali Frock", cat: "frocks-kurtis", price: 1890, photos: [K[2], K[1]], isNew: true, fabric: "Georgette" },
  { name: "White Chikan Kurta Set", cat: "frocks-kurtis", price: 1390, photos: [K[0], K[6]], fabric: "Cotton with chikankari" },
  { name: "Wine Embroidered Kurti", cat: "frocks-kurtis", price: 990, compare: 1290, photos: [K[4], K[3]], deal: true, fabric: "Rayon" },
  { name: "Sunshine Yellow Kurta", cat: "frocks-kurtis", price: 1190, photos: [K[5], K[0]], fabric: "Cotton silk" },
  // Ready made
  { name: "Maroon Festive Anarkali Gown", cat: "ready-made", price: 3990, photos: [O[0], O[3]], sizes: ["S", "M", "L", "XL"], isNew: true, fabric: "Georgette" },
  { name: "Ivory Embroidered Lehenga", cat: "ready-made", price: 6490, photos: [O[2], O[4]], sizes: ["S", "M", "L"], fabric: "Net with sequin work" },
  { name: "Royal Blue Bridal Lehenga", cat: "ready-made", price: 12990, photos: [O[1], O[2]], sizes: ["S", "M", "L"], preorder: true, fabric: "Velvet with zardosi work" },
  { name: "Golden Hour Kurta Set", cat: "ready-made", price: 2790, photos: [O[3], U[7]], sizes: ["M", "L", "XL", "XXL"], fabric: "Cotton silk" },
  // Home linen
  { name: "Pure White Cotton Bedsheet Set", cat: "home-linen", price: 1190, photos: [L[0], L[2]], fabric: "100% cotton, king size, 2 pillow covers" },
  { name: "Soft Cloud Duvet Cover", cat: "home-linen", price: 1890, compare: 2290, photos: [L[1], L[0]], deal: true, fabric: "Cotton percale" },
  { name: "Linen Weave Bed Cover", cat: "home-linen", price: 1490, photos: [L[2], L[1]], fabric: "Cotton linen blend" },
  // Running material (₹ per metre)
  { name: "Jaipur Floral Print Cotton", cat: "running-material", price: 180, photos: [F[0], F[2]], stock: 120, isNew: true, fabric: "Cotton, 44 inch width" },
  { name: "Tangerine Bagh Print Fabric", cat: "running-material", price: 220, photos: [F[1], F[3]], stock: 80, fabric: "Cotton, 44 inch width" },
  { name: "Paisley Mul Cotton", cat: "running-material", price: 160, photos: [F[2], F[0]], stock: 60, fabric: "Mul cotton, 44 inch width" },
  { name: "Indigo Block Print Fabric", cat: "running-material", price: 240, photos: [F[3], F[4]], stock: 45, fabric: "Cotton, 44 inch width" },
  // Kids (custom)
  { name: "Little Marigold Pattu Pavadai", cat: "kids-dresses", price: 1290, photos: [D[0], D[1]], isNew: true, fabric: "Silk blend" },
  { name: "Sunshine Tiered Frock", cat: "kids-dresses", price: 990, photos: [D[2], D[0]], fabric: "Cotton with embroidery" },
  { name: "Festive Flower Frock", cat: "kids-dresses", price: 1150, compare: 1450, photos: [D[1], D[0]], deal: true, fabric: "Silk blend" },
];

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export const mockProducts: ProductWithRelations[] = SEEDS.map((s, i) => {
  const category = mockCategories.find((c) => c.slug === s.cat)!;
  const id = `prod-${i + 1}`;
  const images: ProductImage[] = s.photos.map((p, j) => ({
    id: `${id}-img-${j}`,
    product_id: id,
    storage_path: p,
    url: img(p),
    alt: s.name,
    sort_order: j,
  }));
  const sizes = s.sizes ?? [];
  const created = new Date(Date.UTC(2026, 10, 20) - i * 86_400_000).toISOString();
  return {
    id,
    slug: slug(s.name),
    name: s.name,
    description:
      category.product_type === "running_material"
        ? `${s.name}, sold by the metre. Perfect for kurtis, dresses and home décor. Placeholder description: replace with the real product details.`
        : `A beautiful piece from Amaris Boutique. Placeholder description: replace with the real product details, colour and work.`,
    category_id: category.id,
    product_type: category.product_type,
    price: s.price * 100,
    compare_at_price: s.compare ? s.compare * 100 : null,
    sizes,
    stock_qty: s.stock ?? 10,
    is_preorder: !!s.preorder,
    is_new_arrival: !!s.isNew,
    is_hot_deal: !!s.deal,
    is_active: true,
    stitching_available: category.product_type === "unstitched",
    stitching_charge: null,
    min_metres: category.product_type === "running_material" ? 1 : null,
    metre_step: category.product_type === "running_material" ? 0.5 : null,
    fabric: s.fabric ?? null,
    care_instructions: "Dry clean recommended for the first wash. Wash dark colours separately in cold water.",
    created_at: created,
    updated_at: created,
    category,
    images,
    variants: sizes.map((size) => ({ id: `${id}-${size}`, product_id: id, size, stock_qty: 5 })),
  };
});

export const mockSettings: ShopSettings = {
  default_stitching_charge: 50000,
  stitching_charge_by_category: {},
  domestic_shipping_fee: 10000,
  free_shipping_above: 299900,
  international_rates: { AE: 250000, US: 350000, GB: 350000 },
  cod_enabled: false,
};
