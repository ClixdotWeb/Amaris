import { PolicyPage } from "@/components/PolicyPage";
import { DELIVERY_AFTER_DISPATCH } from "@/config/shop";

export const metadata = { title: "Shipping Policy" };

// TODO: replace with the client's EXACT wording from WEBSITE_DESIGN_AMARIS.xlsx (Sheet1).
export default function ShippingPolicyPage() {
  return (
    <PolicyPage title="Shipping Policy" updated="2026">
      <section>
        <h2>Dispatch time</h2>
        <ul>
          <li>In-stock items: dispatched within 48 hours.</li>
          <li>Pre-order and custom-made items: dispatched in 45–60 days.</li>
        </ul>
      </section>
      <section>
        <h2>Delivery time after dispatch</h2>
        <ul>
          <li>Kerala: {DELIVERY_AFTER_DISPATCH.kerala}</li>
          <li>Rest of India: {DELIVERY_AFTER_DISPATCH.restOfIndia}</li>
          <li>International: {DELIVERY_AFTER_DISPATCH.international.toLowerCase()}</li>
        </ul>
      </section>
      <section>
        <h2>Domestic shipping</h2>
        <p>All domestic orders are shipped by India Post. You will receive the consignment number by email when your order is dispatched.</p>
      </section>
      <section>
        <h2>International shipping</h2>
        <p>International orders are shipped by courier. Rates are shown at checkout. Customs and import duties are paid by the customer.</p>
      </section>
      <section>
        <h2>Address accuracy</h2>
        <p>Please check your address, PIN code and phone number before paying. We are not responsible for delays caused by incorrect details.</p>
      </section>
    </PolicyPage>
  );
}
