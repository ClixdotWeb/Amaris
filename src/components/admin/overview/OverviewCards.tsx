import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowUpRight, IndianRupee, PackageOpen, ShoppingBag, TrendingDown, TrendingUp, Truck } from "lucide-react";
import { formatINR } from "@/lib/format";

/**
 * Overview headline cards: white rounded panels, title and note at the top, the big figure bottom-left,
 * and a round arrow button set into a notch in the bottom-right corner.
 * Below them, "Sales this week" shows the days as rounded pill bars.
 */

export type DayPoint = { day: string; label: string; orders: number; revenue: number };

export function StatTile({
  icon: Icon,
  title,
  note,
  value,
  href,
  extra,
}: {
  icon: LucideIcon;
  title: string;
  note: React.ReactNode;
  value: React.ReactNode;
  href: string;
  /** Small detail between the title and the figure (chips, photos) */
  extra?: React.ReactNode;
}) {
  return (
    // The shadow sits on the wrapper so it follows the notched shape (filter: drop-shadow)
    <div className="group tile-shadow relative h-full transition-transform duration-500 ease-soft hover:-translate-y-0.5">
      <Link
        href={href}
        className="tile-shape flex h-full min-h-[10rem] flex-col rounded-[22px] bg-white p-5 sm:min-h-[11.5rem] md:p-6"
        aria-label={`${title}: ${typeof value === "string" || typeof value === "number" ? value : ""}. Open`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[15px] font-medium text-ink">{title}</p>
            <p className="mt-0.5 text-xs text-muted">{note}</p>
          </div>
          <span aria-hidden className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cream/70 text-maroon">
            <Icon size={15} strokeWidth={1.6} />
          </span>
        </div>

        {extra && <div className="mt-4">{extra}</div>}

        <p className="stat-number mt-auto min-w-0 pt-5 pr-14 text-[clamp(2rem,2.5vw,2.6rem)] leading-none whitespace-nowrap text-ink">{value}</p>
      </Link>

      {/* Arrow button in the notch (same link; hidden from screen readers and Tab, the card above is the link) */}
      <Link
        href={href}
        tabIndex={-1}
        aria-hidden
        className="absolute right-0 bottom-0 flex h-12 w-12 items-center justify-center rounded-full bg-maroon-dark text-white transition-[transform,background-color] duration-500 ease-soft group-hover:rotate-45 group-hover:bg-maroon"
      >
        <ArrowUpRight size={19} strokeWidth={1.6} />
      </Link>
    </div>
  );
}

const pct = (now: number, before: number) => (before ? Math.round(((now - before) / before) * 100) : null);

function Change({ value, against }: { value: number | null; against: string }) {
  if (value === null) return <>Nothing {against} to compare</>;
  return (
    <span className="inline-flex items-center gap-1">
      {value >= 0 ? <TrendingUp size={12} aria-hidden /> : <TrendingDown size={12} aria-hidden />}
      {value >= 0 ? "+" : ""}
      {value}% vs {against}
    </span>
  );
}

export function OverviewTiles({
  fresh,
  preparing,
  days,
  soldOut,
  low,
}: {
  fresh: number;
  preparing: number;
  days: DayPoint[];
  soldOut: number;
  low: number;
}) {
  const today = days[days.length - 1];
  const yesterday = days[days.length - 2];
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
      <StatTile icon={Truck} title="To dispatch" note={`${fresh} new · ${preparing} being prepared`} value={fresh + preparing} href="/admin/orders?status=paid" />
      <StatTile icon={ShoppingBag} title="Orders today" note={`Yesterday: ${yesterday.orders}`} value={today.orders} href="/admin/orders" />
      <StatTile icon={IndianRupee} title="Revenue today" note={`Yesterday: ${formatINR(yesterday.revenue)}`} value={formatINR(today.revenue)} href="/admin/orders" />
      <StatTile icon={PackageOpen} title="Low stock" note={`${soldOut} sold out · ${low} almost out`} value={soldOut + low} href="/admin/products?stock=low" />
    </div>
  );
}

/** "Sales this week": total with the change against last week, and each day as a rounded pill bar. */
export function SalesTrend({ days, lastWeekRevenue }: { days: DayPoint[]; lastWeekRevenue: number }) {
  const week = days.reduce((s, d) => s + d.revenue, 0);
  const orders = days.reduce((s, d) => s + d.orders, 0);
  const change = pct(week, lastWeekRevenue);
  const max = Math.max(1, ...days.map((d) => d.revenue));
  const best = days.reduce((a, b) => (b.revenue > a.revenue ? b : a), days[0]);

  return (
    <div className="flex flex-1 flex-col gap-6 px-3 pb-4">
      {/* Summary row: the week's total first, then the supporting figures */}
      <div className="flex flex-wrap items-start gap-x-10 gap-y-4 border-b border-sand/60 pb-5">
        <div>
          <p className="text-[11px] tracking-[0.16em] text-muted uppercase">This week</p>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
            <p className="stat-number text-[1.75rem] leading-none">{formatINR(week)}</p>
            <span className="inline-flex rounded-full bg-maroon/10 px-2.5 py-1 text-[11px] text-maroon">
              <Change value={change} against="last week" />
            </span>
          </div>
        </div>
        <div>
          <p className="text-[11px] tracking-[0.16em] text-muted uppercase">Paid orders</p>
          <p className="stat-number mt-2 text-[1.75rem] leading-none">{orders}</p>
        </div>
        {best.revenue > 0 && (
          <div>
            <p className="text-[11px] tracking-[0.16em] text-muted uppercase">Best day</p>
            <p className="mt-2 text-sm leading-[1.75rem]">{best.label.split(",")[0]} · {formatINR(best.revenue)}</p>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col pt-4" role="img" aria-label={`Revenue per day this week: ${days.map((d) => `${d.label} ${formatINR(d.revenue)}`).join(", ")}`}>
        <div className="flex min-h-48 flex-1 items-end justify-between gap-2 sm:gap-3" aria-hidden>
          {days.map((d, i) => {
            const isToday = i === days.length - 1;
            const h = d.revenue ? Math.max(14, (d.revenue / max) * 88) : 10;
            return (
              <div key={d.day} className="group/bar relative flex h-full w-full max-w-[3.25rem] flex-1 items-end justify-center">
                <span
                  className={`w-full rounded-full transition-all duration-500 ease-soft ${
                    isToday
                      ? "bg-gradient-to-t from-maroon-dark to-maroon"
                      : d.revenue
                        ? "bg-gradient-to-t from-gold-light to-[color-mix(in_srgb,var(--color-gold)_35%,white)] group-hover/bar:to-gold/60"
                        : "bg-sand/70"
                  }`}
                  style={{ height: `${h}%` }}
                />
                <span
                  className={`pointer-events-none absolute left-1/2 z-10 -translate-x-1/2 rounded-full bg-ink px-2.5 py-1 text-[10px] whitespace-nowrap text-white transition-opacity ${
                    isToday ? "opacity-100" : "opacity-0 group-hover/bar:opacity-100"
                  }`}
                  style={{ bottom: `calc(${h}% + 8px)` }}
                >
                  {formatINR(d.revenue)} · {d.orders} order{d.orders === 1 ? "" : "s"}
                </span>
              </div>
            );
          })}
        </div>
        <div className="mt-3 flex justify-between gap-2 sm:gap-3" aria-hidden>
          {days.map((d, i) => (
            <span key={d.day} className={`w-full max-w-[3.25rem] flex-1 text-center text-xs ${i === days.length - 1 ? "font-medium text-maroon" : "text-muted"}`}>
              {d.label.split(" ")[0].replace(",", "")}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
