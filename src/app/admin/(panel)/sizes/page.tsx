import Link from "next/link";
import { Plus } from "lucide-react";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin/guard";
import { Badge, Card, PageHeader, Section } from "@/components/admin/ui";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { FlashToast } from "@/components/admin/Toaster";
import { SizeChartEditor } from "./SizeChartEditor";
import { deleteSizeChart } from "./actions";

export const metadata = { title: "Size guide" };

export default async function SizesPage({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  await requireAdmin("/admin/sizes");
  const { edit } = await searchParams;
  const [charts, categories] = await Promise.all([db.sizeCharts.list(), db.categories.list()]);
  const editing = edit === "new" ? null : (charts.find((c) => c.id === edit) ?? null);
  const catName = (slug: string) => categories.find((c) => c.slug === slug)?.name ?? slug;
  const cats = categories.map((c) => ({ slug: c.slug, name: c.name, chart: charts.find((s) => s.category_slugs.includes(c.slug))?.name ?? null }));
  const uncovered = categories.filter((c) => c.product_type !== "running_material" && !charts.some((s) => s.category_slugs.includes(c.slug)));

  return (
    <>
      <PageHeader
        eyebrow="Catalogue"
        title="Size guide"
        description="The size charts customers see on product pages when they choose a size or stitching."
        actions={
          <Link href="/admin/sizes?edit=new" className="btn-primary btn-sm">
            <Plus size={15} strokeWidth={1.5} aria-hidden /> Add chart
          </Link>
        }
      />
      <FlashToast messages={{ saved: "Size chart saved." }} />

      {(edit === "new" || editing) && (
        <Card title={editing ? `Edit ${editing.name}` : "New size chart"}>
          <SizeChartEditor key={edit} chart={editing} categories={cats} />
        </Card>
      )}

      {charts.map((c) => (
        <Section
          key={c.id}
          title={c.name}
          description={c.category_slugs.length ? `Shown on: ${c.category_slugs.map(catName).join(", ")}` : "Not linked to a category yet, so customers don't see it."}
          actions={
            <>
              <Link href={`/admin/sizes?edit=${c.id}`} className="btn-outline btn-sm">Edit</Link>
              <ConfirmButton action={deleteSizeChart} fields={{ id: c.id }} label="Remove" title={`Remove ${c.name}?`} message="Product pages of its categories will no longer show a size chart." confirmLabel="Remove chart" />
            </>
          }
        >
          <div className="overflow-x-auto px-1 pb-3">
            <table className="w-full min-w-[32rem] border-separate border-spacing-0 text-sm">
              <caption className="sr-only">{c.name}, in {c.unit}</caption>
              <thead>
                <tr>
                  <th className="!border-0 !bg-transparent text-left">{c.unit === "cm" ? "Centimetres" : "Inches"}</th>
                  {c.sizes.map((s) => (
                    <th key={s} className="!border-0 !bg-transparent !text-center">{s}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {c.rows.map((r) => (
                  <tr key={r.label} className="[&>*]:bg-cream/40 [&>*:first-child]:rounded-l-[10px] [&>*:last-child]:rounded-r-[10px]">
                    <th scope="row" className="!border-0 !py-3 text-left !text-[13px] !font-normal !tracking-normal !text-ink !normal-case">{r.label}</th>
                    {r.values.map((v, i) => (
                      <td key={i} className="!border-0 !py-3 text-center">{v || "—"}</td>
                    ))}
                  </tr>
                )).flatMap((row, i) => (i ? [<tr key={`gap-${i}`} aria-hidden className="h-1.5" />, row] : [row]))}
              </tbody>
            </table>
            {c.note && <p className="mt-3 text-xs text-muted">Note: {c.note}</p>}
          </div>
        </Section>
      ))}

      {uncovered.length > 0 && (
        <p className="flex flex-wrap items-center gap-2 text-sm text-muted">
          <Badge tone="warning">No size chart</Badge>
          {uncovered.map((c) => c.name).join(", ")}: their product pages don&apos;t show a chart. Link them to a chart with Edit.
        </p>
      )}
    </>
  );
}
