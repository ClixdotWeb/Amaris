"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { Lotus } from "@/components/ui/Lotus";
import { adminNav, isActive, type AdminNavCounts, type AdminNavItem } from "./nav";

/**
 * Sidebar menu: every section as a row under its group name (no dropdowns). On short screens the menu scrolls
 * inside the sidebar, with soft fades showing there is more, and the current page is scrolled into view.
 *  - The current page is a solid gold-light pill with burgundy text; it glides to the item you click.
 *  - Sections not built yet show "Soon" and are not links.
 */
export function SidebarNav({ path, compact, counts }: { path: string; compact: boolean; counts: AdminNavCounts }) {
  const scroller = useRef<HTMLElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const [mark, setMark] = useState<{ top: number; height: number } | null>(null);
  const [animate, setAnimate] = useState(false);
  // The item just clicked: the pill glides there at once, before the new page has loaded
  const [target, setTarget] = useState<string | null>(null);
  const [fade, setFade] = useState({ top: false, bottom: false });

  useLayoutEffect(() => setTarget(null), [path]);
  useLayoutEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const measure = () => {
      const a = (target && el.querySelector<HTMLElement>(`[data-href="${target}"]`)) || el.querySelector<HTMLElement>("[aria-current=page]");
      if (!a) return setMark(null);
      const box = el.getBoundingClientRect();
      const r = a.getBoundingClientRect();
      setMark({ top: r.top - box.top, height: r.height });
    };
    measure();
    const t = requestAnimationFrame(() => setAnimate(true));
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => {
      cancelAnimationFrame(t);
      ro.disconnect();
    };
  }, [path, compact, target]);

  // Fades at the top/bottom edge while there is more to scroll; keep the current page in view
  useEffect(() => {
    const sc = scroller.current;
    if (!sc) return;
    const update = () => setFade({ top: sc.scrollTop > 4, bottom: sc.scrollTop + sc.clientHeight < sc.scrollHeight - 4 });
    update();
    // centre the current page in the menu (clear of the edge fades)
    const cur = sc.querySelector<HTMLElement>("[aria-current=page]");
    if (cur) sc.scrollTop = cur.offsetTop - sc.clientHeight / 2 + cur.offsetHeight / 2;
    sc.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(sc);
    return () => {
      sc.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, [path, compact]);

  const item = (it: AdminNavItem) => {
    const current = isActive(path, it);
    const active = current || target === it.href;
    const Icon = it.icon;
    const count = it.badge ? counts[it.badge] : undefined;
    const base = `relative z-10 flex h-10 items-center rounded-[10px] text-[12px] font-medium tracking-[0.12em] uppercase ${compact ? "justify-center px-0" : "gap-3 px-3"}`;

    if (it.soon)
      return (
        <li key={it.href}>
          <span className={`${base} cursor-default text-ivory/60`} title={`${it.label}: coming in ${it.soon}`}>
            <Icon size={17} strokeWidth={1.5} aria-hidden className="shrink-0" />
            <span className={compact ? "sr-only" : "flex-1 truncate"}>{it.label}</span>
            {compact ? (
              <span className="sr-only">, coming soon</span>
            ) : (
              <span className="rounded-full bg-white/[0.08] px-2 py-0.5 text-[9px] tracking-[0.14em] text-ivory/75 uppercase">Soon</span>
            )}
          </span>
        </li>
      );

    return (
      <li key={it.href}>
        <Link
          href={it.href}
          data-href={it.href}
          onClick={() => setTarget(it.href)}
          aria-current={current ? "page" : undefined}
          title={compact ? `${it.label}${count ? ` (${count})` : ""}` : undefined}
          className={`group/nav ${base} transition-colors duration-300 ${active ? "font-semibold text-maroon-dark" : "text-ivory/95 hover:bg-white/[0.07] hover:text-white"}`}
        >
          <Icon
            size={17}
            strokeWidth={active ? 1.8 : 1.5}
            aria-hidden
            className={`shrink-0 transition-[color,transform] duration-300 ease-soft ${
              active ? "text-maroon" : "text-ivory/85 group-hover/nav:translate-x-0.5 group-hover/nav:text-white"
            }`}
          />
          <span className={compact ? "sr-only" : "flex-1 truncate"}>{it.label}</span>
          {!!count &&
            (compact ? (
              <span aria-hidden className="absolute top-1.5 right-2 h-2 w-2 rounded-full bg-gold-light ring-2 ring-maroon-dark" />
            ) : (
              <span
                className={`min-w-6 rounded-full px-2 py-0.5 text-center text-[11px] font-medium transition-colors ${
                  active ? "bg-maroon text-white" : "bg-gold-light text-maroon-dark"
                }`}
              >
                {count}
                <span className="sr-only"> waiting</span>
              </span>
            ))}
        </Link>
      </li>
    );
  };

  return (
    <div className="relative min-h-0 flex-1">
      <nav
        ref={scroller}
        aria-label="Admin"
        className={`h-full overflow-y-auto py-3 [scrollbar-color:rgb(238_220_207/0.22)_transparent] [scrollbar-width:thin] ${compact ? "px-3" : "px-3.5"}`}
      >
        <div ref={wrap} className="relative">
          {/* The current page: a solid gold-light pill that glides */}
          {mark && (
            <span
              aria-hidden
              className={`neu-pill pointer-events-none absolute inset-x-0 top-0 z-0 rounded-[12px] ${
                animate ? "transition-[transform,height] duration-500 ease-soft" : ""
              }`}
              style={{ transform: `translateY(${mark.top}px)`, height: mark.height }}
            />
          )}

          {adminNav.map((g, gi) => {
            // Collapsed rail: only the sections that are ready (icons only), so it fits
            const items = compact ? g.items.filter((i) => !i.soon) : g.items;
            if (!items.length) return null;
            return (
              <div key={gi} className={gi ? (compact ? "mt-3 border-t border-white/10 pt-3" : "mt-5") : ""}>
                {g.group && !compact && (
                  <p className="mb-1 flex items-center gap-2 px-3 text-[10px] font-medium tracking-[0.28em] text-gold-light/90 uppercase">
                    <Lotus width={13} height={9} className="shrink-0 text-gold-light/80" />
                    {g.group}
                  </p>
                )}
                <ul className="space-y-0.5">{items.map(item)}</ul>
              </div>
            );
          })}
        </div>
      </nav>
      {/* Soft fades at the edges while the menu can scroll further */}
      <span
        aria-hidden
        className={`pointer-events-none absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-maroon-dark to-transparent transition-opacity duration-300 ${fade.top ? "opacity-100" : "opacity-0"}`}
      />
      <span
        aria-hidden
        className={`pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-maroon-dark to-transparent transition-opacity duration-300 ${fade.bottom ? "opacity-100" : "opacity-0"}`}
      />
    </div>
  );
}
