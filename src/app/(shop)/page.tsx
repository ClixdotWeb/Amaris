import Link from "next/link";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { listProducts } from "@/lib/data/products";
import { categoryPhoto } from "@/lib/data/mock";
import { VisitCta } from "@/components/home/VisitCta";
import { WordReveal } from "@/components/ui/WordReveal";
import fs from "node:fs";
import path from "node:path";
import { HeroEditorial, type EditorialSlide } from "@/components/home/HeroEditorial";
import { CategoryCircles } from "@/components/home/CategoryCircles";
import { ProductRail, RailItem } from "@/components/home/ProductRail";
import { SectionHeading } from "@/components/home/SectionHeading";
import { AtelierBanner } from "@/components/home/AtelierBanner";
import { ProductCard } from "@/components/product/ProductCard";
import type { ProductWithRelations } from "@/types";

/** Only reference a video if the file is really there (otherwise the slide shows its poster). */
const publicFile = (p: string) => (fs.existsSync(path.join(process.cwd(), "public", p)) ? p : undefined);

/**
 * Editorial hero slides. Drop videos into public/videos/ with these names and they are used automatically:
 * hero-ready.mp4 / hero-ready-mobile.mp4 (9:16), hero-saree(.mp4|-mobile.mp4), hero-stitching(.mp4|-mobile.mp4).
 * Without a video, slides show the boutique's campaign photos from public/Assets/hero/.
 */
function heroSlides(): EditorialSlide[] {
  return [
    {
      left: "ready",
      right: "to wear",
      tagline: "Handpicked in Kerala",
      description: "Anarkalis and salwar sets, ready to wear and dispatched within 48 hours.",
      href: "/shop/ready-made",
      // Boutique campaign photo (public/Assets/hero). Phones crop to the outfit.
      poster: "/Assets/hero/hero-readymade-black-chikankari.jpg",
      posterPosition: "36% 50%",
      video: publicFile("/videos/hero-ready.mp4"),
      videoMobile: publicFile("/videos/hero-ready-mobile.mp4"),
    },
    {
      left: "heritage",
      right: "drapes",
      tagline: "Handpicked in Kerala",
      description: "From classic Kerala kasavu to festive silks, draped in timeless grace.",
      href: "/shop/saree",
      // Boutique campaign photo (public/Assets/hero). Phones crop to the outfit.
      poster: "/Assets/hero/hero-saree-red-banarasi.jpg",
      posterPosition: "60% 50%",
      video: publicFile("/videos/hero-saree.mp4"),
      videoMobile: publicFile("/videos/hero-saree-mobile.mp4"),
    },
    {
      left: "tailored",
      right: "for you",
      tagline: "Handpicked in Kerala",
      description: "Choose your fabric and we stitch it to your size or exact measurements.",
      href: "/shop/unstitched-salwar-suits",
      // Boutique campaign photo (public/Assets/hero). Phones crop to the outfit.
      poster: "/Assets/hero/hero-suit-yellow-garden.jpg",
      posterPosition: "71% 50%",
      video: publicFile("/videos/hero-stitching.mp4"),
      videoMobile: publicFile("/videos/hero-stitching-mobile.mp4"),
    },
  ];
}

function Rail({ products, href, tone = "light" }: { products: ProductWithRelations[]; href: string; tone?: "light" | "dark" }) {
  return (
    <ProductRail viewAllHref={href} tone={tone}>
      {products.map((p) => (
        <RailItem key={p.id}>
          <ProductCard product={p} tone={tone} />
        </RailItem>
      ))}
    </ProductRail>
  );
}

export default async function HomePage() {
  const [newArrivals, suits, sarees, deals] = await Promise.all([
    listProducts({ newArrivals: true, limit: 8 }),
    listProducts({ categorySlug: "unstitched-salwar-suits", limit: 8 }),
    listProducts({ categorySlug: "saree", limit: 8 }),
    listProducts({ hotDeals: true, limit: 8 }),
  ]);

  return (
    <>
      {/* Editorial video hero. Opens straight on slide 1 (no logo-reveal intro). */}
      <HeroEditorial
        slides={heroSlides()}
        feature={
          newArrivals.products[0]
            ? {
                href: "/new-arrivals",
                label: "New arrivals",
                sub: "Fresh in the boutique",
                image: newArrivals.products[0].images[0]?.thumb_url ?? newArrivals.products[0].images[0]?.url ?? "",
              }
            : undefined
        }
      />

      {/* Service marquee */}
      <AnnouncementBar />

      <section id="categories" className="container-x scroll-mt-40 pt-20">
        <SectionHeading eyebrow="Explore" title="Shop by category" />
        <CategoryCircles />
      </section>

      <section className="container-x pt-24">
        <SectionHeading eyebrow="Just in" title="New Arrivals" tagline="Fresh pieces added to the boutique this week." />
        <Rail products={newArrivals.products} href="/new-arrivals" />
      </section>

      {/* Stitching service banner */}
      <AtelierBanner />

      <section className="container-x">
        <SectionHeading eyebrow="Fabric & stitching" title="Unstitched Salwar Suits" tagline="Buy as fabric, or add our stitching service." />
        <Rail products={suits.products} href="/shop/unstitched-salwar-suits" />
      </section>

      <section className="container-x pt-24">
        <SectionHeading eyebrow="Timeless drapes" title="Saree" tagline="Kasavu, silk and festive sarees for every occasion." />
        <Rail products={sarees.products} href="/shop/saree" />
      </section>

      {/* Split promo tiles */}
      <section className="container-x grid gap-4 pt-24 md:grid-cols-2 md:gap-6">
        {[
          // Same pictures as the category covers (mock.ts): real bedsheet photo; kids is a placeholder until photographed.
          { slug: "kids-dresses", eyebrow: "Made to order", title: "Kids Dresses", href: "/shop/kids-dresses" },
          { slug: "home-linen", eyebrow: "For your home", title: "Home Linen", href: "/shop/home-linen" },
        ].map((t) => (
          <Link key={t.href} href={t.href} className="group relative block aspect-[4/3] overflow-hidden md:aspect-[5/4]">
            <img src={categoryPhoto(t.slug, 1100)} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-8 text-ivory">
              <p className="eyebrow !text-gold-light">{t.eyebrow}</p>
              <h3 className="mt-2 font-display text-4xl">{t.title}</h3>
              <span className="mt-4 inline-block border-b border-ivory pb-1 text-[11px] tracking-[0.2em] uppercase">Shop now</span>
            </div>
          </Link>
        ))}
      </section>

      {deals.products.length > 0 && (
        <section className="mt-24 bg-maroon-dark py-20 text-ivory">
          <div className="container-x">
            <div data-reveal className="mb-12 text-center">
              <p className="text-[11px] font-medium tracking-[0.3em] text-[#d9a587] uppercase">Limited stock</p>
              <h2 className="section-title mt-3 text-[#f8f1ea]">
                <WordReveal text="Hot Deals" />
              </h2>
              <div className="mx-auto mt-4 flex items-center justify-center gap-3 text-[#d9a587]" aria-hidden>
                <span className="h-px w-10 bg-[#d9a587]/50" />
                <span className="text-xs">✦</span>
                <span className="h-px w-10 bg-[#d9a587]/50" />
              </div>
              <p className="mt-4 text-sm text-[#f8f1ea]/70">Special prices on selected pieces, while they last.</p>
            </div>
            <Rail products={deals.products} href="/hot-deals" tone="dark" />
          </div>
        </section>
      )}

      {/* Final CTA: visit the boutique */}
      <VisitCta />
    </>
  );
}
