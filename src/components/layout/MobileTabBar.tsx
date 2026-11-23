"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, Search, Flame, ShoppingBag } from "lucide-react";
import { useCart } from "@/components/cart/CartProvider";

/** Fixed bottom bar on phones (like the reference site). */
export function MobileTabBar() {
  const path = usePathname();
  const { count } = useCart();
  const tabs = [
    { href: "/", label: "Home", icon: Home },
    { href: "/#categories", label: "Categories", icon: LayoutGrid },
    { href: "/search", label: "Search", icon: Search },
    { href: "/hot-deals", label: "Deals", icon: Flame },
    { href: "/cart", label: "Cart", icon: ShoppingBag, badge: count },
  ];
  return (
    <nav
      aria-label="Quick links"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-sand bg-ivory/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
    >
      <ul className="grid grid-cols-5">
        {tabs.map(({ href, label, icon: Icon, badge }) => {
          const active = href === "/" ? path === "/" : path.startsWith(href.replace("/#categories", "/__"));
          return (
            <li key={href}>
              <Link
                href={href}
                className={`relative flex flex-col items-center gap-1 py-2.5 text-[10px] tracking-wider uppercase ${active ? "text-maroon" : "text-muted"}`}
              >
                <Icon size={20} strokeWidth={1.5} />
                {label}
                {!!badge && (
                  <span className="absolute top-1.5 left-1/2 ml-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-maroon px-1 text-[9px] text-white">
                    {badge}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
