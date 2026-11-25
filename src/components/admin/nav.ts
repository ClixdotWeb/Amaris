import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Boxes,
  ChartColumn,
  Layers,
  LayoutDashboard,
  LayoutTemplate,
  Package,
  Ruler,
  Scissors,
  Settings,
  ShoppingBag,
  Star,
  Tags,
  TicketPercent,
  Truck,
  UserCog,
  Users,
} from "lucide-react";

/**
 * Sidebar sections, grouped as in docs/ADMIN_DASHBOARD_PLAN.md §5.
 * Sections whose phase isn't built yet have `soon` (the phase that builds them): they show a "Soon" tag
 * and are not links, so the menu never leads to a missing page.
 */
export type AdminNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
  /** Key into the counts passed to the frame (e.g. orders waiting to be dispatched). */
  badge?: "toDispatch";
  /** Not built yet: which phase builds it (shown as a tooltip). */
  soon?: string;
};
export type AdminNavCounts = Partial<Record<NonNullable<AdminNavItem["badge"]>, number>>;

export const adminNav: { group?: string; items: AdminNavItem[] }[] = [
  {
    items: [{ href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true }],
  },
  {
    group: "Sales",
    items: [
      { href: "/admin/orders", label: "Orders", icon: ShoppingBag, badge: "toDispatch" },
      { href: "/admin/orders/dispatch", label: "Dispatch", icon: Truck, soon: "Phase 4: Orders" },
      { href: "/admin/production", label: "Stitching", icon: Scissors, soon: "Phase 5: Stitching queue" },
      { href: "/admin/customers", label: "Customers", icon: Users, soon: "Phase 7: Customers" },
    ],
  },
  {
    group: "Catalogue",
    items: [
      { href: "/admin/products", label: "Products", icon: Package },
      { href: "/admin/inventory", label: "Inventory", icon: Boxes, soon: "Phase 3: Inventory" },
      { href: "/admin/categories", label: "Categories", icon: Tags, soon: "Phase 3: Catalogue" },
      { href: "/admin/collections", label: "Collections", icon: Layers, soon: "Phase 3: Catalogue" },
      { href: "/admin/sizes", label: "Size guide", icon: Ruler, soon: "Phase 3: Catalogue" },
    ],
  },
  {
    group: "Marketing",
    items: [
      { href: "/admin/coupons", label: "Coupons", icon: TicketPercent, soon: "Phase 8: Coupons & COD" },
      { href: "/admin/content", label: "Homepage", icon: LayoutTemplate, soon: "Phase 9: Content" },
      { href: "/admin/reviews", label: "Reviews", icon: Star, soon: "Phase 11: Reviews" },
    ],
  },
  {
    group: "Insights",
    items: [
      { href: "/admin/reports", label: "Reports", icon: ChartColumn, soon: "Phase 6: Reports" },
      { href: "/admin/activity", label: "Activity log", icon: Activity },
    ],
  },
  {
    group: "Settings",
    items: [
      { href: "/admin/settings", label: "Shop settings", icon: Settings },
      { href: "/admin/users", label: "Admins", icon: UserCog },
    ],
  },
];

export const isActive = (path: string, item: AdminNavItem) =>
  !item.soon && (item.exact ? path === item.href : path === item.href || path.startsWith(`${item.href}/`));

/** Title shown in the top bar for the current page. */
export function sectionTitle(path: string) {
  if (path.startsWith("/admin/search")) return "Search";
  for (const g of adminNav) for (const i of g.items) if (isActive(path, i)) return i.label;
  return "Admin";
}
