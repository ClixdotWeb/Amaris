import { PolicyPage } from "@/components/PolicyPage";

export const metadata = { title: "Privacy Policy" };

// TODO: replace with the client's EXACT wording from WEBSITE_DESIGN_AMARIS.xlsx (Sheet1).
export default function PrivacyPage() {
  return (
    <PolicyPage title="Privacy Policy" updated="2026">
      <section>
        <h2>Information we collect</h2>
        <p>{/* paste */}</p>
      </section>
      <section>
        <h2>How we use your information</h2>
        <p>{/* paste */}</p>
      </section>
      <section>
        <h2>Payments</h2>
        <p>Payments are processed securely by Razorpay. We do not store your card details.</p>
      </section>
      <section>
        <h2>Contact</h2>
        <p>{/* paste */}</p>
      </section>
    </PolicyPage>
  );
}
