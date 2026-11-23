import { PolicyPage } from "@/components/PolicyPage";
import { site } from "@/config/site";

export const metadata = { title: "Return & Refund Policy" };

// TODO: replace each section's text with the client's EXACT wording from WEBSITE_DESIGN_AMARIS.xlsx (Sheet1).
// Section headings below follow the brief (CLAUDE.md §7).
export default function ReturnRefundPage() {
  return (
    <PolicyPage title="Return & Refund Policy" updated="2026">
      <section>
        <h2>All sales are final</h2>
        <p>We offer a replacement only for a damaged product, wrong product or wrong size. A refund is given only if a replacement is out of stock.</p>
      </section>
      <section>
        <h2>How to report a problem</h2>
        <p>Report within 24 hours of delivery with a continuous, unedited unboxing video that shows:</p>
        <ul>
          <li>All sides of the sealed package, including the shipping label</li>
          <li>The full opening of the package</li>
          <li>The damage or wrong item, in clear light</li>
        </ul>
        <p>No video, no complaint.</p>
      </section>
      <section>
        <h2>Not covered</h2>
        <ul>
          <li>Damage from washing, misuse or wear</li>
          <li>Slight colour differences due to lighting or screens</li>
          <li>Minor loose threads or stitching variations</li>
          <li>Change of mind</li>
        </ul>
      </section>
      <section>
        <h2>Exchange</h2>
        <p>Case by case, within 3 days. Items must be unused, in original condition, and exchanged for equal or higher value. No refunds of price difference. The customer pays all courier and re-order charges.</p>
      </section>
      <section>
        <h2>Return shipping</h2>
        <p>We do not offer pickup. After approval, the customer ships the item back. Shipping charges are non-refundable.</p>
      </section>
      <section>
        <h2>Wash & care</h2>
        <p>We are not responsible for fading, shrinkage or fabric damage after washing or wear.</p>
      </section>
      <section>
        <h2>Unauthorized sellers</h2>
        <p>We are not liable for purchases from fake accounts or third parties misusing our images or videos.</p>
      </section>
      <section>
        <h2>Saree policy</h2>
        <p>Minor thread variations, slubs, knots and slight colour differences are normal. Valid defects are only: tears, wrong saree length, or a missing blouse piece (if included).</p>
      </section>
      <section>
        <h2>Partial orders</h2>
        <p>If one item fails quality check before dispatch, we refund or replace that item only. Cancelling the whole order is not allowed.</p>
      </section>
      <section>
        <h2>Measurements & stitching</h2>
        <p>Items are stitched to the measurements you provide. We are not responsible for fit issues caused by incorrect measurements. Alterations cost extra (stitching + shipping).</p>
      </section>
      <section>
        <h2>Cancellation</h2>
        <p>Orders are final after payment. No cancellation after confirmation or dispatch.</p>
      </section>
      <section>
        <h2>Contact</h2>
        <p>{site.phones[0]} · {site.emails[0]} · {site.hours}</p>
      </section>
      <p>By placing an order, you agree to all of the terms above.</p>
    </PolicyPage>
  );
}
