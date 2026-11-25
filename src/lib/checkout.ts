import "server-only";
import type { CheckoutInput } from "@/lib/validation";
import { getProductsByIds, isAvailable } from "@/lib/data/products";
import { getSettings } from "@/lib/data/settings";
import { dispatchTypeFor, lineTotal, shippingFeeFor, stitchingChargeFor } from "@/lib/pricing";
import type { OrderItem } from "@/types";

export class CheckoutError extends Error {}

type PricedItem = Omit<OrderItem, "id" | "order_id">;

/**
 * Re-prices the cart from the database. Never trust prices sent by the browser.
 * Validates option rules per product type and stock.
 */
export async function priceCart(input: CheckoutInput) {
  const settings = await getSettings();
  const products = await getProductsByIds([...new Set(input.items.map((i) => i.productId))]);
  const byId = new Map(products.map((p) => [p.id, p]));

  const items: PricedItem[] = input.items.map((line) => {
    const p = byId.get(line.productId);
    if (!p || !p.is_active) throw new CheckoutError("An item in your cart is no longer available.");

    let stitching = false;
    let stitchingCharge = 0;
    let sizing = null as PricedItem["sizing"];
    let size: string | null = null;
    let colour: string | null = null;
    let image = p.images[0]?.url ?? null;
    if (p.colours?.length) {
      const c = p.colours.find((x) => x.name === line.colour);
      if (!c) throw new CheckoutError(`Choose a colour for ${p.name}.`);
      colour = c.name;
      if (c.image_index !== null && p.images[c.image_index]) image = p.images[c.image_index].url;
    }
    let lengthMetres: number | null = null;

    switch (p.product_type) {
      case "ready_made":
        if (p.sizes.length) {
          if (!line.size || !p.sizes.includes(line.size)) throw new CheckoutError(`Choose a size for ${p.name}.`);
          size = line.size;
        }
        break;
      case "unstitched":
        if (line.stitching) {
          if (!p.stitching_available) throw new CheckoutError(`Stitching is not offered for ${p.name}.`);
          if (!line.sizing) throw new CheckoutError(`Add a size or measurements for ${p.name}.`);
          stitching = true;
          stitchingCharge = stitchingChargeFor(p, p.category.slug, settings);
          sizing = line.sizing;
        }
        break;
      case "custom_made":
        if (!line.sizing) throw new CheckoutError(`Add a size or measurements for ${p.name}.`);
        sizing = line.sizing;
        break;
      case "running_material": {
        const min = p.min_metres ?? 0.5;
        if (!line.lengthMetres || line.lengthMetres < min)
          throw new CheckoutError(`Minimum length for ${p.name} is ${min} m.`);
        lengthMetres = line.lengthMetres;
        break;
      }
    }

    if (!isAvailable(p, { size: size ?? undefined, colour: colour ?? undefined, quantity: line.quantity, lengthMetres: lengthMetres ?? undefined }))
      throw new CheckoutError(`${p.name} does not have enough stock.`);

    const t = lineTotal({
      productType: p.product_type,
      unitPrice: p.price,
      quantity: line.quantity,
      lengthMetres,
      stitching,
      stitchingCharge,
    });

    return {
      product_id: p.id,
      product_name: p.name,
      product_type: p.product_type,
      image_url: image,
      unit_price: p.price,
      quantity: line.quantity,
      length_metres: lengthMetres,
      size,
      colour,
      stitching,
      stitching_charge: stitchingCharge,
      sizing,
      dispatch_type: dispatchTypeFor(p, { stitching }),
      line_total: t.total,
    };
  });

  const stitchingTotal = items.reduce((s, i) => s + i.stitching_charge * i.quantity, 0);
  const subtotal = items.reduce((s, i) => s + i.line_total, 0) - stitchingTotal;
  const country = input.address.country;
  const itemCount = items.reduce((n, i) => n + i.quantity, 0);
  const shippingFee = shippingFeeFor(input.address, subtotal + stitchingTotal, itemCount, settings);
  if (shippingFee === null) throw new CheckoutError("Sorry, we don't ship to this country yet. Please contact us.");

  return {
    items,
    subtotal,
    stitchingTotal,
    shippingFee,
    total: subtotal + stitchingTotal + shippingFee,
    isInternational: country !== "IN",
  };
}
