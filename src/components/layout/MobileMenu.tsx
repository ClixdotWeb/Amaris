"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Phone, MessageCircle, Plus } from "lucide-react";
import { footerNav, isGroup, type HeaderNavItem } from "@/config/navigation";
import { site, whatsappLink } from "@/config/site";

const row =
  "flex w-full items-center justify-between py-4 text-[13px] tracking-[0.16em] uppercase";

/** Hamburger drawer: same groups as the desktop nav, shown as accordions. */
export function MobileMenu({
  nav,
  images,
}: {
  nav: HeaderNavItem[];
  images: Record<string, string | undefined>;
}) {
  const [open, setOpen] = useState(false);
  const [section, setSection] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const path = usePathname();

  // The drawer is portalled to <body>: the header's backdrop-filter would otherwise trap
  // these fixed-position elements inside the header box.
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    setOpen(false);
    setSection(null);
  }, [path]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-label="Open menu"
        aria-expanded={open}
        className="-ml-1 p-1 lg:hidden"
        onClick={() => setOpen(true)}
      >
        <Menu size={24} strokeWidth={1.5} />
      </button>

      {mounted &&
        createPortal(
          <>
            <div
              className={`fixed inset-0 z-[60] bg-ink/40 transition-opacity lg:hidden ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
              onClick={() => setOpen(false)}
              aria-hidden
            />
            <aside
              className={`fixed inset-y-0 left-0 z-[70] flex w-[86%] max-w-sm flex-col bg-ivory shadow-xl transition-transform duration-300 lg:hidden ${
                open ? "translate-x-0" : "-translate-x-full"
              }`}
              aria-label="Menu"
              inert={!open}
            >
              <div className="flex items-center justify-between border-b border-sand px-5 py-4">
                <Link href="/" aria-label="Amaris Boutique home">
                  <img
                    src="/Assets/logo-dark.png"
                    alt="Amaris Boutique"
                    className="h-12 w-auto"
                  />
                </Link>
                <button
                  type="button"
                  aria-label="Close menu"
                  onClick={() => setOpen(false)}
                >
                  <X size={24} strokeWidth={1.5} />
                </button>
              </div>

              <nav
                className="flex-1 overflow-y-auto px-5 py-2"
                aria-label="Main"
              >
                <ul>
                  {nav.map((item) => {
                    if (!isGroup(item)) {
                      const active = path.startsWith(item.href);
                      return (
                        <li key={item.href} className="border-b border-sand/70">
                          <Link
                            href={item.href}
                            className={`${row} ${item.tone === "sale" ? "font-medium text-sale" : active ? "text-maroon" : ""}`}
                          >
                            {item.label}
                          </Link>
                        </li>
                      );
                    }
                    const expanded = section === item.label;
                    const id = `m-${item.label.replace(/\W+/g, "-").toLowerCase()}`;
                    return (
                      <li key={item.label} className="border-b border-sand/70">
                        <button
                          type="button"
                          aria-expanded={expanded}
                          aria-controls={id}
                          onClick={() =>
                            setSection(expanded ? null : item.label)
                          }
                          className={`${row} ${item.children.some((c) => path.startsWith(c.href)) ? "text-maroon" : ""}`}
                        >
                          {item.label}
                          <Plus
                            size={16}
                            strokeWidth={1.25}
                            className={`transition-transform duration-300 ${expanded ? "rotate-45" : ""}`}
                          />
                        </button>
                        <div
                          id={id}
                          className={`grid transition-[grid-template-rows] duration-300 ease-out ${expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
                        >
                          <ul className="overflow-hidden" inert={!expanded}>
                            {item.children.map((c) => (
                              <li key={c.href}>
                                <Link
                                  href={c.href}
                                  className={`flex items-center gap-4 py-2.5 pl-1 text-[12px] tracking-[0.14em] uppercase ${
                                    path.startsWith(c.href)
                                      ? "text-maroon"
                                      : "text-ink/80"
                                  }`}
                                >
                                  {item.kind === "mega" && (
                                    <span className="h-12 w-10 shrink-0 overflow-hidden rounded-[3px] bg-cream">
                                      {images[c.slug] && (
                                        <img
                                          src={images[c.slug]}
                                          alt=""
                                          loading="lazy"
                                          className="h-full w-full object-cover"
                                        />
                                      )}
                                    </span>
                                  )}
                                  {c.label}
                                </Link>
                              </li>
                            ))}
                            <li className="h-3" aria-hidden />
                          </ul>
                        </div>
                      </li>
                    );
                  })}
                </ul>

                <ul className="mt-6 space-y-3 text-sm text-muted">
                  {footerNav.help.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href}>{l.label}</Link>
                    </li>
                  ))}
                </ul>
              </nav>

              <div className="space-y-2 border-t border-sand px-5 py-4 text-sm">
                <a
                  href={`tel:${site.phones[0].replace(/\s/g, "")}`}
                  className="flex items-center gap-2"
                >
                  <Phone size={16} /> {site.phones[0]}
                </a>
                <a
                  href={whatsappLink()}
                  className="flex items-center gap-2 text-success"
                >
                  <MessageCircle size={16} /> Chat on WhatsApp
                </a>
              </div>
            </aside>
          </>,
          document.body,
        )}
    </>
  );
}
