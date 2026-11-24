import { ArrowUpRight, MessageCircle, Phone } from "lucide-react";
import { TrackForm } from "./TrackForm";
import { INDIA_POST_TRACKING_URL } from "@/config/shop";
import { site, whatsappLink } from "@/config/site";
import { PageHeader } from "@/components/layout/PageHeader";

export const metadata = { title: "Track Order" };

/** Steps from the client's Shipping Policy (§6 Tracking Your Order). */
const STEPS = [
  "Click the button below to open the India Post tracking portal.",
  "Enter your Consignment Number and the displayed Captcha Code.",
  "Click “Search” to view your live delivery status.",
];

/**
 * Tracking goes to India Post (all domestic deliveries are India Post). The consignment number is in the dispatch
 * email; customers who don't have it can look it up below with their order number + email.
 */
export default function TrackOrderPage() {
  return (
    <>
      <PageHeader title="Track your order" subtitle="All deliveries within India are handled by India Post." />
      <section className="container-x grid gap-6 py-14 md:py-20 lg:grid-cols-[1.1fr_1fr] lg:gap-8">
        {/* Primary: India Post */}
        <div data-reveal className="card flex flex-col p-8 md:p-10">
          <p className="eyebrow">India Post</p>
          <h2 className="mt-2 font-display text-3xl md:text-4xl">Track on India Post</h2>
          <p className="mt-3 text-sm text-muted">
            Your India Post Consignment Number is in your dispatch email.
          </p>
          <ol className="mt-8 space-y-5">
            {STEPS.map((s, i) => (
              <li key={s} className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gold/60 font-display text-lg text-maroon">
                  {i + 1}
                </span>
                <span className="pt-1 text-sm leading-relaxed">{s}</span>
              </li>
            ))}
          </ol>
          <a
            href={INDIA_POST_TRACKING_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary mt-10 w-full gap-2 sm:w-auto sm:self-start"
          >
            Open India Post tracking
            <ArrowUpRight size={16} strokeWidth={1.5} />
          </a>
          <p className="mt-auto pt-8 text-xs leading-relaxed text-muted">
            Tracking is generated only upon dispatch (not available for pre-order or custom items until ready to ship). For in-stock
            orders, contact Customer Care if you do not receive tracking details within 48 hours.
          </p>
        </div>

        {/* Secondary: find the consignment number + customer care */}
        <div className="flex flex-col gap-6">
          <div data-reveal className="card p-8 md:p-10">
            <h2 className="font-display text-2xl">Don&apos;t have your consignment number?</h2>
            <p className="mt-2 mb-6 text-sm text-muted">Enter your order number and email to find it.</p>
            <TrackForm />
          </div>
          <div data-reveal className="card p-8">
            <h2 className="font-display text-2xl">Customer Care</h2>
            <p className="mt-2 text-sm text-muted">{site.hours}</p>
            <div className="mt-5 flex flex-wrap gap-x-8 gap-y-3 text-sm">
              <a href={`tel:${site.phones[0].replace(/\s/g, "")}`} className="inline-flex items-center gap-2 hover:text-maroon">
                <Phone size={16} strokeWidth={1.4} className="text-maroon" /> {site.phones[0]}
              </a>
              <a href={whatsappLink(undefined, "Hi, I need help tracking my order.")} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:text-maroon">
                <MessageCircle size={16} strokeWidth={1.4} className="text-maroon" /> WhatsApp us
              </a>
              <a href={`mailto:${site.emails[0]}`} className="break-all hover:text-maroon">
                {site.emails[0]}
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
