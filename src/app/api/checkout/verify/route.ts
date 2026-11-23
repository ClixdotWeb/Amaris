import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyPaymentSignature } from "@/lib/razorpay";
import { getOrderByRazorpayId, markOrderPaid } from "@/lib/data/orders";
import { getUser } from "@/lib/auth";
import { sendOrderConfirmation } from "@/lib/email";

const bodySchema = z.object({
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
});

/** Step 2 of payment: called by the browser after Razorpay Checkout succeeds. */
export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Bad request" }, { status: 400 });
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = parsed.data;

  if (!verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature))
    return NextResponse.json({ error: "Payment verification failed." }, { status: 400 });

  const existing = await getOrderByRazorpayId(razorpay_order_id);
  if (!existing || existing.user_id !== user.id)
    return NextResponse.json({ error: "Order not found." }, { status: 404 });

  const paid = await markOrderPaid(razorpay_order_id, razorpay_payment_id);
  if (paid) await sendOrderConfirmation(paid); // only the call that flips the status sends email

  return NextResponse.json({ orderId: existing.id });
}
