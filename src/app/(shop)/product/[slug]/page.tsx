import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { getProductBySlug, listProducts } from "@/lib/data/products";
import { getSettings } from "@/lib/data/settings";
import { stitchingChargeFor } from "@/lib/pricing";
import { formatINR } from "@/lib/format";
import { ProductGallery } from "@/components/product/ProductGallery";
import { AddToCartForm } from "@/components/product/AddToCartForm";
import { ProductCard } from "@/components/product/ProductCard";
import { SectionHeading } from "@/components/home/SectionHeading";
import { DELIVERY_AFTER_DISPATCH } from "@/config/shop";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await getProductBySlug((await params).slug);
  if (!p) return {};
  return { title: p.name, description: p.description?.slice(0, 160), openGraph: { images: p.images[0] ? [p.images[0].url] : [] } };
}

function Accordion({ title, children, open = false }: { title: string; children: React.ReactNode; open?: boolean }) {
  return (
    <details open={open} className="group border-b border-sand">
      <summary className="flex cursor-pointer list-none items-center justify-between py-4 text-[12px] font-medium tracking-[0.16em] uppercase">
        {title}
        <ChevronDown size={16} className="transition-transform group-open:rotate-180" />
      </summary>
      <div className="pb-5 text-sm leading-relaxed text-muted">{children}</div>
    </details>
  );
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const [product, settings] = await Promise.all([getProductBySlug(slug), getSettings()]);
  if (!product || !product.is_active) notFound();

  const stitchingCharge = stitchingChargeFor(product, product.category.slug, settings);
  const related = (await listProducts({ categorySlug: product.category.slug, limit: 5 })).products
    .filter((p) => p.id !== product.id)
    .slice(0, 4);
  const off = product.compare_at_price ? Math.round((1 - product.price / product.compare_at_price) * 100) : 0;

  return (
    <>
      <div className="container-x pt-6 pb-16">
        <nav aria-label="Breadcrumb" className="mb-6 text-[11px] tracking-[0.16em] text-muted uppercase">
          <Link href="/" className="hover:text-maroon">Home</Link>
          <span className="mx-2">/</span>
          <Link href={`/shop/${product.category.slug}`} className="hover:text-maroon">{product.category.name}</Link>
        </nav>

        <div className="grid gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
          <div data-reveal className="lg:sticky lg:top-40 lg:self-start">
            <ProductGallery images={product.images} name={product.name} />
          </div>

          <div data-reveal-stagger>
            <p className="eyebrow">{product.category.name}</p>
            <h1 className="mt-3 font-display text-4xl leading-tight md:text-5xl">{product.name}</h1>
            <div className="mt-4 flex items-baseline gap-3">
              <span className={`text-2xl ${off ? "text-sale" : ""}`}>{formatINR(product.price)}</span>
              {product.product_type === "running_material" && <span className="text-muted">per metre</span>}
              {product.compare_at_price && (
                <>
                  <s className="text-muted">{formatINR(product.compare_at_price)}</s>
                  <span className="bg-sale px-2 py-0.5 text-[11px] tracking-wider text-white uppercase">Save {off}%</span>
                </>
              )}
            </div>
            <p className="mt-1 text-xs text-muted">MRP inclusive of all taxes. Shipping calculated at checkout.</p>

            <div className="my-8 h-px bg-sand" />
            <AddToCartForm product={product} stitchingCharge={stitchingCharge} />

            <div className="mt-10 border-t border-sand">
              {product.description && <Accordion title="Description" open>{product.description}</Accordion>}
              {product.fabric && <Accordion title="Fabric">{product.fabric}</Accordion>}
              {product.care_instructions && <Accordion title="Wash & care">{product.care_instructions}</Accordion>}
              <Accordion title="Shipping">
                <ul className="list-disc space-y-1 pl-5">
                  <li>In-stock items are dispatched within 48 hours. Pre-order and custom-made items in 45–60 days.</li>
                  <li>Delivery after dispatch: Kerala {DELIVERY_AFTER_DISPATCH.kerala}, rest of India {DELIVERY_AFTER_DISPATCH.restOfIndia}.</li>
                  <li>Shipped by India Post. International orders by courier.</li>
                </ul>
                <Link href="/policies/shipping" className="mt-2 inline-block text-maroon underline underline-offset-4">Shipping policy</Link>
              </Accordion>
              <Accordion title="Returns">
                All sales are final. Replacement only for a damaged, wrong or wrong-size item, reported within 24 hours with an unboxing video.{" "}
                <Link href="/policies/return-refund" className="text-maroon underline underline-offset-4">Read the full policy</Link>
              </Accordion>
            </div>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="container-x border-t border-sand pt-20">
          <SectionHeading eyebrow="You may also like" title="More from this collection" />
          <ul data-reveal-stagger className="grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-4 md:gap-x-6 lg:gap-x-10">
            {related.map((p) => (
              <li key={p.id}>
                <ProductCard product={p} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
