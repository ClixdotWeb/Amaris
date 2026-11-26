import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin/guard";
import { formatDate } from "@/lib/format";
import { MEASUREMENT_FIELDS, MEASUREMENT_UNIT } from "@/config/shop";
import { site } from "@/config/site";
import { PrintButton } from "../../PrintButton";

export const metadata = { title: "Job card" };

/** The tailor's job card for one made-to-order item: what to make, the size or measurements, and the due date. */
export default async function JobCardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireAdmin("/admin/production");
  const row = await db.production.get(id);
  if (!row) notFound();
  const { item, order } = row;
  const sizing = item.sizing;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex justify-end print:hidden">
        <PrintButton label="Print job card" />
      </div>
      <article className="border border-ink/30 p-8">
        <header className="flex items-start justify-between gap-6 border-b border-ink/20 pb-5">
          <div>
            <p className="text-[10px] tracking-[0.25em] text-muted uppercase">{site.name} · Job card</p>
            <h1 className="mt-2 font-display text-3xl">{item.product_name}</h1>
            <p className="mt-1 text-sm">
              {item.stitching ? "Stitching (customer's fabric from this order)" : "Custom made"} · Quantity {item.quantity}
              {item.colour ? ` · ${item.colour}` : ""}
            </p>
          </div>
          {item.image_url && <img src={item.image_url} alt="" width={96} height={128} className="h-32 w-24 shrink-0 object-cover" />}
        </header>

        <dl className="grid grid-cols-3 gap-4 border-b border-ink/20 py-5 text-sm">
          <div>
            <dt className="text-[10px] tracking-[0.2em] text-muted uppercase">Order</dt>
            <dd className="mt-1 font-mono font-semibold">{order.order_number}</dd>
          </div>
          <div>
            <dt className="text-[10px] tracking-[0.2em] text-muted uppercase">Ordered</dt>
            <dd className="mt-1">{formatDate(order.created_at)}</dd>
          </div>
          <div>
            <dt className="text-[10px] tracking-[0.2em] text-muted uppercase">Due</dt>
            <dd className="mt-1 font-semibold">{formatDate(row.due_at)}</dd>
          </div>
          <div className="col-span-3">
            <dt className="text-[10px] tracking-[0.2em] text-muted uppercase">Customer</dt>
            <dd className="mt-1">
              {order.customer} · {order.phone}
            </dd>
          </div>
        </dl>

        <section className="py-5">
          <h2 className="text-[11px] tracking-[0.2em] uppercase">{sizing?.mode === "custom" ? `Measurements (${MEASUREMENT_UNIT})` : "Size"}</h2>
          {!sizing && <p className="mt-2 text-sm">No size given.</p>}
          {sizing?.mode === "standard" && <p className="mt-2 text-3xl font-semibold">{sizing.size}</p>}
          {sizing?.mode === "custom" && (
            <>
              <table className="mt-3 w-full text-sm">
                <tbody>
                  {MEASUREMENT_FIELDS.filter((f) => sizing.measurements[f.key] != null).map((f) => (
                    <tr key={f.key} className="border-b border-ink/10">
                      <th scope="row" className="!border-0 !bg-transparent !py-2 text-left !text-[13px] !font-normal !tracking-normal !text-ink !normal-case">{f.label}</th>
                      <td className="!border-0 !py-2 text-right font-mono text-base font-semibold">{sizing.measurements[f.key]}</td>
                    </tr>
                  ))}
                  {Object.entries(sizing.measurements)
                    .filter(([k]) => !MEASUREMENT_FIELDS.some((f) => f.key === k))
                    .map(([k, v]) => (
                      <tr key={k} className="border-b border-ink/10">
                        <th scope="row" className="!border-0 !bg-transparent !py-2 text-left !text-[13px] !font-normal !tracking-normal !text-ink capitalize">{k.replace(/_/g, " ")}</th>
                        <td className="!border-0 !py-2 text-right font-mono text-base font-semibold">{v}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
              {sizing.notes && <p className="mt-3 text-sm">Customer note: {sizing.notes}</p>}
            </>
          )}
        </section>

        <footer className="mt-4 grid grid-cols-2 gap-6 border-t border-ink/20 pt-5 text-sm">
          <p>Workshop note: {item.production_note ?? "________________________"}</p>
          <p>Checked by: ________________</p>
        </footer>
      </article>
      <p className="mt-4 text-center text-xs text-muted">Stitched strictly to the given measurements. Alterations are charged extra.</p>
    </div>
  );
}
