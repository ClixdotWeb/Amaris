import type { HomeContent, SizeChartData } from "@/types";
export { DEFAULT_WALLPAPER_URL, wallpaperCss } from "./wallpaper";
import { cloudImage, PHOTO_WIDE } from "@/lib/images";
import { categoryPhoto } from "@/lib/data/mock";
import { SIZE_CHART } from "@/config/shop";

/**
 * The shop's built-in home page content. Used to seed the dashboard's content editor and as the
 * fallback whenever a field is left empty there, so the home page never shows a blank.
 */
export const DEFAULT_HOME: HomeContent = {
  hero: [
    {
      left: "ready",
      right: "to wear",
      tagline: "Handpicked in Kerala",
      description: "Anarkalis and salwar sets, ready to wear and dispatched within 48 hours.",
      href: "/shop/ready-made",
      image_url: cloudImage("/Assets/hero/hero-readymade-black-chikankari.jpg", PHOTO_WIDE),
      position: "36% 50%",
    },
    {
      left: "heritage",
      right: "drapes",
      tagline: "Handpicked in Kerala",
      description: "From classic Kerala kasavu to festive silks, draped in timeless grace.",
      href: "/shop/saree",
      image_url: cloudImage("/Assets/hero/hero-saree-red-banarasi.jpg", PHOTO_WIDE),
      position: "60% 50%",
    },
    {
      left: "tailored",
      right: "for you",
      tagline: "Handpicked in Kerala",
      description: "Choose your fabric and we stitch it to your size or exact measurements.",
      href: "/shop/unstitched-salwar-suits",
      image_url: cloudImage("/Assets/hero/hero-suit-yellow-garden.jpg", PHOTO_WIDE),
      position: "71% 50%",
    },
  ],
  announcements: [
    "In-stock items dispatched within 48 hours",
    "Delivered across India by India Post",
    "Custom stitching to your measurements",
    "Secure payments by Razorpay",
  ],
  promo_tiles: [
    { eyebrow: "Made to order", title: "Kids Dresses", href: "/shop/kids-dresses", image_url: categoryPhoto("kids-dresses", 1100) ?? "" },
    { eyebrow: "For your home", title: "Home Linen", href: "/shop/home-linen", image_url: categoryPhoto("home-linen", 1100) ?? "" },
  ],
  featured_collection_ids: [],
  wallpaper: { mode: "default", image_url: "", strength: 45, size: 662 },
};

/** The client's size chart (config/shop.ts), as the first chart in the size guide. */
export const DEFAULT_SIZE_CHART: Omit<SizeChartData, "id"> = {
  name: "Women's standard sizes",
  unit: "inches",
  sizes: [...SIZE_CHART.sizes],
  rows: SIZE_CHART.rows.map((r) => ({ label: r.label, values: [...r.values] })),
  note: SIZE_CHART.note,
  category_slugs: ["unstitched-salwar-suits", "co-ord-sets", "frocks-kurtis", "ready-made"],
};

/** Merge saved content over the defaults, field by field, so an empty field shows the default. */
export function withDefaults(c: Partial<HomeContent> | null | undefined): HomeContent {
  const pick = (v: string | undefined, d: string) => (v && v.trim() ? v : d);
  return {
    hero: DEFAULT_HOME.hero.map((d, i) => {
      const s = c?.hero?.[i];
      return {
        left: pick(s?.left, d.left),
        right: pick(s?.right, d.right),
        tagline: pick(s?.tagline, d.tagline),
        description: pick(s?.description, d.description),
        href: pick(s?.href, d.href),
        image_url: pick(s?.image_url, d.image_url),
        // A new photo without its own focus point is centred
        position: pick(s?.position, s?.image_url && s.image_url !== d.image_url ? "50% 40%" : d.position),
      };
    }),
    announcements: c?.announcements?.filter((a) => a.trim()).length ? c.announcements.filter((a) => a.trim()) : DEFAULT_HOME.announcements,
    promo_tiles: DEFAULT_HOME.promo_tiles.map((d, i) => {
      const s = c?.promo_tiles?.[i];
      return { eyebrow: pick(s?.eyebrow, d.eyebrow), title: pick(s?.title, d.title), href: pick(s?.href, d.href), image_url: pick(s?.image_url, d.image_url) };
    }),
    featured_collection_ids: c?.featured_collection_ids ?? [],
    wallpaper: { ...DEFAULT_HOME.wallpaper, ...(c?.wallpaper ?? {}) },
  };
}
