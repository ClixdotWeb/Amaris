import Link from "next/link";
import { History } from "lucide-react";
import { z } from "zod";
import { db } from "@/lib/db";
import { formatINR } from "@/lib/format";
import { Badge, EmptyState, PageHeader, Section, type BadgeTone } from "@/components/admin/ui";
import { DataTable } from "@/components/admin/DataTable";
import { Pagination } from "@/components/admin/Pagination";
import { Select } from "@/components/admin/Select";
import type { ActivityEntry } from "@/types";

export const metadata = { title: "Activity log" };

const PAGE_SIZE = 30;
const TYPES: { value: ActivityEntry["entity_type"]; label: string; tone: BadgeTone }[] = [
  { value: "order", label: "Orders", tone: "maroon" },
  { value: "product", label: "Products", tone: "gold" },
  { value: "settings", label: "Settings", tone: "neutral" },
  { value: "admin", label: "Admins", tone: "warning" },
  { value: "session", label: "Sign-ins", tone: "neutral" },
  { value: "inventory", label: "Inventory", tone: "gold" },
  { value: "category", label: "Categories", tone: "gold" },
  { value: "collection", label: "Collections", tone: "gold" },
  { value: "size_chart", label: "Size guide", tone: "gold" },
  { value: "customer", label: "Customers", tone: "maroon" },
  { value: "coupon", label: "Coupons", tone: "success" },
  { value: "content", label: "Homepage", tone: "success" },
  { value: "review", label: "Reviews", tone: "success" },
];
/** Unknown types (e.g. added later) still show, instead of breaking the page */
const typeOf = (v: string) => TYPES.find((x) => x.value === v) ?? { value: v, label: v.replace(/_/g, " "), tone: "neutral" as BadgeTone };

const filters = z.object({
  actor: z.string().email().optional().catch(undefined),
  type: z.enum(TYPES.map((t) => t.value) as [ActivityEntry["entity_type"], ...ActivityEntry["entity_type"][]]).optional().catch(undefined),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().catch(undefined),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().catch(undefined),
  page: z.coerce.number().int().min(1).optional().catch(undefined),
});

/** Dates are picked in India time: from 00:00 IST to 23:59:59 IST. */
const istDay = (d: string, end: boolean) => new Date(`${d}T${end ? "23:59:59.999" : "00:00:00.000"}+05:30`).toISOString();

const when = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });

const entityLink = (a: ActivityEntry) =>
  ({
    order: a.entity_id && `/admin/orders/${a.entity_id}`,
    product: a.entity_id && `/admin/products/${a.entity_id}`,
    inventory: a.entity_id && `/admin/products/${a.entity_id}`,
    customer: a.entity_id && `/admin/customers/${a.entity_id}`,
    collection: a.entity_id && `/admin/collections/${a.entity_id}`,
    settings: "/admin/settings",
    category: "/admin/categories",
    size_chart: "/admin/sizes",
    coupon: "/admin/coupons",
    content: "/admin/content",
    review: "/admin/reviews",
  } as Record<string, string | null | undefined>)[a.entity_type] || null;

/** Money fields are stored in paise; show them in rupees. */
const MONEY = /price|charge|shipping|free_shipping|total|rates/;
function show(v: unknown, key: string): string {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "number" && MONEY.test(key)) return formatINR(v);
  if (key === "international_rates" && typeof v === "object")
    return Object.entries(v as Record<string, number>).map(([c, p]) => `${c} ${formatINR(p)}`).join(", ") || "none";
  if (typeof v === "boolean") return v ? "yes" : "no";
  if (Array.isArray(v)) return v.join(", ") || "none";
  if (typeof v === "object") return Object.entries(v as Record<string, unknown>).map(([k, x]) => `${k}: ${x}`).join(", ") || "none";
  return String(v);
}

export default async function ActivityPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const f = filters.parse(await searchParams);
  const [result, actors] = await Promise.all([
    db.activity.list({
      actor: f.actor,
      entityType: f.type,
      from: f.from ? istDay(f.from, false) : undefined,
      to: f.to ? istDay(f.to, true) : undefined,
      page: f.page,
      pageSize: PAGE_SIZE,
    }),
    db.activity.actors(),
  ]);
  const filtered = !!(f.actor || f.type || f.from || f.to);

  return (
    <>
      <PageHeader eyebrow="Settings" title="Activity log" description="Who changed what, and when. Entries can't be edited or deleted." />

      <Section
        title="Recent activity"
        description="Filter by admin, area or dates."
        footer={<Pagination basePath="/admin/activity" params={{ actor: f.actor, type: f.type, from: f.from, to: f.to }} page={result.page} pageSize={PAGE_SIZE} total={result.total} />}
        toolbar={
        <form className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto_auto_auto] lg:items-end">
          <div>
            <span className="mb-1.5 block text-xs text-muted">Admin</span>
            <Select name="actor" label="Admin" defaultValue={f.actor ?? ""} options={[{ value: "", label: "Everyone" }, ...actors.map((a) => ({ value: a, label: a }))]} />
          </div>
          <div>
            <span className="mb-1.5 block text-xs text-muted">Area</span>
            <Select name="type" label="Area" defaultValue={f.type ?? ""} options={[{ value: "", label: "All areas" }, ...TYPES.map((t) => ({ value: t.value, label: t.label }))]} />
          </div>
          <label className="block">
            <span className="mb-1.5 block text-xs text-muted">From</span>
            <input type="date" name="from" defaultValue={f.from} className="!h-10 !py-0 text-sm" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs text-muted">To</span>
            <input type="date" name="to" defaultValue={f.to} className="!h-10 !py-0 text-sm" />
          </label>
          <div className="flex gap-2">
            <button type="submit" className="btn-primary btn-sm !h-10">Filter</button>
            {filtered && <Link href="/admin/activity" className="btn-outline btn-sm !h-10">Clear</Link>}
          </div>
        </form>
        }
      >
        <DataTable<ActivityEntry>
          caption="Activity log"
          rows={result.rows}
          rowKey={(a) => a.id}
          empty={
            <EmptyState icon={History} title={filtered ? "Nothing matches" : "No activity yet"}>
              {filtered ? "Try other filters." : "Changes made in the dashboard will be listed here."}
            </EmptyState>
          }
          columns={[
            { key: "when", header: "When", cell: (a) => <span className="whitespace-nowrap">{when(a.created_at)}</span> },
            { key: "who", header: "Admin", cell: (a) => a.actor_email ?? "System" },
            {
              key: "what",
              header: "What",
              cell: (a) => {
                const t = typeOf(a.entity_type);
                const href = entityLink(a);
                return (
                  <div className="space-y-1 text-left">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={t.tone}>{t.label}</Badge>
                      {href ? <Link href={href}>{a.summary}</Link> : <span>{a.summary}</span>}
                    </div>
                    {a.diff && (
                      <ul className="text-xs text-muted">
                        {Object.entries(a.diff).map(([k, [before, after]]) => (
                          <li key={k}>
                            {k.replace(/_/g, " ")}: {show(before, k)} → <span className="text-ink">{show(after, k)}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              },
            },
          ]}
        />
      </Section>
    </>
  );
}
