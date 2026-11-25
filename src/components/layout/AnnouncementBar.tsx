import { formatINR } from "@/lib/format";
import { getSettings } from "@/lib/data/settings";
import { Lotus } from "@/components/ui/Lotus";

/** Infinite scrolling service marquee, shown under the home hero. Pauses on hover. */
export async function AnnouncementBar() {
  const s = await getSettings();
  const messages = [
    "In-stock items dispatched within 48 hours",
    s.free_shipping_above ? `Free India Post delivery above ${formatINR(s.free_shipping_above)}` : "Delivered across India by India Post",
    "Custom stitching to your measurements",
    "Secure payments by Razorpay",
  ];
  const row = (hidden: boolean) => (
    <ul className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
      {messages.map((m) => (
        <li key={m} className="flex items-center gap-10 pr-10 md:gap-14 md:pr-14">
          <span className="whitespace-nowrap">{m}</span>
          <span className="text-gold"><Lotus /></span>
        </li>
      ))}
    </ul>
  );
  return (
    <section data-reveal aria-label="Our services" className="overflow-hidden border-y border-ivory/10 bg-maroon-dark py-5 text-ivory md:py-6">
      <div className="flex w-max animate-marquee font-display text-xl italic md:text-2xl hover:[animation-play-state:paused] motion-reduce:animate-none">
        {row(false)}
        {row(true)}
        {row(true)}
        {row(true)}
      </div>
    </section>
  );
}
