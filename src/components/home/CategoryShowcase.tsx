"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";

export type ShowcaseItem = { slug: string; name: string; tag?: string; description?: string | null; image?: string };

const pad = (n: number) => String(n + 1).padStart(2, "0");

/**
 * "Shop by category" as an editorial index:
 * desktop: numbered list of names (left) + one large framed photo that cross-fades to the hovered/focused category;
 * mobile/tablet: swipeable portrait cards.
 */
export function CategoryShowcase({ items }: { items: ShowcaseItem[] }) {
  const [active, setActive] = useState(0);
  const current = items[active];

  return (
    <>
      {/* ── Desktop: index + live preview ── */}
      <div className="hidden gap-16 lg:grid lg:grid-cols-[1.15fr_1fr] xl:gap-24">
        <ul data-reveal-stagger className="border-t border-sand">
          {items.map((c, i) => {
            const on = i === active;
            return (
              <li key={c.slug} className="border-b border-sand">
                <Link
                  href={`/shop/${c.slug}`}
                  onMouseEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  className="group/row flex items-center gap-6 py-[1.05rem] xl:py-5"
                >
                  <span className={`w-8 font-display text-sm italic transition-colors duration-500 ${on ? "text-maroon" : "text-gold"}`}>
                    {pad(i)}
                  </span>
                  <span
                    className={`font-display text-[2.1rem] leading-none font-light transition-all duration-500 xl:text-[2.4rem] ${
                      on ? "translate-x-2 text-maroon" : "text-ink/45 group-hover/row:text-ink"
                    }`}
                  >
                    {c.name}
                  </span>
                  {c.tag && (
                    <span
                      className={`hidden text-[10px] tracking-[0.25em] uppercase transition-opacity duration-500 xl:inline ${on ? "text-gold opacity-100" : "opacity-0"}`}
                    >
                      {c.tag}
                    </span>
                  )}
                  <ArrowUpRight
                    size={22}
                    strokeWidth={1.2}
                    className={`ml-auto transition-all duration-500 ${on ? "translate-x-0 text-maroon opacity-100" : "-translate-x-2 opacity-0"}`}
                  />
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Preview */}
        <div className="flex flex-col">
          <div data-reveal="curtain" className="relative flex-1 overflow-hidden rounded-[3px] bg-cream">
            <div className="absolute inset-0">
              {items.map((c, i) => (
                <img
                  key={c.slug}
                  src={c.image}
                  alt={i === active ? c.name : ""}
                  aria-hidden={i !== active}
                  loading="lazy"
                  className={`absolute inset-0 h-full w-full object-cover object-[50%_18%] transition-[opacity,scale] duration-[1100ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
                    i === active ? "scale-100 opacity-100" : "scale-[1.06] opacity-0"
                  }`}
                />
              ))}
            </div>
            <div aria-hidden className="pointer-events-none absolute inset-4 rounded-[2px] border border-white/40" />
          </div>
          <div className="mt-5 flex items-end justify-between gap-6">
            <p key={current.slug} className="max-w-xs animate-fade-up text-sm leading-relaxed text-muted">
              {current.description}
            </p>
            <Link
              href={`/shop/${current.slug}`}
              className="group/btn inline-flex shrink-0 items-center gap-2 border-b border-ink pb-1 text-[11px] tracking-[0.22em] uppercase transition-colors hover:border-maroon hover:text-maroon"
            >
              Explore
              <ArrowRight size={13} strokeWidth={1.5} className="transition-transform group-hover/btn:translate-x-1" />
            </Link>
          </div>
        </div>
      </div>

      {/* ── Mobile / tablet: swipeable portrait cards ── */}
      <ul data-reveal-stagger className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 px-4 lg:hidden">
        {items.map((c, i) => (
          <li key={c.slug} className="w-[62%] shrink-0 snap-start sm:w-[38%]">
            <Link href={`/shop/${c.slug}`} className="group block">
              <span className="relative block aspect-[3/4] overflow-hidden rounded-[3px] bg-cream">
                {c.image && <img src={c.image} alt="" loading="lazy" className="h-full w-full object-cover" />}
                <span className="absolute inset-0 bg-gradient-to-t from-[#1c0a0b]/70 via-transparent to-transparent" />
                <span className="absolute top-3 left-4 font-display text-sm text-[#f8f1ea]/85 italic">{pad(i)}</span>
                <span className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-2 text-[#f8f1ea]">
                  <span className="font-display text-2xl leading-tight">{c.name}</span>
                  <ArrowUpRight size={18} strokeWidth={1.3} className="mb-1 shrink-0" />
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
