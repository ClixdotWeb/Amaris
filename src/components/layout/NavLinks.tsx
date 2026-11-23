"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, ArrowRight } from "lucide-react";
import { isGroup, type HeaderNavItem, type NavGroup } from "@/config/navigation";

const linkBase =
  "nav-link relative inline-flex items-center gap-1.5 py-1 text-[12px] tracking-[0.18em] uppercase whitespace-nowrap transition-colors " +
  "after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-left after:bg-maroon after:transition-transform after:duration-300";

const underline = (active: boolean) => (active ? "text-maroon after:scale-x-100" : "after:scale-x-0 hover:after:scale-x-100");

const groupActive = (g: NavGroup, path: string) => g.children.some((c) => path.startsWith(c.href));

/**
 * Desktop header nav: plain links, a mega menu (with thumbnails) and a dropdown.
 * Opens on hover, on keyboard focus and on click/tap; Escape or leaving closes it.
 */
export function NavLinks({ items, images }: { items: HeaderNavItem[]; images: Record<string, string | undefined> }) {
  const path = usePathname();
  const [open, setOpen] = useState<number | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => setOpen(null), [path]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const enter = (n: number) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(n);
  };
  const leave = () => {
    closeTimer.current = setTimeout(() => setOpen(null), 120);
  };

  return (
    <ul className="flex h-full items-center justify-center gap-x-8 xl:gap-x-11">
      {items.map((item, n) => {
        if (!isGroup(item)) {
          const active = path.startsWith(item.href);
          return (
            <li key={item.href} className="flex h-full items-center">
              <Link
                href={item.href}
                className={`${linkBase} ${underline(active)} ${item.tone === "sale" ? "nav-link-sale font-medium text-sale after:bg-sale" : "hover:text-maroon"}`}
              >
                {item.label}
              </Link>
            </li>
          );
        }

        const isOpen = open === n;
        const active = groupActive(item, path);
        const panelId = `nav-panel-${n}`;
        return (
          <li
            key={item.label}
            className={`flex h-full items-center ${item.kind === "dropdown" ? "relative" : ""}`}
            onMouseEnter={() => enter(n)}
            onMouseLeave={leave}
            onFocus={() => enter(n)}
            onBlur={(e) => !e.currentTarget.contains(e.relatedTarget as Node) && setOpen(null)}
          >
            <button
              type="button"
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => setOpen(isOpen ? null : n)}
              className={`${linkBase} ${underline(active || isOpen)} hover:text-maroon`}
            >
              {item.label}
              <ChevronDown size={13} strokeWidth={1.5} className={`transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
            </button>

            {item.kind === "mega" ? (
              <div
                id={panelId}
                className={`absolute inset-x-0 top-full z-50 border-t border-sand bg-ivory text-ink shadow-[0_24px_40px_-24px_rgba(43,42,44,0.25)] transition-all duration-300 ${
                  isOpen ? "visible translate-y-0 opacity-100" : "invisible -translate-y-1 opacity-0"
                }`}
              >
                <div className="container-x py-10">
                  {/* Fixed-width cards, centred: same card size whether a group has 2 or 5 items */}
                  <ul className="mx-auto flex max-w-5xl justify-center gap-6">
                    {item.children.map((c) => (
                      <li key={c.href} className="w-[185px] shrink-0">
                        <Link href={c.href} className="group/card block text-center">
                          <span className="block aspect-[3/4] overflow-hidden rounded-[3px] bg-cream">
                            {images[c.slug] && (
                              <img
                                src={images[c.slug]}
                                alt=""
                                loading="lazy"
                                className="h-full w-full object-cover transition-transform duration-700 group-hover/card:scale-105"
                              />
                            )}
                          </span>
                          <span
                            className={`mt-3.5 inline-block text-[11px] tracking-[0.2em] uppercase transition-colors group-hover/card:text-maroon ${
                              path.startsWith(c.href) ? "text-maroon" : ""
                            }`}
                          >
                            {c.label}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div
                id={panelId}
                className={`absolute top-full left-1/2 z-50 w-60 -translate-x-1/2 pt-px transition-all duration-300 ${
                  isOpen ? "visible translate-y-0 opacity-100" : "invisible -translate-y-1 opacity-0"
                }`}
              >
                <ul className="rounded-[3px] border border-sand bg-ivory py-2 text-ink shadow-[0_20px_40px_-20px_rgba(43,42,44,0.25)]">
                  {item.children.map((c) => (
                    <li key={c.href}>
                      <Link
                        href={c.href}
                        className={`group/item flex items-center justify-between px-5 py-3 text-[11px] tracking-[0.18em] uppercase transition-colors hover:bg-cream hover:text-maroon ${
                          path.startsWith(c.href) ? "text-maroon" : ""
                        }`}
                      >
                        {c.label}
                        <ArrowRight size={13} strokeWidth={1.5} className="-translate-x-1 opacity-0 transition-all group-hover/item:translate-x-0 group-hover/item:opacity-100" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
