import { notFound } from "next/navigation";
import { getOrder } from "@/lib/data/orders";
import { site } from "@/config/site";
import { formatDate, formatINR } from "@/lib/format";
import { PrintButton } from "@/components/account/PrintButton";

export const metadata = { title: "Invoice" };

/**
 * Printable invoice with GSTIN (brief §8). Customers "download" it with Print → Save as PDF.
 * TODO: confirm with the client's accountant whether prices are GST-inclusive and which
 * HSN codes / tax rates to show, then add the tax breakup (CGST+SGST for Kerala, IGST otherwise).
 */
export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const order = await getOrder((await params).id);
  if (!order || order.status === "pending_payment") notFound();
  const a = order.shipping_address;

  return (
    <article>
      <PrintButton />
      <header>
        <h1>Tax Invoice</h1>
        <p>{site.name}</p>
        <address>
          {site.address.lines.join(", ")}, {site.address.state}
        </address>
        <p>GSTIN: {site.gstin}</p>
        <p>{site.phones[0]} · {site.emails[0]}</p>
      </header>

      <dl>
        <dt>Invoice no.</dt>
        <dd>{order.order_number}</dd>
        <dt>Date</dt>
        <dd>{formatDate(order.created_at)}</dd>
        <dt>Payment ID</dt>
        <dd>{order.razorpay_payment_id}</dd>
      </dl>

      <section>
        <h2>Bill / ship to</h2>
        <address>
          {a.full_name}, {a.line1}
          {a.line2 && `, ${a.line2}`}, {a.city}, {a.state} {a.pincode}, {a.country} · {a.phone}
        </address>
      </section>

      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th>Qty</th>
            <th>Rate</th>
            <th>Stitching</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((i) => (
            <tr key={i.id}>
              <td>
                {i.product_name}
                {i.size && ` (${i.size})`}
              </td>
              <td>{i.product_type === "running_material" ? `${i.length_metres} m` : i.quantity}</td>
              <td>{formatINR(i.unit_price)}</td>
              <td>{i.stitching ? formatINR(i.stitching_charge * i.quantity) : "—"}</td>
              <td>{formatINR(i.line_total)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr><td colSpan={4}>Subtotal</td><td>{formatINR(order.subtotal + order.stitching_total)}</td></tr>
          <tr><td colSpan={4}>Shipping</td><td>{formatINR(order.shipping_fee)}</td></tr>
          <tr><td colSpan={4}>Total</td><td>{formatINR(order.total)}</td></tr>
        </tfoot>
      </table>

      <p>{site.footerLine}</p>
    </article>
  );
}
