import { TrackForm } from "./TrackForm";
import { INDIA_POST_TRACKING_URL } from "@/config/shop";
import { PageHeader } from "@/components/layout/PageHeader";

export const metadata = { title: "Track Order" };

export default function TrackOrderPage() {
  return (
    <>
      <PageHeader title="Track your order" subtitle="Domestic orders are shipped by India Post. Enter your details to get your consignment number." />
      <section className="container-x flex flex-col items-center py-14">
        <div className="card w-full max-w-lg p-8">
          <TrackForm />
        </div>
        <p className="mt-6 text-sm text-muted">
          Already have a consignment number?{" "}
          <a href={INDIA_POST_TRACKING_URL} target="_blank" rel="noopener noreferrer" className="text-maroon underline underline-offset-4">
            Track it on India Post
          </a>
        </p>
      </section>
    </>
  );
}
