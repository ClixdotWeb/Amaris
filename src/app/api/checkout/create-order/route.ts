import { NextResponse } from "next/server";
import { checkoutSchema } from "@/lib/validation";
import { CheckoutError, priceCart } from "@/lib/checkout";
import { getUser } from "@/lib/auth";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { razorpay } from "@/lib/razorpay";

/**
 * Step 1 of payment: re-price the cart on the server, save a `pending_payment` order,
 * create the matching Razorpay order, and return what the browser needs to open Checkout.
 */
export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Please log in to check out." }, { status: 401 });

  const parsed = checkoutSchema.safeParse(await req.json());
  if (!parsed.success)
    return NextResponse.json({ error: "Please check your details.", issues: parsed.error.issues }, { status: 400 });
  const input = parsed.data;

  let priced;
  try {
    priced = await priceCart(input);
  } catch (e) {
    if (e instanceof CheckoutError) return NextResponse.json({ error: e.message }, { status: 400 });
    throw e;
  }

  const admin = createAdminClient();
  const { line2, ...addr } = input.address;
  const shippingAddress = { ...addr, line2: line2 ?? null };

  const { data: order, error } = await admin
    .from("orders")
    .insert({
      user_id: user.id,
      email: input.email,
      phone: input.address.phone,
      shipping_address: shippingAddress,
      subtotal: priced.subtotal,
      stitching_total: priced.stitchingTotal,
      shipping_fee: priced.shippingFee,
      total: priced.total,
      // Coupon columns come with the database move (docs/ADMIN_DASHBOARD_PLAN.md §3.4)
      ...(priced.discount ? { discount: priced.discount, coupon_code: priced.couponCode } : {}),
      is_international: priced.isInternational,
      carrier: priced.isInternational ? null : "India Post",
      policies_accepted_at: new Date().toISOString(),
      customer_notes: input.customerNotes ?? null,
    })
    .select("id, order_number")
    .single();
  if (error || !order) return NextResponse.json({ error: "Could not create order." }, { status: 500 });

  const { error: itemsErr } = await admin
    .from("order_items")
    .insert(priced.items.map((i) => ({ ...i, order_id: order.id })));
  if (itemsErr) {
    await admin.from("orders").delete().eq("id", order.id);
    return NextResponse.json({ error: "Could not create order." }, { status: 500 });
  }

  const rzpOrder = await razorpay().orders.create({
    amount: priced.total, // paise
    currency: "INR",
    receipt: order.order_number,
    notes: { order_id: order.id },
  });
  await admin.from("orders").update({ razorpay_order_id: rzpOrder.id }).eq("id", order.id);

  if (input.saveAddress) {
    const supabase = await createClient();
    await supabase.from("addresses").insert({ ...shippingAddress, user_id: user.id });
  }

  return NextResponse.json({
    orderId: order.id,
    orderNumber: order.order_number,
    razorpayOrderId: rzpOrder.id,
    amount: priced.total,
    currency: "INR",
    keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    prefill: { name: input.address.full_name, email: input.email, contact: input.address.phone },
  });
}
