import {
  ArrowRight,
  Phone,
  Mail,
  MapPin,
  Clock,
  MessageCircle,
} from "lucide-react";
import { Instagram } from "@/components/icons/InstagramIcon";
import { site, whatsappLink } from "@/config/site";
import { PageHeader } from "@/components/layout/PageHeader";

export const metadata = { title: "Contact Us" };

type Item = { label: string; href: string; external?: boolean };
const tel = (p: string) => `tel:${p.replace(/\s/g, "")}`;

/** The four ways to reach the boutique. Each column: icon, title, details, one action. */
const CHANNELS: {
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  title: string;
  items: Item[];
  action: Item;
}[] = [
  {
    icon: Phone,
    title: "Call us",
    items: site.phones.map((p) => ({ label: p, href: tel(p) })),
    action: { label: "Call now", href: tel(site.phones[0]) },
  },
  {
    icon: MessageCircle,
    title: "WhatsApp",
    items: site.phones.map((p, i) => ({
      label: p,
      href: whatsappLink(site.whatsapp[i]),
      external: true,
    })),
    action: { label: "Open chat", href: whatsappLink(), external: true },
  },
  {
    icon: Mail,
    title: "Email",
    items: site.emails.map((e) => ({ label: e, href: `mailto:${e}` })),
    action: { label: "Send an email", href: `mailto:${site.emails[0]}` },
  },
  {
    icon: Instagram,
    title: "Instagram",
    items: site.instagram.map((i) => ({
      label: `@${i.handle}`,
      href: i.url,
      external: true,
    })),
    action: { label: "Follow us", href: site.instagram[0].url, external: true },
  },
];

export default function ContactPage() {
  const mapQuery = encodeURIComponent(`${site.name}, Paika, Kerala`);
  return (
    <>
      <PageHeader
        title="Contact us"
        subtitle={`We're here to help, ${site.hours}.`}
      />
      {/* Contact channels: one panel, four equal columns divided by hairlines (2×2 on small screens) */}
      <section className="container-x py-14 md:py-20">
        <ul
          data-reveal-stagger
          className="grid grid-cols-2 overflow-hidden rounded-[3px] border border-sand bg-white lg:grid-cols-4 [&>li]:border-sand [&>li:nth-child(odd)]:border-r [&>li:nth-child(-n+2)]:border-b lg:[&>li]:border-b-0 lg:[&>li:not(:last-child)]:border-r"
        >
          {CHANNELS.map(({ icon: Icon, title, items, action }) => (
            <li
              key={title}
              className="flex flex-col items-center px-5 py-10 text-center md:px-8 md:py-12"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-full border border-gold/50 text-maroon">
                <Icon size={21} strokeWidth={1.3} />
              </span>
              <h2 className="mt-5 font-display text-2xl">{title}</h2>
              <span aria-hidden className="mt-3 block h-px w-8 bg-gold/60" />
              <ul className="mt-5 space-y-2 text-sm text-muted">
                {items.map((it) => (
                  <li key={it.label} className="break-words">
                    <a
                      href={it.href}
                      {...(it.external
                        ? { target: "_blank", rel: "noopener noreferrer" }
                        : {})}
                      className="transition-colors hover:text-maroon"
                    >
                      {it.label}
                    </a>
                  </li>
                ))}
              </ul>
              {/* Action sits on the same baseline in every column */}
              <a
                href={action.href}
                {...(action.external
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
                className="group/act mt-auto inline-flex items-center gap-2 border-b border-maroon/30 pt-7 pb-1 text-[11px] tracking-[0.24em] text-maroon uppercase transition-colors hover:border-maroon"
              >
                {action.label}
                <ArrowRight
                  size={13}
                  strokeWidth={1.5}
                  className="transition-transform group-hover/act:translate-x-1"
                />
              </a>
            </li>
          ))}
        </ul>
      </section>

      {/* Page margins on the outer section, border on the inner box, so it lines up with the panel above */}
      <section className="container-x pb-6">
        <div
          data-reveal
          className="grid overflow-hidden rounded-[3px] border border-sand bg-white lg:grid-cols-[1fr_1.4fr]"
        >
          <div className="space-y-6 p-8 md:p-12">
            <h2 className="font-display text-3xl">Visit the boutique</h2>
            <p className="flex gap-3 text-sm text-muted">
              <MapPin
                size={18}
                className="mt-0.5 shrink-0 text-maroon"
                strokeWidth={1.5}
              />
              <span>
                {site.name}
                <br />
                {site.address.lines.map((l) => (
                  <span key={l}>
                    {l}
                    <br />
                  </span>
                ))}
                {site.address.state}, {site.address.country}
              </span>
            </p>
            <p className="flex gap-3 text-sm text-muted">
              <Clock
                size={18}
                className="mt-0.5 shrink-0 text-maroon"
                strokeWidth={1.5}
              />
              {site.hours}
            </p>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
            >
              Open in Google Maps
            </a>
          </div>
          {/* TODO: set site.mapEmbedUrl to the exact shop location embed */}
          <iframe
            src={
              site.mapEmbedUrl ||
              `https://www.google.com/maps?q=Paika+Kerala&output=embed`
            }
            title="Map to Amaris Boutique"
            loading="lazy"
            className="h-80 w-full border-0 lg:h-full lg:min-h-[420px]"
          />
        </div>
      </section>
    </>
  );
}
