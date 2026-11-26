import { ExternalLink, Star } from "lucide-react";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin/guard";
import { formatDate } from "@/lib/format";
import { EmptyState, FilterPills, PageHeader, Section } from "@/components/admin/ui";
import { Pagination } from "@/components/admin/Pagination";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { Stars } from "@/components/reviews/Stars";
import { ReviewStatusButton } from "./ReviewButtons";
import { deleteReview } from "./actions";
import type { Review } from "@/types";

export const metadata = { title: "Reviews" };

const TABS: { key: Review["status"]; label: string; empty: string }[] = [
  { key: "pending", label: "Waiting for approval", empty: "New reviews from customers wait here until you approve them." },
  { key: "approved", label: "Approved", empty: "Approved reviews show on their product pages." },
  { key: "hidden", label: "Hidden", empty: "Hidden reviews stay out of the shop." },
];

export default async function ReviewsPage({ searchParams }: { searchParams: Promise<{ status?: string; page?: string }> }) {
  await requireAdmin("/admin/reviews");
  const sp = await searchParams;
  const status = (TABS.find((t) => t.key === sp.status)?.key ?? "pending") as Review["status"];
  const [result, counts] = await Promise.all([db.reviews.list({ status, page: Math.max(1, Number(sp.page) || 1), pageSize: 15 }), db.reviews.counts()]);
  const tab = TABS.find((t) => t.key === status)!;

  return (
    <>
      <PageHeader eyebrow="Marketing" title="Reviews" description="Customers write reviews on product pages. Nothing shows in the shop until you approve it." />
      <Section
        title={tab.label}
        toolbar={<FilterPills stretch items={TABS.map((t) => ({ href: t.key === "pending" ? "/admin/reviews" : `/admin/reviews?status=${t.key}`, label: t.label, active: t.key === status, count: counts[t.key] }))} />}
        footer={<Pagination basePath="/admin/reviews" params={{ status: status === "pending" ? undefined : status }} page={result.page} pageSize={result.pageSize} total={result.total} />}
      >
        {result.rows.length === 0 ? (
          <EmptyState icon={Star} title="Nothing here">{tab.empty}</EmptyState>
        ) : (
          <ul className="space-y-2 px-1 pb-2">
            {result.rows.map((r) => (
              <li key={r.id} className="rounded-[14px] bg-cream/40 p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <Stars value={r.rating} size={15} />
                      <span className="text-sm font-medium">{r.name}</span>
                      <span className="text-xs text-muted">{formatDate(r.created_at)}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted">
                      on{" "}
                      {r.product_slug ? (
                        <a href={`/product/${r.product_slug}#reviews`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-maroon">
                          {r.product_name} <ExternalLink size={11} />
                        </a>
                      ) : (
                        r.product_name
                      )}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {status !== "approved" && <ReviewStatusButton id={r.id} to="approved" label="Approve" primary />}
                    {status !== "hidden" && <ReviewStatusButton id={r.id} to="hidden" label="Hide" />}
                    {status !== "pending" && <ReviewStatusButton id={r.id} to="pending" label="Back to waiting" />}
                    <ConfirmButton action={deleteReview} fields={{ id: r.id }} label="Delete" title="Delete this review?" message="It will be removed for good. Hiding keeps it out of the shop without deleting it." confirmLabel="Delete review" />
                  </div>
                </div>
                {r.title && <p className="mt-3 font-medium">{r.title}</p>}
                <p className="mt-2 max-w-3xl text-sm leading-relaxed whitespace-pre-line">{r.body}</p>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </>
  );
}
