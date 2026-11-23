import { PolicyPage } from "@/components/PolicyPage";

export const metadata = { title: "Terms of Service" };

// TODO: replace with the client's EXACT wording from WEBSITE_DESIGN_AMARIS.xlsx (Sheet1).
export default function TermsPage() {
  return (
    <PolicyPage title="Terms of Service" updated="2026">
      <section>
        <h2>Orders and payment</h2>
        <p>{/* paste */}</p>
      </section>
      <section>
        <h2>Products</h2>
        <p>{/* paste */}</p>
      </section>
      <section>
        <h2>Governing law</h2>
        <p>These terms are governed by the laws of India. Any disputes are subject to the jurisdiction of the courts in Kerala.</p>
      </section>
    </PolicyPage>
  );
}
