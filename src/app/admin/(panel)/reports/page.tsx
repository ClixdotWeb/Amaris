import Link from "next/link";
import { Download } from "lucide-react";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin/guard";
import { RANGES, reportRange } from "@/lib/admin/reportRange";
import { formatINR } from "@/lib/format";
import { EmptyState, FilterPills, PageHeader, Section } from "@/components/admin/ui";

export const metadata = { title: "Reports" };

type SP = { range?: string; from?: string; to?: string };

function CsvLink({ sp, kind }: { sp: SP; kind: string }) {
  const q = new URLSearchParams(Object.entries({ ...sp, kind }).filter((e): e is [string, string] => !!e[1]));
  return (
    <a href={`/api/admin/reports/csv?${q}`} className="inline-flex items-center gap-1.5 text-[11px] tracking-[0.16em] text-maroon uppercase hover:underline">
      <Download size={13} strokeWidth={1.6} aria-hidden /> CSV
    </a>
  );
}

/** A horizontal bar row: label, bar (share of the largest), figure. */
function BarRow({ label, value, max, figure }: { label: string; value: number; max: number; figure: string }) {
  return (
    <li className="grid grid-cols-[minmax(0,10rem)_minmax(0,1fr)_auto] items-center gap-4 py-2.5 sm:grid-cols-[minmax(0,14rem)_minmax(0,1fr)_7rem]">
      <span className="truncate text-sm">{label}</span>
      <span className="h-2.5 overflow-hidden rounded-full bg-sand/60" aria-hidden>
        <span className="block h-full rounded-full bg-gradient-to-r from-maroon to-maroon-dark" style={{ width: `${max ? Math.max(2, (value / max) * 100) : 0}%` }} />
      </span>
      <span className="stat-number text-right text-sm">{figure}</span>
    </li>
  );
}

