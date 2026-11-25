import "server-only";
import { randomUUID } from "node:crypto";
import { mockCategories, mockProducts, mockSettings } from "@/lib/data/mock";
import { MEASUREMENT_FIELDS, STANDARD_SIZES } from "@/config/shop";
import { dispatchTypeFor, lineTotal, shippingFeeFor, stitchingChargeFor } from "@/lib/pricing";
import type { Order, OrderItem, OrderStatus, ProductWithRelations, ShippingAddress, Sizing } from "@/types";
import type { DevCustomer, DevData } from "./store";
import catalog from "@/lib/data/catalog.json";

/** Tags from the boutique's catalogue (the preview mapping drops them). */
const TAGS = new Map((catalog as { slug: string; tags?: string[] }[]).map((c) => [c.slug, c.tags ?? []]));

/** Small seeded random generator, so every reset produces the same sample orders. */
function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const CUSTOMERS: { name: string; city: string; state: string; pincode: string; country?: string }[] = [
  { name: "Anjali Menon", city: "Kochi", state: "Kerala", pincode: "682016" },
  { name: "Lakshmi Nair", city: "Thiruvananthapuram", state: "Kerala", pincode: "695001" },
  { name: "Fathima Rahman", city: "Kozhikode", state: "Kerala", pincode: "673001" },
  { name: "Sneha Thomas", city: "Kottayam", state: "Kerala", pincode: "686001" },
  { name: "Aleena Joseph", city: "Pala", state: "Kerala", pincode: "686575" },
  { name: "Divya Pillai", city: "Thrissur", state: "Kerala", pincode: "680001" },
  { name: "Meera Krishnan", city: "Bengaluru", state: "Karnataka", pincode: "560034" },
  { name: "Priya Sharma", city: "Chennai", state: "Tamil Nadu", pincode: "600040" },
  { name: "Neha Varghese", city: "Mumbai", state: "Maharashtra", pincode: "400050" },
  { name: "Riya Mathew", city: "Hyderabad", state: "Telangana", pincode: "500081" },
  { name: "Ann Maria George", city: "Pune", state: "Maharashtra", pincode: "411001" },
  { name: "Shabana Ali", city: "New Delhi", state: "Delhi", pincode: "110017" },
  { name: "Teena Kurian", city: "Dubai", state: "Dubai", pincode: "00000", country: "AE" },
  { name: "Rosemary Abraham", city: "Erattupetta", state: "Kerala", pincode: "686121" },
];

/** How many sample orders of each status to create. */
const STATUS_MIX: [OrderStatus, number][] = [
  ["pending_payment", 3],
  ["paid", 8],
  ["processing", 7],
  ["dispatched", 10],
  ["delivered", 14],
  ["cancelled", 4],
  ["refunded", 2],
];

