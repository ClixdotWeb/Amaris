import { PolicyPage } from "@/components/PolicyPage";

export const metadata = { title: "Return & Refund Policy" };

// Client's wording from WEBSITE_DESIGN_AMARIS.xlsx (Sheet1). Section numbers dropped (they were not consecutive).
export default function ReturnRefundPage() {
  return (
    <PolicyPage title="Return & Refund Policy" updated="2026">
      <section>
        <p>
          All sales are final. We only offer replacements if your item arrives damaged, or if you receive the wrong product or size.
          Refunds are only issued if a replacement is out of stock.
        </p>
      </section>
      <section>
        <h2>How to Report an Issue</h2>
        <p>You must contact us within 24 hours of delivery and provide a continuous, unedited unboxing video. To be accepted, your video must clearly show:</p>
        <ul>
          <li>All sides of the sealed package, including the shipping label</li>
          <li>The full opening process from start to finish</li>
          <li>The damage or wrong item in clear lighting</li>
        </ul>
        <p>
          <strong>Please note:</strong> We cannot accept complaints without a complete unboxing video.
        </p>
      </section>
      <section>
        <h2>What Is Not Covered</h2>
        <p>We cannot accept returns or exchanges for:</p>
        <ul>
          <li>Damage caused by washing, misuse, or normal wear and tear</li>
          <li>Slight color differences caused by lighting or screen settings</li>
          <li>Minor details like loose threads or slight stitching variations</li>
          <li>Personal preference (if you simply change your mind or dislike the item)</li>
        </ul>
      </section>
      <section>
        <h2>Exchange Policy</h2>
        <p>
          Case-by-case exchanges are accepted within 3 days of delivery for unused items in original condition. Replacement items must be
          of equal or higher value (no price-difference refunds), and customers cover all courier costs, return and re-order charges.
        </p>
      </section>
      <section>
        <h2>Return Shipping</h2>
        <p>We do not provide return pickup. Customers must self-ship the product after approval. Shipping charges are non-refundable.</p>
      </section>
      <section>
        <h2>Wash &amp; Care Disclaimer</h2>
        <p>
          Please follow all garment wash and care instructions carefully. Amaris Boutique is not responsible for color fading, shrinkage,
          or fabric damage after washing or wear.
        </p>
      </section>
      <section>
        <h2>Disclaimer of Liability – Unauthorized Sellers</h2>
        <p>
          Amaris Boutique is not liable for any transactions, products, or damages resulting from purchases made through unauthorized
          third parties, counterfeit accounts, or fraudulent sellers misusing our intellectual property, including proprietary images and
          videos. Customers are solely responsible for verifying the authenticity of the sales channel prior to purchase.
        </p>
      </section>
      <section>
        <h2>Saree-Specific Policy</h2>
        <p>
          Natural weaving characteristics—such as minor thread variations, slubs, knots, and slight color differences—are normal and not
          considered defects. Valid defects only include tears, incorrect saree length, or a missing blouse piece (if one was included in
          the product description).
        </p>
      </section>
      <section>
        <h2>Partial Order Issue Policy</h2>
        <p>
          If you order multiple items and one fails our quality check before dispatch, we will offer a refund or a replacement for that
          specific item only. Canceling the entire order is not permitted.
        </p>
      </section>
      <section>
        <h2>Measurement &amp; Stitching Policy</h2>
        <p>
          Custom-stitched items are tailored strictly according to the measurements you provide. Amaris Boutique is not responsible for
          fitting issues caused by incorrect measurements. Any requested alterations will incur extra stitching and shipping charges.
        </p>
      </section>
      <section>
        <h2>Cancellation Policy</h2>
        <p>All orders are final once payment is completed. Orders cannot be canceled after confirmation or dispatch.</p>
      </section>
      <section>
        <h2>Contact Information</h2>
        <ul>
          <li>
            Customer Care: <a href="tel:+918547572576">+91 8547572576</a>
          </li>
          <li>
            Email: <a href="mailto:amarisbymarias@gmail.com">amarisbymarias@gmail.com</a>
          </li>
          <li>Working Hours: Monday – Saturday, 10:00 AM – 5:00 PM (IST)</li>
        </ul>
      </section>
      <section>
        <h2>Final Note</h2>
        <p>By placing an order with Amaris Boutique, you acknowledge and agree to all the terms and conditions listed above.</p>
      </section>
    </PolicyPage>
  );
}
