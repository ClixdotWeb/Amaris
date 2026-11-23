import { NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { markOrderPaid } from "@/lib/data/orders";
import { sendOrderConfirmation } from "@/lib/email";

/**
 * Backup path: Razorpay calls this even if the customer closes the browser before
 * /api/checkout/verify runs. Configure in Razorpay Dashboard → Webhooks:
 *   URL: https://<domain>/api/webhooks/razorpay   Events: payment.captured
 */
export async function POST(req: Request) {
  const raw = await req.text();
  const signature = req.headers.get("x-razorpay-signature") ?? "";
  if (!verifyWebhookSignature(raw, signature)) return NextResponse.json({ ok: false }, { status: 400 });

  const event = JSON.parse(raw);
  if (event.event === "payment.captured") {
    const payment = event.payload.payment.entity;
    const paid = await markOrderPaid(payment.order_id, payment.id);
    if (paid) await sendOrderConfirmation(paid);
  }
  return NextResponse.json({ ok: true });
}
