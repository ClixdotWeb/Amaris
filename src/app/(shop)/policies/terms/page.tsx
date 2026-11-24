import { PolicyPage } from "@/components/PolicyPage";

export const metadata = { title: "Terms of Service" };

// Client's wording from WEBSITE_DESIGN_AMARIS.xlsx (Sheet1).
export default function TermsPage() {
  return (
    <PolicyPage title="Terms of Service" updated="2026">
      <section>
        <h2>1. Agreement to Terms</h2>
        <p>
          By accessing, browsing, or purchasing from Amaris Boutique&rsquo;s website, you agree to be bound by these Terms of Service and
          all related store policies. If you do not agree with any part of these terms, please do not use our website or services.
        </p>
      </section>
      <section>
        <h2>2. Intellectual Property</h2>
        <p>
          All content on this website—including product designs, photographs, videos, logos, text, and graphics—is the exclusive property
          of Amaris Boutique and is protected under applicable copyright, trademark, and intellectual property laws. Unauthorized copying,
          reproduction, or commercial use of our media is strictly prohibited.
        </p>
      </section>
      <section>
        <h2>3. Orders, Pricing &amp; Availability</h2>
        <p>
          All products are subject to availability. We reserve the right to modify prices, limit order quantities, or refuse or cancel any
          order at our discretion (including in cases of pricing errors or suspected fraud).
        </p>
      </section>
      <section>
        <h2>4. Limitation of Liability</h2>
        <p>
          To the fullest extent permitted by law, Amaris Boutique is not liable for any indirect, incidental, or consequential damages
          arising from your use of our website, products, or third-party delivery services.
        </p>
      </section>
      <section>
        <h2>5. Third-Party Links</h2>
        <p>
          Our website may include links to external third-party websites or payment/courier portals not owned or operated by Amaris
          Boutique. We are not responsible for the content, security, or privacy practices of any third-party sites.
        </p>
      </section>
      <section>
        <h2>6. Governing Law &amp; Jurisdiction</h2>
        <p>
          These Terms shall be governed by and construed in accordance with the laws of India. Any disputes arising under these Terms shall
          be subject to the exclusive jurisdiction of the courts in Kerala, India.
        </p>
      </section>
      <section>
        <h2>7. Changes to Terms</h2>
        <p>
          We reserve the right to update or modify these Terms of Service at any time without prior notice. Continued use of our website
          after changes are posted constitutes your acceptance of the revised Terms.
        </p>
      </section>
      <section>
        <h2>8. Contact Us</h2>
        <p>For any questions regarding these Terms, please contact us:</p>
        <ul>
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
