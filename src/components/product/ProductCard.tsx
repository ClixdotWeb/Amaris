import Link from "next/link";
import { formatINR } from "@/lib/format";
import type { ProductWithRelations } from "@/types";

/** Short product-type label for the outlined tag under the name. */
function typeLabel(p: ProductWithRelations) {
  if (p.product_type === "unstitched") return "Unstitched Salwar Suit";
  if (p.product_type === "running_material") return "Running Material";
  return p.category.name.replace(/\s*–\s*Custom Made$/, "");
}

/**
 * Product card, arranged like the reference boutique:
 * tall portrait photo → uppercase name → outlined type tag → price → sizes (if any). Left-aligned.
 */
/** Text colours for light (ivory pages) and dark (burgundy sections) backgrounds, from the logo palette. */
const TONES = {
  light: {
    name: "text-ink group-hover:text-maroon",
    tag: "border-sand text-muted",
    price: "text-ink",
    sale: "text-sale",
    muted: "text-muted",
    sizes: "text-ink/75",
    badge: "bg-sale text-white",
  },
  dark: {
    name: "text-[#f8f1ea] group-hover:text-[#d9a587]",
    tag: "border-[#d9a587]/35 text-[#e9cdb9]",
    price: "text-[#f8f1ea]",
    sale: "text-[#d9a587]",
    muted: "text-[#f8f1ea]/45",
    sizes: "text-[#f8f1ea]/60",
    badge: "bg-[#d9a587] text-[#350f10]",
  },
} as const;

export function ProductCard({ product, tone = "light" }: { product: ProductWithRelations; tone?: keyof typeof TONES }) {
  const t = TONES[tone];
  const [first, second] = product.images;
  const perMetre = product.product_type === "running_material";
  const off =
    product.compare_at_price && product.compare_at_price > product.price
      ? Math.round((1 - product.price / product.compare_at_price) * 100)
      : 0;

  return (
    <article className="group">
      <Link href={`/product/${product.slug}`} className="block">
        {/* Photo */}
        <div className="relative aspect-[3/5] overflow-hidden rounded-[6px] bg-cream">
          {first && (
            <img
              src={first.url}
              alt={first.alt ?? product.name}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
            />
          )}
          {second && (
            <img
              src={second.url}
              alt=""
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            />
          )}
          <div className="absolute top-3 left-3 flex flex-col items-start gap-1.5">
            {off > 0 && (
              <span className={`rounded-[3px] px-2 py-1 text-[10px] font-medium tracking-wider uppercase ${t.badge}`}>
                Sale −{off}%
              </span>
            )}
            {product.is_new_arrival && !off && (
              <span className="rounded-[3px] bg-ivory px-2 py-1 text-[10px] font-medium tracking-wider uppercase">New</span>
            )}
            {product.is_preorder && (
              <span className="rounded-[3px] bg-ink px-2 py-1 text-[10px] tracking-wider text-white uppercase">Pre-order</span>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="pt-4 text-left">
          <h3 className={`line-clamp-2 font-sans text-[12.5px] leading-[1.45] font-normal tracking-[0.16em] uppercase transition-colors ${t.name}`}>
            {product.name}
          </h3>
          <span className={`mt-2.5 inline-block rounded-[3px] border px-2 py-[3px] text-[12px] ${t.tag}`}>{typeLabel(product)}</span>
          <p className="mt-2.5 text-[13px] tracking-[0.08em]">
            <span className={off ? t.sale : t.price}>{formatINR(product.price)}</span>
            {perMetre && <span className={t.muted}> / metre</span>}
            {off > 0 && <s className={`ml-2 ${t.muted}`}>{formatINR(product.compare_at_price!)}</s>}
          </p>
          {product.sizes.length > 0 && (
            <p className={`mt-2 text-[11px] tracking-[0.04em] ${t.sizes}`}>{product.sizes.join(" | ")}</p>
          )}
        </div>
      </Link>
    </article>
  );
}
