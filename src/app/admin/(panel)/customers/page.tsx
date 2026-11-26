import Link from "next/link";
import { Search, Users } from "lucide-react";
import { db, type CustomerRow } from "@/lib/db";
import { requireAdmin } from "@/lib/admin/guard";
import { formatDate, formatINR } from "@/lib/format";
import { Badge, EmptyState, FilterPills, PageHeader, Section } from "@/components/admin/ui";
import { DataTable } from "@/components/admin/DataTable";
import { Pagination } from "@/components/admin/Pagination";

export const metadata = { title: "Customers" };

const initials = (n: string) =>
  n
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ q?: string; show?: string; sort?: string; page?: string }> }) {
  await requireAdmin("/admin/customers");
  const sp = await searchParams;
  const sort = sp.sort === "spent" || sp.sort === "orders" ? sp.sort : undefined;
  const blocked = sp.show === "blocked" ? true : undefined;
  const result = await db.customers.list({ q: sp.q, blocked, sort, page: Math.max(1, Number(sp.page) || 1) });
  const keep = { q: sp.q, show: sp.show, sort };
  const href = (patch: Record<string, string | undefined>) => {
    const q = new URLSearchParams(Object.entries({ ...keep, ...patch }).filter((e): e is [string, string] => !!e[1]));
    return q.size ? `/admin/customers?${q}` : "/admin/customers";
  };

  return (
    <>
      <PageHeader eyebrow="Sales" title="Customers" description={`${result.total} customer${result.total === 1 ? "" : "s"}. Spend counts paid orders only.`} />
      <Section
        title="Manage customers"
        description="Search by name, email or phone. Open a customer to see their orders, add notes or block them."
        toolbar={
          <div className="space-y-4">
            <form role="search" className="relative flex w-full gap-2">
              {sp.show && <input type="hidden" name="show" value={sp.show} />}
              {sort && <input type="hidden" name="sort" value={sort} />}
              <label htmlFor="cust-q" className="sr-only">Search customers</label>
              <Search size={16} strokeWidth={1.5} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-muted" aria-hidden />
              <input id="cust-q" name="q" type="search" defaultValue={sp.q} placeholder="Name, email or phone" className="!h-10 !border-sand-strong/60 !py-0 !pl-10 text-sm" />
              <button type="submit" className="btn-primary btn-sm !h-10 shrink-0 !px-6 !py-0">Search</button>
            </form>
            <FilterPills
              stretch
              items={[
                { href: href({ show: undefined, sort: undefined }), label: "Newest", active: !blocked && !sort },
                { href: href({ show: undefined, sort: "spent" }), label: "Top spenders", active: !blocked && sort === "spent" },
                { href: href({ show: undefined, sort: "orders" }), label: "Most orders", active: !blocked && sort === "orders" },
                { href: href({ show: "blocked", sort: undefined }), label: "Blocked", active: !!blocked },
              ]}
            />
          </div>
        }
        footer={<Pagination basePath="/admin/customers" params={keep} page={result.page} pageSize={result.pageSize} total={result.total} />}
      >
        <DataTable<CustomerRow>
          caption="Customers"
          rows={result.rows}
          rowKey={(c) => c.id}
          empty={<EmptyState icon={Users} title={sp.q ? "Nobody matches" : blocked ? "No blocked customers" : "No customers yet"}>{sp.q ? "Try a different search." : "Customers appear once they sign up or order."}</EmptyState>}
          columns={[
            {
              key: "name",
              header: "Customer",
              cell: (c) => (
                <Link href={`/admin/customers/${c.id}`} className="group/c flex items-center gap-3 !no-underline">
                  <span aria-hidden className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-maroon/10 font-display text-[15px] text-maroon">{initials(c.full_name)}</span>
                  <span className="min-w-0">
                    <span className="block text-ink group-hover/c:text-maroon">{c.full_name}</span>
                    <span className="block text-xs text-muted">{c.email}</span>
                  </span>
                </Link>
              ),
            },
            { key: "phone", header: "Phone", cell: (c) => c.phone },
            { key: "orders", header: "Orders", align: "right", cell: (c) => <span className="stat-number">{c.orders}</span> },
            { key: "spent", header: "Spent", align: "right", cell: (c) => <span className="stat-number">{formatINR(c.spent)}</span> },
            { key: "last", header: "Last order", cell: (c) => (c.last_order_at ? formatDate(c.last_order_at) : <span className="text-muted">—</span>) },
            { key: "status", header: "Status", cell: (c) => (c.is_blocked ? <Badge tone="danger">Blocked</Badge> : <Badge tone="success">Active</Badge>) },
          ]}
        />
      </Section>
    </>
  );
}
