"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { NavProgress } from "./NavProgress";

/**
 * Sticky header wrapper.
 * - data-scrolled: once the page moves, the bar slims down and gains a shadow.
 * - data-overlay: on the home page, before scrolling, the bar is transparent over the hero
 *   (white text/logo while the hero shows dark footage; see globals.css "Transparent header").
 */
export function HeaderShell({ children }: { children: React.ReactNode }) {
  const [scrolled, setScrolled] = useState(false);
  const isHome = usePathname() === "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      data-scrolled={scrolled}
      data-overlay={isHome && !scrolled}
      className="group/header sticky top-0 z-50 border-b border-sand/80 bg-ivory/95 backdrop-blur transition-[background-color,border-color,box-shadow,color] duration-500 data-[scrolled=true]:shadow-[0_10px_30px_-18px_rgba(43,42,44,0.35)]"
    >
      <NavProgress />
      {children}
    </header>
  );
}
