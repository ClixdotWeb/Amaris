import Link from "next/link";
import { PolicyPage } from "@/components/PolicyPage";

export const metadata = { title: "Shipping Policy" };

// Client's wording from WEBSITE_DESIGN_AMARIS.xlsx (Sheet1).
export default function ShippingPolicyPage() {
  return (
    <PolicyPage title="Shipping Policy" updated="2026">
      <section>
        <p>At Amaris Boutique, every order is packed and shipped with care. Please review our shipping terms before placing your order.</p>
      </section>
      <section>
        <h2>1. Shipping Coverage</h2>
        <p>We ship worldwide via trusted logistics partners. Shipping rates and delivery timelines depend on your destination and selected courier.</p>
      </section>
      <section>
        <h2>2. Order Processing Time</h2>
        <ul>
          <li>
            <strong>In-Stock Items:</strong> Dispatched within 48 hours of order confirmation.
          </li>
          <li>
            <strong>Pre-Order / Custom-Made Items:</strong> Dispatched within 45 to 60 days, depending on design complexity and fabric
            availability.
          </li>
        </ul>
        <p>You will receive a confirmation email once your order is dispatched.</p>
      </section>
      <section>
        <h2>3. Estimated Delivery Timelines</h2>
        <ul>
          <li>
            <strong>Within Kerala:</strong> 5 working days after dispatch.
          </li>
          <li>
            <strong>Rest of India:</strong> 8 working days after dispatch.
          </li>
          <li>
            <strong>International Orders:</strong> Varies by destination and customs clearance.
          </li>
        </ul>
        <p>
          <strong>Note:</strong> Timelines are estimates and may shift due to courier delays, holidays, or unforeseen logistics issues.
        </p>
      </section>
      <section>
        <h2>4. Domestic Shipping (Within India)</h2>
        <p>All domestic home deliveries across India—including rural and remote areas—are handled exclusively through India Post.</p>
      </section>
      <section>
        <h2>5. International Shipping</h2>
        <p>
          Overseas orders are shipped through reliable international couriers, with rates and timelines calculated at checkout. Customers
          are responsible for any applicable customs duties or import taxes.
        </p>
      </section>
      <section>
        <h2>6. Tracking Your Order</h2>
        <p>Once dispatched, your confirmation email will include your India Post Consignment Number. To track your package:</p>
        <ol>
          <li>
            Click <Link href="/track-order">&ldquo;Track Order&rdquo;</Link> on our website to open the India Post tracking portal.
          </li>
          <li>Enter your Consignment Number and the displayed Captcha Code.</li>
          <li>Click &ldquo;Search&rdquo; to view your live delivery status.</li>
        </ol>
        <p>
          <strong>Note:</strong> Tracking is generated only upon dispatch (not available for pre-order or custom items until ready to
          ship). For in-stock orders, contact Customer Care if you do not receive tracking details within 48 hours.
        </p>
      </section>
      <section>
        <h2>7. Address Accuracy</h2>
        <p>
          Please verify your shipping address, PIN code, and phone number at checkout. Amaris Boutique is not responsible for delays or
          failed deliveries caused by incorrect or incomplete address details.
        </p>
      </section>
      <section>
        <h2>8. Delays &amp; Exceptions</h2>
        <p>
          Delivery times may occasionally be affected by severe weather, courier disruptions, public holidays, regional restrictions, or
          international customs clearance. Thank you for your patience during unforeseen delays.
        </p>
      </section>
    </PolicyPage>
  );
}
