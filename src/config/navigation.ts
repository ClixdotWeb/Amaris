import type { ProductType } from "@/types";

/**
 * Category list. Mirrors the `categories` table seed (supabase/seed.sql).
 * Slugs must match the DB. `productType` decides which purchase options the product page shows.
 */
export const categories: { slug: string; name: string; productType: ProductType }[] = [
  { slug: "unstitched-salwar-suits", name: "Unstitched – Salwar Suits", productType: "unstitched" },
  { slug: "co-ord-sets", name: "Co-ord Sets", productType: "ready_made" },
  { slug: "frocks-kurtis", name: "Frocks & Kurtis – Custom Made", productType: "custom_made" },
  { slug: "ready-made", name: "Ready Made", productType: "ready_made" },
  { slug: "saree", name: "Saree", productType: "ready_made" },
  { slug: "home-linen", name: "Home Linen", productType: "ready_made" },
  { slug: "running-material", name: "Running Material", productType: "running_material" },
  { slug: "kids-dresses", name: "Kids Dresses – Custom Made", productType: "custom_made" },
];

/* ───────────── Header navigation (5 items; the logo links home) ───────────── */

export type NavLink = { label: string; href: string; tone?: "sale" };
/** A link inside a group. `slug` = category slug, used to look up its thumbnail. */
export type NavChild = { label: string; href: string; slug: string };
export type NavGroup = { label: string; kind: "mega" | "dropdown"; children: NavChild[]; viewAll?: NavLink };
export type HeaderNavItem = NavLink | NavGroup;

export const isGroup = (i: HeaderNavItem): i is NavGroup => "children" in i;

const cat = (slug: string, label: string): NavChild => ({ label, href: `/shop/${slug}`, slug });

export const headerNav: HeaderNavItem[] = [
  { label: "New Arrivals", href: "/new-arrivals" },
  {
    label: "Collections",
    kind: "dropdown",
    children: [
      cat("unstitched-salwar-suits", "Unstitched Suits"),
      cat("co-ord-sets", "Co-ord Sets"),
      cat("frocks-kurtis", "Frocks & Kurtis"),
      cat("ready-made", "Ready Made"),
      cat("saree", "Saree"),
    ],
  },
  { label: "Kids", href: "/shop/kids-dresses" },
  {
    label: "Fabric & Home",
    kind: "dropdown",
    children: [cat("running-material", "Running Material"), cat("home-linen", "Home Linen")],
  },
  { label: "Hot Deals", href: "/hot-deals", tone: "sale" },
];

export const footerNav = {
  help: [
    { label: "Track Order", href: "/track-order" },
    { label: "Contact Us", href: "/contact" },
    { label: "My Account", href: "/account" },
  ],
  policies: [
    { label: "Return & Refund Policy", href: "/policies/return-refund" },
    { label: "Shipping Policy", href: "/policies/shipping" },
    { label: "Privacy Policy", href: "/policies/privacy" },
    { label: "Terms of Service", href: "/policies/terms" },
  ],
};
