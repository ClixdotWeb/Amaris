import { NextResponse, type NextRequest } from "next/server";
import { checkoutSchema } from "@/lib/validation";
import { CheckoutError, priceCart } from "@/lib/checkout";
import { USE_DASHBOARD_STORE } from "@/lib/data/mode";
import { rateLimit } from "@/lib/admin/rateLimit";
import { db } from "@/lib/db";

/**
 * Development checkout (no database or Razorpay yet): prices the cart on the server, saves the order as
 * "awaiting payment" in the dashboard store and returns its id for the test payment page.
 * Never available in production (the real flow is /api/checkout/create-order).
 */
export async function POST(req: NextRequest) {
  if (!USE_DASHBOARD_STORE) return NextResponse.json({ error: "Not available." }, { status: 404 });
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!rateLimit(`test-order:${ip}`, 30, 600).ok) return NextResponse.json({ error: "Too many orders. Please wait a few minutes." }, { status: 429 });

  const parsed = checkoutSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Please check your details.", issues: parsed.error.issues }, { status: 400 });
  const input = parsed.data;

  const known = (await db.customers.list({ q: input.email, pageSize: 5 })).rows.find((c) => c.email.toLowerCase() === input.email.toLowerCase());
  if (known?.is_blocked) return NextResponse.json({ error: "We can't take orders from this account. Please contact us." }, { status: 403 });

  let priced;
  try {
    priced = await priceCart(input);
  } catch (e) {
    if (e instanceof CheckoutError) return NextResponse.json({ error: e.message }, { status: 400 });
    throw e;
  }
  const { line2, ...addr } = input.address;
  const order = await db.shop.createOrder({
    email: input.email,
    phone: input.address.phone,
    full_name: input.address.full_name,
    shipping_address: { ...addr, line2: line2 ?? null },
    items: priced.items,
    subtotal: priced.subtotal,
    stitching_total: priced.stitchingTotal,
    shipping_fee: priced.shippingFee,
    discount: priced.discount,
    coupon_code: priced.couponCode,
    total: priced.total,
    is_international: priced.isInternational,
    customer_notes: input.customerNotes ?? null,
  });
  return NextResponse.json({ orderId: order.id, orderNumber: order.order_number });
}
