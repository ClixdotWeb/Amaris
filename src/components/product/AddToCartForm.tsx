"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, Info } from "lucide-react";
import { useCart } from "@/components/cart/CartProvider";
import { SizingPicker, isSizingComplete } from "./SizingPicker";
import { DispatchNote } from "./DispatchNote";
import { ColourPicker } from "./ColourPicker";
import { useProductImage } from "./ProductView";
import { dispatchTypeFor, lineTotal } from "@/lib/pricing";
import { formatINR } from "@/lib/format";
import { KIDS_SIZES, STANDARD_SIZES, STITCHING_NOTE } from "@/config/shop";
import { whatsappLink } from "@/config/site";
import type { ProductWithRelations, Sizing } from "@/types";

/**
 * The purchase options change with the product type (brief §4):
 *  ready_made        → size (if any) + quantity
 *  unstitched        → quantity + optional stitching add-on (size or measurements)
 *  custom_made       → standard size or measurements + quantity
 *  running_material  → length in metres
 */
export function AddToCartForm({ product, stitchingCharge }: { product: ProductWithRelations; stitchingCharge: number }) {
  const { add } = useCart();
  const router = useRouter();
  const type = product.product_type;

  // Colour: starts on the colour in the first photo; picking a colour shows its photo, and
  // opening a colour's photo in the gallery selects that colour.
  const colours = product.colours ?? [];
  const { image, setImage } = useProductImage();
  const [colour, setColour] = useState(() => (colours.find((c) => c.image_index === 0) ?? colours[0])?.name ?? "");
  useEffect(() => {
    const c = colours.find((x) => x.image_index === image);
    if (c) setColour(c.name);
  }, [image]); // eslint-disable-line react-hooks/exhaustive-deps
  const pickColour = (name: string) => {
    setColour(name);
    const idx = colours.find((c) => c.name === name)?.image_index;
    if (idx !== null && idx !== undefined) setImage(idx);
  };
  const colourImage = product.images[colours.find((c) => c.name === colour)?.image_index ?? 0] ?? product.images[0];

  const [quantity, setQuantity] = useState(1);
  const [size, setSize] = useState<string>("");
  const [stitching, setStitching] = useState(false);
  const [sizing, setSizing] = useState<Sizing | null>(null);
  const minMetres = product.min_metres ?? 0.5;
  const step = product.metre_step ?? 0.5;
  const [metres, setMetres] = useState(minMetres);
  const [error, setError] = useState<string | null>(null);

  const isKids = product.category.slug === "kids-dresses";
  const customSizes = product.sizes.length ? product.sizes : isKids ? KIDS_SIZES : STANDARD_SIZES;
  const needsSizing = type === "custom_made" || (type === "unstitched" && stitching);
  const dispatch = dispatchTypeFor(product, { stitching });

  const preview = lineTotal({ productType: type, unitPrice: product.price, quantity, lengthMetres: metres, stitching, stitchingCharge });

  const variantStock = (s: string) => product.variants.find((v) => v.size === s)?.stock_qty;
  const outOfStock =
    dispatch === "in_stock" &&
    !product.is_preorder &&
    (type === "running_material"
      ? product.stock_qty < minMetres
      : product.variants.length
        ? product.variants.every((v) => v.stock_qty <= 0)
        : product.stock_qty <= 0);

  function validate() {
    if (colours.length && !colour) return "Please select a colour.";
    if (type === "ready_made" && product.sizes.length && !size) return "Please select a size.";
    if (needsSizing && !isSizingComplete(sizing)) return "Please select a size or fill in all required measurements.";
    return null;
  }

  function addToCart(goToCheckout: boolean) {
    const err = validate();
    setError(err);
    if (err) return;
    add({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      image: colourImage?.thumb_url ?? colourImage?.url ?? null,
      productType: type,
      unitPrice: product.price,
      quantity: type === "running_material" ? 1 : quantity,
      size: type === "ready_made" && size ? size : undefined,
      colour: colours.length ? colour : undefined,
      lengthMetres: type === "running_material" ? metres : undefined,
      stitching: type === "unstitched" ? stitching : undefined,
      stitchingCharge: stitching ? stitchingCharge : undefined,
      sizing: needsSizing ? (sizing ?? undefined) : undefined,
      dispatch,
    });
    router.push(goToCheckout ? "/checkout" : "/cart");
  }

  const stepper = (value: number, set: (n: number) => void, opts: { min: number; step: number; suffix?: string }) => (
    <div className="inline-flex items-center rounded-[3px] border border-sand bg-white">
      <button type="button" aria-label="Decrease" className="px-4 py-3 hover:text-maroon" onClick={() => set(Math.max(opts.min, +(value - opts.step).toFixed(2)))}>
        <Minus size={14} />
      </button>
      <span className="min-w-14 text-center text-sm" aria-live="polite">
        {value}
        {opts.suffix}
      </span>
      <button type="button" aria-label="Increase" className="px-4 py-3 hover:text-maroon" onClick={() => set(+(value + opts.step).toFixed(2))}>
        <Plus size={14} />
      </button>
    </div>
  );

  return (
    <form
      className="space-y-7"
      onSubmit={(e) => {
        e.preventDefault();
        addToCart(false);
      }}
    >
      {colours.length > 0 && <ColourPicker colours={colours} value={colour} onChange={pickColour} />}

      {type === "ready_made" && product.sizes.length > 0 && (
        <fieldset>
          <legend>Size{size && <span className="ml-2 tracking-normal text-muted normal-case">: {size}</span>}</legend>
          <div className="flex flex-wrap gap-2">
            {product.sizes.map((s) => {
              const stock = variantStock(s);
              const soldOut = stock !== undefined && stock <= 0;
              return (
                <button
                  key={s}
                  type="button"
                  disabled={soldOut}
                  aria-pressed={size === s}
                  onClick={() => setSize(s)}
                  className={`chip ${size === s ? "chip-active" : ""} ${soldOut ? "line-through" : ""}`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      {type === "unstitched" && product.stitching_available && (
        <fieldset>
          <legend>Do you want this stitched professionally?</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { on: false, title: "No, unstitched", text: "Buy the fabric only" },
              { on: true, title: "Yes, stitch it", text: `+ ${formatINR(stitchingCharge)} stitching` },
            ].map((o) => (
              <label
                key={o.title}
                className={`flex cursor-pointer items-start gap-3 rounded-[3px] border p-4 transition ${stitching === o.on ? "border-maroon bg-maroon/5" : "border-sand bg-white hover:border-ink"}`}
              >
                <input type="radio" name="stitching" className="mt-0.5" checked={stitching === o.on} onChange={() => setStitching(o.on)} />
                <span>
                  <span className="block font-medium">{o.title}</span>
                  <span className="text-xs text-muted">{o.text}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {needsSizing && (
        <div className="space-y-3">
          <SizingPicker sizes={customSizes} value={sizing} onChange={setSizing} />
          <p className="flex gap-2 bg-gold-light/40 p-3 text-xs text-ink">
            <Info size={15} className="mt-px shrink-0 text-gold" />
            {STITCHING_NOTE}
          </p>
        </div>
      )}

      {type === "running_material" ? (
        <fieldset>
          <legend>Length</legend>
          {stepper(metres, setMetres, { min: minMetres, step, suffix: " m" })}
          <p className="mt-2 text-xs text-muted">
            {formatINR(product.price)} per metre · minimum {minMetres} m · {product.stock_qty} m in stock
          </p>
        </fieldset>
      ) : (
        <fieldset>
          <legend>Quantity</legend>
          {stepper(quantity, (n) => setQuantity(Math.min(50, Math.max(1, n))), { min: 1, step: 1 })}
        </fieldset>
      )}

      <div className="space-y-4 border-t border-sand pt-6">
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-muted">Total</span>
          <span className="text-2xl font-medium">{formatINR(preview.total)}</span>
        </div>
        <DispatchNote type={dispatch} />
        {error && (
          <p role="alert" className="text-sm text-sale">
            {error}
          </p>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          <button type="submit" disabled={outOfStock} className="btn-outline w-full">
            {outOfStock ? "Out of stock" : "Add to cart"}
          </button>
          <button type="button" disabled={outOfStock} onClick={() => addToCart(true)} className="btn-primary w-full">
            Buy now
          </button>
        </div>
        <a
          href={whatsappLink(undefined, `Hi, I'm interested in "${product.name}". Is it available?`)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 text-sm text-success underline-offset-4 hover:underline"
        >
          Have a question? Ask us on WhatsApp
        </a>
      </div>
    </form>
  );
}