export function seedDevStore(): DevData {
  const rand = rng(20261125);
  const pick = <T,>(a: readonly T[]) => a[Math.floor(rand() * a.length)];
  const now = Date.now();
  const DAY = 86_400_000;

  // Categories and products: the boutique's catalogue (catalog.json), with database-style UUIDs.
  const catId = new Map(mockCategories.map((c) => [c.id, randomUUID()]));
  const categories = mockCategories.map((c) => ({ ...c, id: catId.get(c.id)! }));

  const full: ProductWithRelations[] = mockProducts.map((p) => {
    const id = randomUUID();
    const category = categories.find((c) => c.id === catId.get(p.category_id))!;
    return {
      ...p,
      id,
      category_id: category.id,
      category,
      images: p.images.map((img) => ({ ...img, id: randomUUID(), product_id: id, public_id: null })),
      variants: p.variants.map((v) => ({ ...v, id: randomUUID(), product_id: id })),
    };
  });
  // A few low-stock items so the dashboard has something to show.
  full.slice(0, 6).forEach((p, i) => {
    if (p.variants.length) p.variants[0].stock_qty = i % 3;
    else p.stock_qty = i % 3;
  });

  const products = full.map(({ category: _c, images: _i, variants: _v, ...p }) => {
    void _c; void _i; void _v;
    return { ...p, tags: TAGS.get(p.slug) ?? [] };
  });
  const variants = full.flatMap((p) => p.variants);
  const images = full.flatMap((p) => p.images);
  const settings = { ...mockSettings };

  const customers: (DevCustomer & { address: ShippingAddress })[] = CUSTOMERS.map((c, i) => {
    const phone = `9${String(846000000 + i * 7919).padStart(9, "0")}`;
    const email = `${c.name.toLowerCase().replace(/[^a-z]+/g, ".")}@example.com`;
    return {
      id: randomUUID(),
      full_name: c.name,
      email,
      phone,
      created_at: new Date(now - (90 - i * 5) * DAY).toISOString(),
      address: {
        full_name: c.name,
        phone,
        line1: `House ${12 + i}, ${pick(["Church Road", "Temple Street", "Market Road", "MG Road", "Lake View"])}`,
        line2: null,
        city: c.city,
        state: c.state,
        pincode: c.pincode,
        country: c.country ?? "IN",
      },
    };
  });

  const orders: Order[] = [];
  const orderItems: OrderItem[] = [];
  const statuses = STATUS_MIX.flatMap(([s, n]) => Array<OrderStatus>(n).fill(s));
  // Spread over the last 60 days; two paid orders a few minutes ago so the dashboard's "today" figures aren't empty.
  let todayPaid = 0;
  statuses.forEach((status, n) => {
    const customer = pick(customers);
    const isToday = status === "paid" && todayPaid < 2;
    if (isToday) todayPaid++;
    const created = new Date(isToday ? now - todayPaid * 10 * 60_000 : now - Math.floor(rand() * 60 * DAY));
    const orderId = randomUUID();
    const items: OrderItem[] = [];
    const lineCount = 1 + Math.floor(rand() * 3);

    for (let l = 0; l < lineCount; l++) {
      const p = pick(full);
      let size: string | null = null;
      let sizing: Sizing | null = null;
      let stitching = false;
      let lengthMetres: number | null = null;
      if (p.product_type === "ready_made" && p.sizes.length) size = pick(p.sizes);
      if (p.product_type === "running_material") lengthMetres = 2 + Math.floor(rand() * 7) * 0.5;
      const wantsSizing = p.product_type === "custom_made" || (p.product_type === "unstitched" && rand() < 0.45);
      if (wantsSizing) {
        stitching = p.product_type === "unstitched";
        sizing =
          rand() < 0.5
            ? { mode: "standard", size: pick(STANDARD_SIZES.slice(0, 6)) }
            : {
                mode: "custom",
                measurements: Object.fromEntries(
                  MEASUREMENT_FIELDS.filter((f) => f.required || rand() < 0.5).map((f) => [f.key, 12 + Math.round(rand() * 120) / 4]),
                ),
                notes: rand() < 0.3 ? "Please keep the sleeves slightly loose." : undefined,
              };
      }
      const stitchingCharge = stitching ? stitchingChargeFor(p, p.category.slug, settings) : 0;
      const quantity = rand() < 0.85 ? 1 : 2;
      const t = lineTotal({ productType: p.product_type, unitPrice: p.price, quantity, lengthMetres, stitching, stitchingCharge });
      const colour = p.colours?.length ? pick(p.colours) : null;
      items.push({
        id: randomUUID(),
        order_id: orderId,
        product_id: p.id,
        product_name: p.name,
        product_type: p.product_type,
        image_url: p.images[colour?.image_index ?? 0]?.thumb_url ?? p.images[0]?.url ?? null,
        unit_price: p.price,
        quantity,
        length_metres: lengthMetres,
        size,
        colour: colour?.name ?? null,
        stitching,
        stitching_charge: stitchingCharge,
        sizing,
        dispatch_type: dispatchTypeFor(p, { stitching }),
        line_total: t.total,
      });
    }

    const stitchingTotal = items.reduce((s, i) => s + i.stitching_charge * i.quantity, 0);
    const subtotal = items.reduce((s, i) => s + i.line_total, 0) - stitchingTotal;
    const itemCount = items.reduce((s, i) => s + i.quantity, 0);
    const shipping = shippingFeeFor(customer.address, subtotal + stitchingTotal, itemCount, settings) ?? 0;
    const shipped = status === "dispatched" || status === "delivered" || (status === "refunded" && n % 2 === 0);
    const international = customer.address.country !== "IN";
    const dispatchedAt = shipped ? new Date(created.getTime() + 2 * DAY).toISOString() : null;

    orders.push({
      id: orderId,
      order_number: `AMR${1001 + n}`,
      user_id: customer.id,
      email: customer.email,
      phone: customer.phone,
      shipping_address: customer.address,
      status,
      subtotal,
      stitching_total: stitchingTotal,
      shipping_fee: shipping,
      total: subtotal + stitchingTotal + shipping,
      is_international: international,
      razorpay_order_id: `order_DEV${String(n).padStart(6, "0")}`,
      razorpay_payment_id: status === "pending_payment" ? null : `pay_DEV${String(n).padStart(6, "0")}`,
      carrier: international ? (shipped ? "DHL" : null) : "India Post",
      consignment_number: shipped ? (international ? `DHL${70000000 + n}` : `EK${String(500000000 + n * 1777)}IN`) : null,
      dispatched_at: dispatchedAt,
      policies_accepted_at: created.toISOString(),
      customer_notes: rand() < 0.15 ? "Please call before delivery." : null,
      admin_notes: null,
      stock_restored_at: status === "cancelled" || status === "refunded" ? created.toISOString() : null,
      created_at: created.toISOString(),
    });
    orderItems.push(...items);
  });

  orders.sort((a, b) => b.created_at.localeCompare(a.created_at));

  return {
    version: 1,
    seeded_at: new Date(now).toISOString(),
    categories,
    products,
    variants,
    images,
    customers: customers.map(({ address: _a, ...c }) => {
      void _a;
      return c;
    }),
    orders,
    order_items: orderItems,
    settings,
    admins: [], // the first admin is created at first sign-in from .env.local (src/lib/admin/accounts.ts)
    activity: [],
  };
}
