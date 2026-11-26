import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin/guard";
import { site } from "@/config/site";
import { formatINR } from "@/lib/format";
import { PrintButton } from "../PrintButton";

export const metadata = { title: "Shipping labels" };

/** India Post address labels, two per row on A4. Opened from Dispatch → Print labels. */
export default async function LabelsPage({ searchParams }: { searchParams: Promise<{ ids?: string }> }) {
  await requireAdmin("/admin/dispatch");
  const ids = ((await searchParams).ids ?? "").split(",").filter((x) => /^[0-9a-f-]{36}$/.test(x)).slice(0, 200);
  const orders = (await Promise.all(ids.map((id) => db.orders.get(id)))).filter((o) => !!o);

  return (
    <>
      <div className="mb-6 flex items-center justify-between print:hidden">
        <p className="text-sm text-muted">{orders.length} label{orders.length === 1 ? "" : "s"} · A4, two per row</p>
        <PrintButton label="Print labels" />
      </div>
      <div className="grid grid-cols-2 gap-4 print:gap-3">
        {orders.map((o) => {
          const a = o.shipping_address;
          return (
            <article key={o.id} className="break-inside-avoid border border-dashed border-ink/50 p-5 text-[13px] leading-snug">
              <p className="text-[10px] tracking-[0.2em] text-muted uppercase">To</p>
              <p className="mt-1 text-[16px] font-semibold">{a.full_name}</p>
              <p>{a.line1}</p>
              {a.line2 && <p>{a.line2}</p>}
              <p>
                {a.city}, {a.state}
              </p>
              {a.country === "IN" ? (
                <p className="text-[18px] font-semibold tracking-[0.15em]">PIN {a.pincode}</p>
              ) : (
                <p className="text-[18px] font-semibold tracking-[0.08em] uppercase">
                  {new Intl.DisplayNames(["en"], { type: "region" }).of(a.country) ?? a.country}
                  {a.pincode && a.pincode !== "00000" ? ` ${a.pincode}` : ""}
                </p>
              )}
              <p>Phone: {o.phone}</p>
              {o.payment_method === "cod" && (
                <p className="mt-2 inline-block border-2 border-ink px-2 py-1 text-[15px] font-bold tracking-wide">COD · COLLECT {formatINR(o.total)}</p>
              )}
              <div className="mt-4 flex items-end justify-between gap-4 border-t border-ink/20 pt-3 text-[11px]">
                <div>
                  <p className="text-[10px] tracking-[0.2em] text-muted uppercase">From</p>
                  <p className="font-medium">{site.name}</p>
                  {site.address.lines.map((l) => (
                    <p key={l}>{l}</p>
                  ))}
                  <p>
                    {site.address.state} · {site.phones[0]}
                  </p>
                </div>
                <p className="shrink-0 font-mono text-[12px] font-semibold">{o.order_number}</p>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
