import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { WordReveal } from "@/components/ui/WordReveal";
import { cloudImage, PHOTO_WIDE } from "@/lib/images";

/** Wall colour sampled from the banner photo (fallback while the photo loads). */
const WALL = "#350f10";

/**
 * Stitching-service banner: the hanger photo fills the whole banner, copy centred on top.
 * A soft burgundy shade concentrated in the middle keeps the text readable while the hanger stays visible.
 * Photo: amaris/site/banner-hq on Cloudinary (local copy public/Assets/banner-hq.webp).
 */
export function AtelierBanner() {
  return (
    <section className="container-x py-24 md:py-28" aria-labelledby="atelier-title">
      <div
        data-reveal
        className="group relative isolate flex min-h-[540px] items-center justify-center overflow-hidden rounded-[3px] md:min-h-[640px]"
        style={{ backgroundColor: WALL }}
      >
        {/* Full-bleed photo (curtain reveal + parallax) */}
        <div data-reveal="curtain" className="absolute inset-0 -z-10 overflow-hidden">
          <img
            src={cloudImage("/Assets/banner-hq.webp", PHOTO_WIDE)}
            alt="Amaris velvet hanger on a maroon panelled wall"
            loading="lazy"
            decoding="async"
            data-parallax="0.1"
            className="absolute inset-x-0 -top-[10%] h-[120%] w-full object-cover object-[50%_35%] transition-[scale] duration-[2400ms] ease-out group-hover:scale-[1.03]"
          />
        </div>

        {/* Shade: gentle overall + deeper in the centre, behind the copy */}
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_40%_48%_at_50%_52%,rgba(28,8,9,0.82)_0%,rgba(28,8,9,0.5)_60%,rgba(28,8,9,0.22)_100%)]"
        />

        {/* Hairline frame */}
        <div aria-hidden className="pointer-events-none absolute inset-4 rounded-[2px] border border-[#e3bfa6]/25 md:inset-6" />

        {/* Copy, centred */}
        <div data-reveal-stagger className="relative flex flex-col items-center px-8 py-20 text-center">
          <p className="text-[10px] tracking-[0.45em] text-[#e9cdb9] uppercase md:text-[11px]">The Amaris Atelier</p>
          <h2
            id="atelier-title"
            className="mt-6 font-display text-5xl leading-[1.02] font-light text-[#f8f1ea] [text-shadow:0_2px_30px_rgba(20,6,7,0.5)] md:text-7xl"
          >
            <WordReveal text="Made to" />{" "}
            <em className="text-[#ecc7ae]">
              <WordReveal text="measure" startIndex={2} />
            </em>
          </h2>
          <p className="mt-8 max-w-xs text-sm leading-relaxed text-[#f8f1ea]/80 md:text-base">Your fabric, tailored to your exact fit.</p>
          <Link
            href="/shop/unstitched-salwar-suits"
            className="group/btn mt-10 inline-flex items-center gap-3 rounded-[3px] border border-[#f8f1ea]/55 px-7 py-3.5 text-[11px] tracking-[0.28em] text-[#f8f1ea] uppercase transition-colors duration-300 hover:border-[#f8f1ea] hover:bg-[#f8f1ea] hover:text-[#350f10]"
          >
            Begin your fitting
            <ArrowRight size={14} strokeWidth={1.5} className="transition-transform duration-300 group-hover/btn:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}
