import { formatINR } from "@/lib/format";
import { getSettings } from "@/lib/data/settings";

/** Small lotus mark used as the separator (echoes the logo). */
function Lotus() {
  return (
    <svg viewBox="0 0 24 16" width="22" height="15" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden className="shrink-0">
      <path d="M12 1c2.2 2.4 2.2 7.6 0 12-2.2-4.4-2.2-9.6 0-12Z" />
      <path d="M12 13c-1.6-3.6-4.6-6-8-6.4.4 3.8 3.6 6.4 8 6.4Z" />
      <path d="M12 13c1.6-3.6 4.6-6 8-6.4-.4 3.8-3.6 6.4-8 6.4Z" />
    </svg>
  );
}

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
