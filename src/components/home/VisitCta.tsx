import Link from "next/link";
import { ArrowRight, MessageCircle } from "lucide-react";
import { whatsappLink } from "@/config/site";
import { WordReveal } from "@/components/ui/WordReveal";

/**
 * Final call-to-action: "Visit the boutique". Centred, minimal copy.
 * Background: public/Assets/banner-cta-hq.webp (sharpened 2x of "banner cta.jpg", client artwork).
 */
export function VisitCta() {
  return (
    <section className="container-x pt-28" aria-labelledby="visit-title">
      <div data-reveal className="group relative isolate flex min-h-[520px] items-center justify-center overflow-hidden rounded-[3px] bg-[#1c0a0b] md:min-h-[600px]">
        <img
          src="/Assets/banner-cta-hq.webp"
          alt=""
          aria-hidden
          loading="lazy"
          data-parallax="0.12"
          className="absolute inset-x-0 -top-[10%] -z-10 h-[120%] w-full object-cover object-[45%_40%] transition-[scale] duration-[2400ms] ease-out group-hover:scale-[1.04]"
        />
        {/* Shade for legibility: even darkening + soft vignette, no blur */}
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_65%_70%_at_50%_50%,rgba(20,6,7,0.45)_0%,rgba(20,6,7,0.7)_100%)]"
        />
        {/* Hairline frame, as on the atelier banner */}
        <div aria-hidden className="pointer-events-none absolute inset-4 rounded-[2px] border border-[#ecc7ae]/25 md:inset-6" />

        <div data-reveal-stagger className="relative px-6 py-20 text-center">
          <p className="text-[10px] tracking-[0.5em] text-[#ead3c3] uppercase md:text-[11px]">Visit the boutique</p>
          <h2 id="visit-title" className="mt-6 font-display text-5xl leading-[1.02] font-light text-[#f8f1ea] md:text-7xl">
            <WordReveal text="See it" />{" "}
            <em className="text-[#ecc7ae]">
              <WordReveal text="in person" startIndex={2} />
            </em>
          </h2>
          <span aria-hidden className="mx-auto mt-7 block h-px w-14 bg-[#ecc7ae]/70" />
          <p className="mt-7 text-sm leading-relaxed text-[#f8f1ea]/80 md:text-base">Paika Central Junction, Kerala</p>
          <p className="mt-1 text-[11px] tracking-[0.25em] text-[#f8f1ea]/55 uppercase">Mon – Sat · 10 AM – 5 PM</p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/contact"
              className="group/btn inline-flex items-center gap-3 rounded-[3px] bg-[#f8f1ea] px-7 py-3.5 text-[11px] tracking-[0.28em] text-[#350f10] uppercase transition-colors duration-300 hover:bg-[#ecc7ae]"
            >
              Get directions
              <ArrowRight size={14} strokeWidth={1.5} className="transition-transform duration-300 group-hover/btn:translate-x-1" />
            </Link>
            <a
              href={whatsappLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 rounded-[3px] border border-[#f8f1ea]/55 px-7 py-3.5 text-[11px] tracking-[0.28em] text-[#f8f1ea] uppercase transition-colors duration-300 hover:border-[#f8f1ea] hover:bg-[#f8f1ea] hover:text-[#350f10]"
            >
              <MessageCircle size={14} strokeWidth={1.5} />
              WhatsApp us
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
