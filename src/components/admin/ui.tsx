import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { AlertTriangle, ArrowUpRight, Inbox } from "lucide-react";
import { Lotus } from "@/components/ui/Lotus";

/** Small building blocks for admin pages, all from the site's tokens (docs/ADMIN_UI_GUIDE.md). */

/**
 * Page title block in the shop's editorial style: small-caps eyebrow with the lotus mark,
 * large Cormorant title, one-line description, actions on the right.
 */
export function PageHeader({
  title,
  description,
  actions,
  back,
  eyebrow,
}: {
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  back?: { href: string; label: string };
  /** Small line above the title (defaults to the back link when there is one). */
  eyebrow?: string;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
      <div className="min-w-0">
        {back ? (
          <Link href={back.href} className="mb-3 inline-flex items-center gap-2 text-[11px] tracking-[0.24em] text-muted uppercase transition-colors hover:text-maroon">
            <span aria-hidden>←</span> {back.label}
          </Link>
        ) : (
          eyebrow && (
            <p className="mb-3 flex items-center gap-2.5 text-[11px] tracking-[0.28em] text-muted uppercase">
              <Lotus width={16} height={11} className="shrink-0 text-gold" />
              {eyebrow}
            </p>
          )
        )}
        <h1 className="font-display text-[2.1rem] leading-[1.05] md:text-[2.75rem]">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Card({
  title,
  actions,
  children,
  className = "",
  padded = true,
  description,
  footer,
}: {
  title?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  padded?: boolean;
  /** One line under the title. */
  description?: React.ReactNode;
  /** Bottom strip inside the panel (e.g. pagination). */
  footer?: React.ReactNode;
}) {
  return (
    <section className={`card rounded-card ${className}`}>
      {(title || actions) && (
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 px-6 pt-6 pb-3">
          <div className="min-w-0">
            {title && <h2 className="font-display text-[1.65rem] leading-tight">{title}</h2>}
            {description && <p className="mt-0.5 text-[13px] text-muted">{description}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={padded ? "px-6 pt-3 pb-6" : ""}>{children}</div>
      {footer && <div className="border-t border-sand/60 px-6 py-4">{footer}</div>}
    </section>
  );
}

/**
 * A page section in the "manage" style: one white panel with its title, a toolbar (search, filters),
 * the list, and paging at the bottom, all inside.
 */
export function Section({
  title,
  description,
  actions,
  toolbar,
  footer,
  children,
  className = "",
}: {
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  toolbar?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`card flex flex-col rounded-card ${className}`} aria-label={title}>
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3 px-5 pt-6 pb-4 md:px-7">
        <div className="min-w-0">
          <h2 className="font-display text-[1.75rem] leading-tight">{title}</h2>
          {description && <p className="mt-1 text-[13px] text-muted">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {toolbar && <div className="px-5 pb-2 md:px-7">{toolbar}</div>}
      <div className="flex flex-1 flex-col px-2 pb-2 md:px-4">{children}</div>
      {footer && <div className="border-t border-sand/60 px-5 py-4 md:px-7">{footer}</div>}
    </section>
  );
}

/**
 * A section of a form: rounded card with its heading and a one-line explanation at the top,
 * then the fields. Replaces <fieldset>/<legend> (whose heading sat on the border line).
 */
export function FormSection({
  title,
  description,
  children,
  className = "",
}: {
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  const id = `section-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  return (
    <section aria-labelledby={id} className={`card rounded-card ${className}`}>
      <header className="border-b border-sand/70 px-6 pt-5 pb-4">
        <h2 id={id} className="font-display text-[1.45rem] leading-tight">{title}</h2>
        {description && <p className="mt-1 text-[13px] text-muted">{description}</p>}
      </header>
      <div className="grid gap-5 p-6 [&>*]:min-w-0">{children}</div>
    </section>
  );
}

/** A headline figure: label, big number, a short note; gold icon circle; lifts on hover when it links somewhere. */
export function StatCard({
  label,
  value,
  hint,
  href,
  icon: Icon,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  href?: string;
  icon?: LucideIcon;
}) {
  // Same structure on every card so a row of them lines up exactly:
  // [icon] LABEL ................ [↗]   ← top row (arrow only when the card opens a page)
  // big number
  // short note
  const body = (
    <>
      <div className="flex items-center gap-3">
        {Icon && (
          <span aria-hidden className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-gold-light/60 text-maroon">
            <Icon size={18} strokeWidth={1.5} />
          </span>
        )}
        <p className="min-w-0 flex-1 truncate text-[11px] font-medium tracking-[0.18em] text-muted uppercase">{label}</p>
        {href && (
          <span
            aria-hidden
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-sand text-muted transition-colors duration-300 group-hover:border-maroon group-hover:bg-maroon group-hover:text-white"
          >
            <ArrowUpRight size={15} strokeWidth={1.5} />
          </span>
        )}
      </div>
      <p className="stat-number mt-6 text-[2.4rem] leading-none">{value}</p>
      <p className="mt-2 min-h-[1.25rem] text-xs text-muted">{hint}</p>
    </>
  );
  return href ? (
    <Link href={href} className="card group flex h-full flex-col rounded-card p-6" aria-label={`${label}: ${typeof value === "string" || typeof value === "number" ? value : ""}. Open`}>
      {body}
    </Link>
  ) : (
    <div className="card flex h-full flex-col rounded-card p-6">{body}</div>
  );
}

/** Label + control + hint + error, linked for screen readers. */
export function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
  hideLabel = false,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  /** Visually hide the label when the section title already says it (still read by screen readers). */
  hideLabel?: boolean;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className={hideLabel ? "sr-only" : "mb-1.5 block text-[13px] font-medium text-ink"}>{label}</label>
      {children}
      {hint && <p id={`${htmlFor}-hint`} className="mt-1.5 text-xs leading-relaxed text-muted">{hint}</p>}
      {error && <p id={`${htmlFor}-error`} role="alert" className="mt-1 text-xs text-sale">{error}</p>}
    </div>
  );
}

export type BadgeTone = "neutral" | "gold" | "maroon" | "success" | "warning" | "danger";
const BADGE: Record<BadgeTone, string> = {
  neutral: "bg-sand/70 text-ink",
  gold: "bg-gold-light text-ink",
  maroon: "bg-maroon/10 text-maroon",
  success: "bg-success/10 text-success",
  warning: "bg-warning-light text-warning",
  danger: "bg-sale/10 text-sale",
};
export function Badge({ tone = "neutral", children }: { tone?: BadgeTone; children: React.ReactNode }) {
  return (
    <span className={`inline-block rounded-ui px-2.5 py-1 text-[11px] font-medium tracking-wider whitespace-nowrap uppercase ${BADGE[tone]}`}>
      {children}
    </span>
  );
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  children,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <span aria-hidden className="flex h-16 w-16 items-center justify-center rounded-full bg-gold-light/50 text-maroon ring-8 ring-gold-light/20">
        <Icon size={26} strokeWidth={1.25} />
      </span>
      <h2 className="mt-5 font-display text-[1.7rem]">{title}</h2>
      {children && <p className="mt-2 max-w-md text-sm text-muted">{children}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function ErrorState({ title = "Something went wrong", children, action }: { title?: string; children?: React.ReactNode; action?: React.ReactNode }) {
  return <EmptyState icon={AlertTriangle} title={title} action={action}>{children}</EmptyState>;
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden className={`animate-pulse rounded-ui bg-cream ${className}`} />;
}

/** Status filter pills: links that keep the URL shareable. */
export function FilterPills({
  items,
  stretch = false,
}: {
  items: { href: string; label: string; active: boolean; count?: number }[];
  /** Spread the pills across the full width on large screens (equal widths). */
  stretch?: boolean;
}) {
  return (
    <nav aria-label="Filter" className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
      {items.map((i) => (
        <Link
          key={i.href}
          href={i.href}
          aria-current={i.active ? "page" : undefined}
          className={`chip shrink-0 justify-center !text-[12px] ${stretch ? "lg:flex-1 lg:basis-0 lg:whitespace-nowrap" : ""} ${i.active ? "chip-active" : ""}`}
        >
          {i.label}
          {i.count != null && <span className="ml-1.5 opacity-70">{i.count}</span>}
        </Link>
      ))}
    </nav>
  );
}
