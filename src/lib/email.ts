import "server-only";
import { site } from "@/config/site";
import { INDIA_POST_TRACKING_URL } from "@/config/shop";
import { formatINR } from "@/lib/format";
import type { OrderWithItems } from "@/types";

/**
 * Transactional email via the Resend HTTP API. With no RESEND_API_KEY set,
 * emails are printed to the server log so local development works.
 * TODO (design): replace the plain-text bodies with your HTML email templates.
 */
async function send(to: string, subject: string, text: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.log(`[email] to=${to} subject="${subject}"\n${text}`);
    return;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: process.env.EMAIL_FROM, to, subject, text }),
  });
  if (!res.ok) console.error("[email] send failed", res.status, await res.text());
}

export async function sendOrderConfirmation(order: OrderWithItems) {
  const lines = order.items.map((i) => `- ${i.product_name} × ${i.quantity}: ${formatINR(i.line_total)}`);
  const text = [
    `Thank you for your order ${order.order_number}.`,
    "",
    ...lines,
    "",
    `Total paid: ${formatINR(order.total)}`,
    `Invoice: ${site.url}/account/orders/${order.id}/invoice`,
    "",
    `${site.name} · GSTIN ${site.gstin}`,
  ].join("\n");
  await send(order.email, `Order confirmed — ${order.order_number}`, text);
  if (process.env.ADMIN_NOTIFY_EMAIL)
    await send(process.env.ADMIN_NOTIFY_EMAIL, `New order ${order.order_number}`, text);
}

export async function sendDispatchEmail(order: OrderWithItems) {
  const text = [
    `Your order ${order.order_number} has been dispatched via ${order.carrier ?? "India Post"}.`,
    `Consignment number: ${order.consignment_number}`,
    order.is_international
      ? ""
      : `Track it on India Post: open ${INDIA_POST_TRACKING_URL} , enter your Consignment Number and the Captcha Code, then click Search.`,
    "",
    `${site.name} · ${site.phones[0]}`,
  ].join("\n");
  await send(order.email, `Dispatched — ${order.order_number}`, text);
}
