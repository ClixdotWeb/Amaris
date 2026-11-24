import { PolicyPage } from "@/components/PolicyPage";

export const metadata = { title: "Privacy Policy" };

// Client's wording from WEBSITE_DESIGN_AMARIS.xlsx (Sheet1).
export default function PrivacyPage() {
  return (
    <PolicyPage title="Privacy Policy" updated="2026">
      <section>
        <h2>1. Introduction</h2>
        <p>
          Amaris Boutique (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;) values your privacy and is committed to protecting
          your personal data. This Privacy Policy explains how we collect, use, share, and safeguard your information when you visit our
          website or shop with us.
        </p>
      </section>
      <section>
        <h2>2. Information We Collect</h2>
        <p>When you browse our store or place an order, we collect information you provide directly, including:</p>
        <ul>
          <li>
            <strong>Contact &amp; Delivery Details:</strong> Name, email address, phone number, and shipping/billing address.
          </li>
          <li>
            <strong>Order &amp; Payment Details:</strong> Purchase history and transaction details. (Note: Payments are processed securely
            through encrypted third-party payment gateways; we do not store your full credit/debit card or banking details on our
            servers.)
          </li>
          <li>
            <strong>Technical Data:</strong> Non-personal information such as your IP address, device type, browser, and cookies to
            improve website functionality and your shopping experience.
          </li>
        </ul>
      </section>
      <section>
        <h2>3. How We Use Your Information</h2>
        <p>We use your information strictly to:</p>
        <ul>
          <li>Process, stitch, pack, and deliver your orders.</li>
          <li>Send order confirmations, tracking updates, and customer support responses.</li>
          <li>Send promotional offers or newsletters (only if you have opted in; you may unsubscribe at any time).</li>
          <li>Prevent fraud and improve our website, products, and services.</li>
        </ul>
      </section>
      <section>
        <h2>4. Information Sharing &amp; Disclosure</h2>
        <p>We never sell, rent, or trade your personal information. We only share necessary data with:</p>
        <ul>
          <li>
            <strong>Trusted Service Providers:</strong> Logistics partners (such as India Post and international couriers), payment
            gateways, and website hosting providers who are contractually bound to keep your data secure and confidential.
          </li>
          <li>
            <strong>Legal Authorities:</strong> When required by applicable Indian law, court order, or government regulation, or to
            protect the legal rights and safety of Amaris Boutique and our customers.
          </li>
        </ul>
      </section>
      <section>
        <h2>5. Data Security &amp; Retention</h2>
        <p>
          We implement reasonable administrative and technical safeguards to protect your personal data against unauthorized access, loss,
          or misuse. While we strive to use commercially acceptable security measures, no online transmission or electronic storage is
          100% secure. We retain your data only as long as necessary to fulfill orders and meet legal or tax obligations.
        </p>
      </section>
      <section>
        <h2>6. Your Privacy Rights</h2>
        <p>
          You have the right to access, correct, update, or request the deletion of your personal information held by us, as well as
          withdraw consent for marketing communications. To exercise these rights, please reach out using the contact details below.
        </p>
      </section>
      <section>
        <h2>7. Policy Updates</h2>
        <p>
          We may update this Privacy Policy periodically to reflect operational or legal changes. Any updates will be posted on this page
          with an updated effective date.
        </p>
      </section>
      <section>
        <h2>8. Contact &amp; Grievance Officer</h2>
        <p>For questions, data requests, or privacy-related concerns, please contact us:</p>
        <ul>
          <li>Business Name: Amaris Boutique</li>
          <li>
            Phone / WhatsApp: <a href="tel:+918547572576">+91 8547572576</a>
          </li>
          <li>
            Email: <a href="mailto:amarisbymarias@gmail.com">amarisbymarias@gmail.com</a>
          </li>
        </ul>
      </section>
    </PolicyPage>
  );
}
