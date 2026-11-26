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
 * An item can have `soon` (a label for a section not built yet): it then shows a "Soon" tag and isn't a link.
 * Every section is built now, so no item uses it.
 */
export type AdminNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
  /** Key into the counts passed to the frame (e.g. orders waiting to be dispatched). */
  badge?: "toDispatch" | "pendingReviews";
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
      { href: "/admin/dispatch", label: "Dispatch", icon: Truck },
      { href: "/admin/production", label: "Stitching", icon: Scissors },
      { href: "/admin/customers", label: "Customers", icon: Users },
    ],
  },
  {
    group: "Catalogue",
    items: [
      { href: "/admin/products", label: "Products", icon: Package },
      { href: "/admin/inventory", label: "Inventory", icon: Boxes },
      { href: "/admin/categories", label: "Categories", icon: Tags },
      { href: "/admin/collections", label: "Collections", icon: Layers },
      { href: "/admin/sizes", label: "Size guide", icon: Ruler },
    ],
  },
  {
    group: "Marketing",
    items: [
      { href: "/admin/coupons", label: "Coupons", icon: TicketPercent },
      { href: "/admin/content", label: "Homepage", icon: LayoutTemplate },
      { href: "/admin/reviews", label: "Reviews", icon: Star, badge: "pendingReviews" },
    ],
  },
  {
    group: "Insights",
    items: [
      { href: "/admin/reports", label: "Reports", icon: ChartColumn },
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
