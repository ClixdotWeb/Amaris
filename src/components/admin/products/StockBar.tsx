import { stockLevel } from "@/lib/admin/productDisplay";
import type { ProductWithRelations } from "@/types";

const TONE = { ok: "bg-success", low: "bg-warning", out: "bg-sale" } as const;
/** Ten or more pieces fills the bar. */
const FULL = 10;

/** Stock as a small coloured bar: green in stock, amber low, red sold out. Sizes listed underneath. */
export function StockBar({ product }: { product: ProductWithRelations }) {
  const level = stockLevel(product);
  if (level.kind === "made_to_order") return <span className="text-xs text-muted">Made to order</span>;

  const label = level.kind === "out" ? "Sold out" : `${level.qty} ${level.unit === "m" ? "m" : level.qty === 1 ? "pc" : "pcs"}`;
  return (
    <div className="w-32 text-left">
      <div className="flex items-baseline justify-between gap-2 text-xs">
        <span className={level.kind === "out" ? "text-sale" : level.kind === "low" ? "text-warning" : "text-ink"}>{label}</span>
        {level.kind === "low" && <span className="text-[10px] tracking-wider text-warning uppercase">Low</span>}
      </div>
      <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-sand/70" aria-hidden>
        <div className={`h-full rounded-full ${TONE[level.kind]}`} style={{ width: `${Math.max(level.kind === "out" ? 0 : 6, Math.min(1, level.qty / FULL) * 100)}%` }} />
      </div>
      {product.variants.length > 0 && (
        <p
          className="mt-1 truncate text-[11px] text-muted"
          title={product.variants.map((v) => `${[v.size, v.colour].filter(Boolean).join(" / ") || "Stock"}: ${v.stock_qty}`).join(", ")}
        >
          {product.variants.some((v) => v.colour) ? (
            // Size × colour or per colour: a short summary (full list on hover)
            <>
              {product.variants.length} variants
              {product.variants.some((v) => v.stock_qty <= 0) && ` · ${product.variants.filter((v) => v.stock_qty <= 0).length} sold out`}
            </>
          ) : (
            product.variants.map((v) => (
              <span key={v.id} className={v.stock_qty <= 0 ? "line-through opacity-60" : ""}>
                {v.size} {v.stock_qty}
                {"  "}
              </span>
            ))
          )}
        </p>
      )}
    </div>
  );
}
