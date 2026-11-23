"use client";
import { useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Tone = "light" | "dark";

const ARROW: Record<Tone, string> = {
  light: "border-sand bg-ivory text-ink shadow-sm hover:border-maroon hover:bg-maroon hover:text-white",
  // On burgundy: transparent with a rose-gold ring, fills rose gold on hover (logo palette)
  dark: "border-[#d9a587]/45 bg-[#350f10]/60 text-[#f8f1ea] backdrop-blur-sm hover:border-[#d9a587] hover:bg-[#d9a587] hover:text-[#350f10]",
};

const VIEW_ALL: Record<Tone, string> = {
  light: "btn-outline",
  dark: "inline-flex items-center justify-center rounded-[3px] border border-[#d9a587]/60 px-7 py-3.5 text-[11px] tracking-[0.28em] text-[#f8f1ea] uppercase transition-colors duration-300 hover:border-[#d9a587] hover:bg-[#d9a587] hover:text-[#350f10]",
};

/** Horizontal product carousel with arrows + "View all". Cards are passed in as children (server-rendered). */
export function ProductRail({
  children,
  viewAllHref,
  tone = "light",
}: {
  children: React.ReactNode;
  viewAllHref: string;
  /** "dark" = on a burgundy section */
  tone?: Tone;
}) {
  const ref = useRef<HTMLUListElement>(null);
  const scroll = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.8, behavior: "smooth" });
  const arrow = `absolute top-[38%] hidden h-11 w-11 items-center justify-center rounded-full border transition-colors duration-300 md:flex ${ARROW[tone]}`;

  return (
    <div className="relative">
      <ul
        data-reveal-stagger
        ref={ref}
        className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 px-4 md:mx-0 md:gap-6 md:px-0 lg:gap-10"
      >
        {children}
      </ul>
      <button type="button" aria-label="Previous" onClick={() => scroll(-1)} className={`${arrow} -left-5`}>
        <ChevronLeft size={20} strokeWidth={1.5} />
      </button>
      <button type="button" aria-label="Next" onClick={() => scroll(1)} className={`${arrow} -right-5`}>
        <ChevronRight size={20} strokeWidth={1.5} />
      </button>
      <div data-reveal className="mt-12 text-center">
        <Link href={viewAllHref} className={VIEW_ALL[tone]}>
          View all
        </Link>
      </div>
    </div>
  );
}

export function RailItem({ children }: { children: React.ReactNode }) {
  return <li className="w-[46%] shrink-0 snap-start sm:w-[31%] lg:w-[calc(25%-30px)]">{children}</li>;
}