export default async function ReportsPage({ searchParams }: { searchParams: Promise<SP> }) {
  await requireAdmin("/admin/reports");
  const sp = await searchParams;
  const r = reportRange(sp);
  const rep = await db.reports.sales(r.fromIso, r.toIso);
  const csvSp: SP = r.key === "custom" ? { from: r.fromDay, to: r.toDay } : { range: r.key };
  const fmtDay = (d: string, year = false) =>
    new Date(`${d}T12:00:00+05:30`).toLocaleDateString("en-IN", { day: "numeric", month: "short", ...(year ? { year: "numeric" } : {}), timeZone: "Asia/Kolkata" });
  // Long periods are grouped so every bar stays readable: by week after 45 days, by month after 120
  const unit = rep.byDay.length > 120 ? "month" : rep.byDay.length > 45 ? "week" : "day";
  const buckets: { key: string; label: string; revenue: number; orders: number }[] = [];
  rep.byDay.forEach((d, i) => {
    const key = unit === "month" ? d.day.slice(0, 7) : unit === "week" ? String(Math.floor(i / 7)) : d.day;
    const last = buckets.at(-1);
    if (last && last.key === key) {
      last.revenue += d.revenue;
      last.orders += d.orders;
    } else
      buckets.push({
        key,
        label: unit === "month" ? new Date(`${d.day}T12:00:00+05:30`).toLocaleDateString("en-IN", { month: "short", year: "2-digit", timeZone: "Asia/Kolkata" }) : unit === "week" ? `Week of ${fmtDay(d.day)}` : fmtDay(d.day),
        revenue: d.revenue,
        orders: d.orders,
      });
  });
  const maxDay = Math.max(1, ...buckets.map((d) => d.revenue));
  const showEvery = Math.ceil(buckets.length / 12);

  const kpis = [
    { label: "Revenue", value: formatINR(rep.kpis.revenue) },
    { label: "Paid orders", value: rep.kpis.orders },
    { label: "Average order", value: formatINR(rep.kpis.aov) },
    { label: "Items sold", value: rep.kpis.items },
    { label: "Stitching income", value: formatINR(rep.kpis.stitching) },
  ];

  return (
    <>
      <PageHeader eyebrow="Insights" title="Reports" description={`Paid orders from ${fmtDay(r.fromDay, true)} to ${fmtDay(r.toDay, true)} (India time). Cancelled and refunded orders aren't counted.`} />

      <Section
        title="Period"
        toolbar={
          <div className="flex flex-wrap items-end gap-4">
            <div className="min-w-0 flex-1">
              <FilterPills stretch items={RANGES.map((x) => ({ href: `/admin/reports?range=${x.key}`, label: x.label, active: r.key === x.key }))} />
            </div>
            <form className="flex flex-wrap items-end gap-2">
              <label className="block">
                <span className="mb-1 block text-xs text-muted">From</span>
                <input type="date" name="from" defaultValue={r.fromDay} className="!h-10 !py-0 text-sm" />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs text-muted">To</span>
                <input type="date" name="to" defaultValue={r.toDay} className="!h-10 !py-0 text-sm" />
              </label>
              <button type="submit" className="btn-primary btn-sm !h-10 !py-0">Show</button>
            </form>
          </div>
        }
      >
        <div className="grid gap-3 px-1 pt-3 pb-3 sm:grid-cols-2 lg:grid-cols-5">
          {kpis.map((k) => (
            <div key={k.label} className="rounded-[14px] bg-cream/45 px-5 py-4">
              <p className="text-[11px] tracking-[0.16em] text-muted uppercase">{k.label}</p>
              <p className="stat-number mt-2 text-2xl">{k.value}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title={`Revenue by ${unit}`} description={unit === "day" ? undefined : "Hover a bar for its total. The CSV has every day."} actions={<CsvLink sp={csvSp} kind="days" />}>
        {rep.kpis.orders === 0 ? (
          <EmptyState title="No sales in this period">Try a longer period.</EmptyState>
        ) : (
          <div className="px-3 pb-4" role="img" aria-label={`Revenue by day, ${formatINR(rep.kpis.revenue)} in total`}>
            <div className={`flex h-56 items-end ${buckets.length > 40 ? "gap-[2px]" : "gap-1.5"}`}>
              {buckets.map((d) => (
                <div key={d.key} className="group/bar relative flex h-full min-w-0 flex-1 items-end">
                  <span
                    className={`w-full rounded-t-[4px] transition-colors ${d.revenue ? "bg-gold/55 group-hover/bar:bg-maroon" : "bg-sand/60"}`}
                    style={{ height: d.revenue ? `${Math.max(3, (d.revenue / maxDay) * 100)}%` : "2px" }}
                  />
                  <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1.5 -translate-x-1/2 rounded-full bg-ink px-2.5 py-1 text-[10px] whitespace-nowrap text-white opacity-0 transition-opacity group-hover/bar:opacity-100">
                    {d.label} · {formatINR(d.revenue)} · {d.orders} order{d.orders === 1 ? "" : "s"}
                  </span>
                </div>
              ))}
            </div>
            <div className={`mt-2 flex ${buckets.length > 40 ? "gap-[2px]" : "gap-1.5"}`} aria-hidden>
              {buckets.map((d, i) => (
                <span key={d.key} className="min-w-0 flex-1 overflow-visible text-center text-[10px] whitespace-nowrap text-muted">
                  {i % showEvery === 0 ? d.label.replace("Week of ", "") : ""}
                </span>
              ))}
            </div>
          </div>
        )}
      </Section>

      <div className="grid items-start gap-5 xl:grid-cols-2 [&>*]:min-w-0">
        <Section title="Best-selling products" description="Top 10 by revenue." actions={<CsvLink sp={csvSp} kind="products" />}>
          {rep.byProduct.length === 0 ? (
            <EmptyState title="No sales" />
          ) : (
            <ol className="px-3 pb-3">
              {rep.byProduct.slice(0, 10).map((p) => (
                <BarRow key={p.id ?? p.name} label={p.name} value={p.revenue} max={rep.byProduct[0].revenue} figure={formatINR(p.revenue)} />
              ))}
            </ol>
          )}
        </Section>
        <Section title="By category" actions={<CsvLink sp={csvSp} kind="categories" />}>
          {rep.byCategory.length === 0 ? (
            <EmptyState title="No sales" />
          ) : (
            <ul className="px-3 pb-3">
              {rep.byCategory.map((c) => (
                <BarRow key={c.name} label={c.name} value={c.revenue} max={rep.byCategory[0].revenue} figure={formatINR(c.revenue)} />
              ))}
            </ul>
          )}
        </Section>
      </div>

      <Section title="Sizes sold" description="Ready-made sizes and stitching sizes; “Custom” means the customer's own measurements." actions={<CsvLink sp={csvSp} kind="sizes" />}>
        {rep.bySize.length === 0 ? (
          <EmptyState title="No sized items sold" />
        ) : (
          <ul className="flex flex-wrap gap-2 px-3 pb-4">
            {rep.bySize.map((s) => (
              <li key={s.size} className="flex items-center gap-3 rounded-full bg-cream/60 py-1.5 pr-4 pl-1.5">
                <span className="flex h-8 min-w-8 items-center justify-center rounded-full bg-white px-2 text-xs font-medium">{s.size}</span>
                <span className="stat-number text-sm">{s.qty}</span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <p className="text-xs text-muted">
        Need a different view? <Link href="/admin/orders" className="text-maroon underline underline-offset-4">Orders</Link> lists every order with search and filters.
      </p>
    </>
  );
}
