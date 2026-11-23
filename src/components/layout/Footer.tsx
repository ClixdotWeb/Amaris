import Link from "next/link";
import { Mail, MapPin, MessageCircle, Phone, Clock } from "lucide-react";
import { Instagram } from "@/components/icons/InstagramIcon";
import { categories, footerNav } from "@/config/navigation";
import { site, whatsappLink } from "@/config/site";
import { Logo } from "./Logo";

const heading = "mb-5 text-[12px] font-medium tracking-[0.2em] text-gold-light uppercase";
const link = "text-sm text-ivory/75 transition-colors hover:text-white";

export function Footer() {
  return (
    <footer className="mt-24 bg-maroon-dark pb-16 text-ivory lg:pb-0">
      <div data-reveal-stagger className="container-x grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.3fr]">
        <div>
          <Logo light className="h-28" />
          <p className="mt-6 max-w-xs text-sm leading-relaxed text-ivory/70">
            Sarees, suits and custom-made outfits from Paika, Kerala. Sister brands: {site.sisterBrands.join(" & ")}.
          </p>
          <div className="mt-6 flex gap-3">
            {site.instagram.map((i) => (
              <a
                key={i.handle}
                href={i.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Instagram @${i.handle}`}
                title={`@${i.handle}`}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-ivory/25 hover:border-gold hover:text-gold"
              >
                <Instagram size={17} strokeWidth={1.5} />
              </a>
            ))}
            <a
              href={whatsappLink()}
              aria-label="WhatsApp"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-ivory/25 hover:border-gold hover:text-gold"
            >
              <MessageCircle size={17} strokeWidth={1.5} />
            </a>
          </div>
        </div>

        <div>
          <h2 className={heading}>Shop</h2>
          <ul className="space-y-3">
            <li><Link className={link} href="/new-arrivals">New Arrivals</Link></li>
            {categories.slice(0, 6).map((c) => (
              <li key={c.slug}>
                <Link className={link} href={`/shop/${c.slug}`}>{c.name.replace(" – Custom Made", "")}</Link>
              </li>
            ))}
            <li><Link className={link} href="/hot-deals">Hot Deals</Link></li>
          </ul>
        </div>

        <div>
          <h2 className={heading}>Help</h2>
          <ul className="space-y-3">
            {[...footerNav.help, ...footerNav.policies].map((l) => (
              <li key={l.href}>
                <Link className={link} href={l.href}>{l.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className={heading}>Visit us</h2>
          <ul className="space-y-4 text-sm text-ivory/75">
            <li className="flex gap-3">
              <MapPin size={17} className="mt-0.5 shrink-0 text-gold" strokeWidth={1.5} />
              <address className="not-italic leading-relaxed">
                {site.address.lines.join(", ")}, {site.address.state}
              </address>
            </li>
            <li className="flex gap-3">
              <Phone size={17} className="mt-0.5 shrink-0 text-gold" strokeWidth={1.5} />
              <span>
                {site.phones.map((p) => (
                  <a key={p} href={`tel:${p.replace(/\s/g, "")}`} className="block hover:text-white">{p}</a>
                ))}
              </span>
            </li>
            <li className="flex gap-3">
              <Mail size={17} className="mt-0.5 shrink-0 text-gold" strokeWidth={1.5} />
              <a href={`mailto:${site.emails[0]}`} className="break-all hover:text-white">{site.emails[0]}</a>
            </li>
            <li className="flex gap-3">
              <Clock size={17} className="mt-0.5 shrink-0 text-gold" strokeWidth={1.5} />
              {site.hours}
            </li>
          </ul>
        </div>
      </div>

      <div data-reveal className="border-t border-ivory/10">
        <div className="container-x flex flex-col items-center justify-between gap-2 py-6 text-xs text-ivory/55 md:flex-row">
          <p>{site.footerLine}</p>
          <p>GSTIN: {site.gstin}</p>
        </div>
      </div>
    </footer>
  );
}
