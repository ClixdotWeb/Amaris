import Link from "next/link";

/**
 * Page title banner used across the site (listings, search, cart, checkout, account, policies, contact).
 * Background: public/Assets/burgundy-wall.webp (panelled wall from the atelier banner photo).
 * Colours follow the hero / atelier banner: ivory text, rose-gold accents.
 */
export function PageHeader({
  title,
  crumb,
  subtitle,
  children,
}: {
  title: string;
  crumb?: string;
  subtitle?: string | null;
  children?: React.ReactNode;
}) {
  return (
    <header className="relative isolate overflow-hidden bg-maroon-dark">
      <img src="/Assets/burgundy-wall.webp" alt="" aria-hidden className="absolute inset-0 -z-10 h-full w-full object-cover" />
      {/* Vignette: lifts the centre, deepens the edges */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_70%_90%_at_50%_45%,rgba(53,15,16,0.05)_0%,rgba(28,8,9,0.55)_70%,rgba(20,6,7,0.8)_100%)]"
      />

      <div className="container-x py-16 text-center md:py-24">
        <nav
          aria-label="Breadcrumb"
          className="animate-fade-up text-[10px] tracking-[0.35em] text-[#f8f1ea]/60 uppercase motion-reduce:animate-none md:text-[11px]"
        >
          <Link href="/" className="transition-colors hover:text-[#f8f1ea]">
            Home
          </Link>
          <span className="mx-3 text-[#ecc7ae]/60">/</span>
          <span className="text-[#ecc7ae]">{crumb ?? title}</span>
        </nav>

        <h1
          className="mt-5 animate-fade-up font-display text-[2.6rem] leading-[1.05] font-light text-[#f8f1ea] motion-reduce:animate-none md:text-6xl"
          style={{ animationDelay: "120ms" }}
        >
          {title}
        </h1>

        <span
          aria-hidden
          className="mx-auto mt-6 block h-px w-14 animate-fade-up bg-[#ecc7ae]/70 motion-reduce:animate-none"
          style={{ animationDelay: "240ms" }}
        />

        {subtitle && (
          <p
            className="mx-auto mt-6 max-w-xl animate-fade-up text-sm leading-relaxed text-[#f8f1ea]/70 motion-reduce:animate-none md:text-base"
            style={{ animationDelay: "320ms" }}
          >
            {subtitle}
          </p>
        )}

        {children && (
          <div className="mt-8 animate-fade-up motion-reduce:animate-none" style={{ animationDelay: "400ms" }}>
            {children}
          </div>
        )}
      </div>
    </header>
  );
}
