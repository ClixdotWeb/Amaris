"use client";
import { useMemo, useState } from "react";
import { Plus, Wand2, X } from "lucide-react";
import { Select } from "@/components/admin/Select";
import type { ProductColour, ProductImage, ProductType, ProductVariant } from "@/types";

/**
 * Sizes, colours and stock for one product.
 *  - ready made: sizes × colours, stock per combination
 *  - unstitched / running material: colours, stock per colour (metres for running material)
 *  - custom made: sizes and colours offered, no stock (made to order)
 * Writes hidden fields read by saveProduct: sizes, colours_json, variants_json (and stock_qty when there are no variants).
 */
type Line = { size: string; colour: string | null; stock: string; sku: string; price: string };
type Colour = { name: string; hex: string; image_index: number | null };

const COMMON_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "3XL"];
const key = (size: string, colour: string | null) => `${size}|${colour ?? ""}`;
const abbrev = (s: string) => s.replace(/[^A-Za-z0-9]/g, "").slice(0, 3).toUpperCase();

export function VariantEditor({
  type,
  productCode,
  initialSizes,
  initialColours,
  initialVariants,
  initialStock,
  images,
}: {
  type: ProductType;
  productCode: string;
  initialSizes: string[];
  initialColours: ProductColour[];
  initialVariants: ProductVariant[];
  initialStock: number;
  images: Pick<ProductImage, "id" | "url" | "thumb_url">[];
}) {
  const sizesAllowed = type === "ready_made" || type === "custom_made";
  const tracksStock = type !== "custom_made";
  const unit = type === "running_material" ? "m" : "pcs";

  const [sizes, setSizes] = useState<string[]>(sizesAllowed ? initialSizes : []);
  const [sizeDraft, setSizeDraft] = useState("");
  const [colours, setColours] = useState<Colour[]>(initialColours.map((c) => ({ name: c.name, hex: c.hex, image_index: c.image_index })));
  const [perColourStock, setPerColourStock] = useState(initialVariants.some((v) => v.colour));
  const [lines, setLines] = useState<Record<string, Line>>(() =>
    Object.fromEntries(
      initialVariants.map((v) => [
        key(v.size, v.colour ?? null),
        { size: v.size, colour: v.colour ?? null, stock: String(v.stock_qty), sku: v.sku ?? "", price: v.price != null ? String(v.price / 100) : "" },
      ]),
    ),
  );
  const [single, setSingle] = useState(String(initialStock));

  // Only named colours get stock lines (a colour just added has no name yet)
  const named = [...new Set(colours.map((c) => c.name.trim()).filter(Boolean))];
  const stockColours: (string | null)[] = perColourStock && named.length ? named : [null];
  const stockSizes = sizes.length ? sizes : [""];
  const combos = useMemo(
    () => (tracksStock ? stockSizes.flatMap((s) => stockColours.map((c) => ({ size: s, colour: c }))) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- derived from sizes/colours/perColourStock
    [tracksStock, sizes, colours, perColourStock],
  );
  const usesVariants = tracksStock && (sizes.length > 0 || (perColourStock && named.length > 0));
  const line = (size: string, colour: string | null): Line => lines[key(size, colour)] ?? { size, colour, stock: "0", sku: "", price: "" };
  const setLine = (size: string, colour: string | null, patch: Partial<Line>) =>
    setLines((ls) => ({ ...ls, [key(size, colour)]: { ...line(size, colour), ...patch } }));

  const addSizes = (raw: string) => {
    const next = raw.split(",").map((s) => s.trim()).filter(Boolean);
    if (next.length) setSizes((cur) => [...new Set([...cur, ...next])].slice(0, 30));
    setSizeDraft("");
  };
  const total = usesVariants ? combos.reduce((s, c) => s + (Number(line(c.size, c.colour).stock) || 0), 0) : Number(single) || 0;

  const variantsJson = usesVariants
    ? combos.map((c) => {
        const l = line(c.size, c.colour);
        return { size: c.size, colour: c.colour, stock_qty: Math.max(0, Number(l.stock) || 0), sku: l.sku.trim() || null, price: l.price.trim() ? Number(l.price) : null };
      })
    : [];
  const coloursJson = colours.filter((c) => c.name.trim()).map((c) => ({ name: c.name.trim(), hex: c.hex, hex2: null, image_index: c.image_index }));

  const generateSkus = () =>
    setLines((ls) => {
      const next = { ...ls };
      const base = productCode.replace(/\s+/g, "") || "SKU";
      for (const c of combos) {
        const k = key(c.size, c.colour);
        const cur = next[k] ?? { size: c.size, colour: c.colour, stock: "0", sku: "", price: "" };
        if (!cur.sku) next[k] = { ...cur, sku: [base, c.size, c.colour ? abbrev(c.colour) : ""].filter(Boolean).join("-") };
      }
      return next;
    });

  return (
    <div className="grid min-w-0 gap-6 [&>*]:min-w-0">
      <input type="hidden" name="sizes" value={sizes.join(", ")} />
      <input type="hidden" name="colours_json" value={JSON.stringify(coloursJson)} />
      <input type="hidden" name="variants_json" value={JSON.stringify(variantsJson)} />
      {!usesVariants && tracksStock && <input type="hidden" name="stock_qty" value={single} />}

      {/* Sizes */}
      {sizesAllowed && (
        <div>
          <p className="mb-1.5 text-[13px] font-medium">Sizes</p>
          <div className="flex flex-wrap items-center gap-2">
            {sizes.map((s) => (
              <span key={s} className="inline-flex items-center gap-1 rounded-full border border-sand bg-cream/50 py-1 pr-1 pl-3 text-sm">
                {s}
                <button type="button" onClick={() => setSizes((cur) => cur.filter((x) => x !== s))} aria-label={`Remove size ${s}`} className="rounded-full p-1 text-muted hover:bg-white hover:text-sale">
                  <X size={12} strokeWidth={1.5} />
                </button>
              </span>
            ))}
            <input
              value={sizeDraft}
              onChange={(e) => setSizeDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault();
                  addSizes(sizeDraft);
                }
              }}
              onBlur={() => sizeDraft && addSizes(sizeDraft)}
              placeholder={sizes.length ? "Add size…" : "Type a size and press Enter"}
              aria-label="Add a size"
              className="!w-44 !py-1.5 text-sm"
            />
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5 text-xs text-muted">
            Quick add:
            {COMMON_SIZES.filter((s) => !sizes.includes(s)).map((s) => (
              <button key={s} type="button" onClick={() => addSizes(s)} className="rounded-full border border-sand px-2 py-0.5 hover:border-maroon hover:text-maroon">
                + {s}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-xs text-muted">
            {type === "custom_made" ? "Sizes customers can pick. Leave empty for the default list (XS–3XL, or ages for kids)." : "Leave empty for one-size items like sarees and linen."}
          </p>
        </div>
      )}

      {/* Colours */}
      <div>
        <div className="mb-1.5 flex items-center justify-between gap-3">
          <p className="text-[13px] font-medium">Colours</p>
          <button
            type="button"
            onClick={() => setColours((cs) => [...cs, { name: "", hex: "#b07a5c", image_index: null }])}
            className="inline-flex items-center gap-1 text-xs tracking-[0.12em] text-maroon uppercase hover:underline"
          >
            <Plus size={13} strokeWidth={1.5} aria-hidden /> Add colour
          </button>
        </div>
        {colours.length === 0 ? (
          <p className="text-xs text-muted">No colour choice. Add colours if customers pick one (each can show its own photo).</p>
        ) : (
          <ul className="grid gap-2">
            {colours.map((c, i) => (
              <li key={i} className="flex flex-wrap items-center gap-2 rounded-[var(--radius-control)] border border-sand bg-cream/30 p-2">
                <label className="relative h-9 w-9 shrink-0 cursor-pointer overflow-hidden rounded-full border border-sand-strong" style={{ background: c.hex }} title="Pick the swatch colour">
                  <input type="color" value={c.hex} onChange={(e) => setColours((cs) => cs.map((x, j) => (j === i ? { ...x, hex: e.target.value } : x)))} className="absolute inset-0 cursor-pointer opacity-0" aria-label={`Swatch colour for ${c.name || "new colour"}`} />
                </label>
                <input
                  value={c.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    const old = c.name.trim();
                    setColours((cs) => cs.map((x, j) => (j === i ? { ...x, name } : x)));
                    // keep this colour's stock lines when it is renamed
                    if (old) setLines((ls) => Object.fromEntries(Object.entries(ls).map(([k, l]) => (l.colour === old ? [key(l.size, name.trim()), { ...l, colour: name.trim() }] : [k, l]))));
                  }}
                  placeholder="Colour name, e.g. Bottle Green"
                  aria-label="Colour name"
                  className="!w-auto min-w-[10rem] flex-1 !py-1.5 text-sm"
                />
                {images.length > 0 && (
                  <Select
                    size="sm"
                    className="w-32"
                    label={`Photo shown for ${c.name || "this colour"}`}
                    value={c.image_index == null ? "" : String(c.image_index)}
                    onChange={(v) => setColours((cs) => cs.map((x, j) => (j === i ? { ...x, image_index: v === "" ? null : Number(v) } : x)))}
                    options={[{ value: "", label: "No photo" }, ...images.map((_, n) => ({ value: String(n), label: `Photo ${n + 1}` }))]}
                  />
                )}
                {c.image_index != null && images[c.image_index] && (
                  <img src={images[c.image_index].thumb_url ?? images[c.image_index].url} alt="" className="h-9 w-7 rounded-[3px] object-cover" />
                )}
                <button type="button" onClick={() => setColours((cs) => cs.filter((_, j) => j !== i))} aria-label={`Remove colour ${c.name}`} className="rounded-full p-1.5 text-muted hover:bg-white hover:text-sale">
                  <X size={15} strokeWidth={1.5} />
                </button>
              </li>
            ))}
          </ul>
        )}
        {tracksStock && colours.length > 0 && (
          <label className="mt-3 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={perColourStock}
              onChange={(e) => {
                const on = e.target.checked;
                // Don't lose stock figures: on → each size's stock moves to the first colour; off → colours add up per size
                setLines((ls) => {
                  const next = { ...ls };
                  for (const size of stockSizes) {
                    if (on && named.length) {
                      const plain = ls[key(size, null)];
                      if (plain && !ls[key(size, named[0])]) next[key(size, named[0])] = { ...plain, colour: named[0] };
                    } else if (!on) {
                      const parts = named.map((c) => ls[key(size, c)]).filter((l): l is Line => !!l);
                      if (parts.length) next[key(size, null)] = { ...parts[0], colour: null, stock: String(parts.reduce((s, l) => s + (Number(l.stock) || 0), 0)) };
                    }
                  }
                  return next;
                });
                setPerColourStock(on);
              }}
            />
            Keep stock separately for each colour
          </label>
        )}
      </div>

      {/* Stock */}
      {tracksStock && (
        <div>
          <div className="mb-2 flex flex-wrap items-end justify-between gap-3">
            <p className="text-[13px] font-medium">
              Stock <span className="font-normal text-muted">· total {Math.round(total * 10) / 10} {unit}</span>
            </p>
            {usesVariants && (
              <button type="button" onClick={generateSkus} className="inline-flex items-center gap-1.5 text-xs tracking-[0.12em] text-maroon uppercase hover:underline">
                <Wand2 size={13} strokeWidth={1.5} aria-hidden /> Fill empty SKUs
              </button>
            )}
          </div>
          {usesVariants ? (
            <div className="overflow-x-auto rounded-[var(--radius-control)] border border-sand">
              <table className="w-full text-sm">
                <thead className="bg-cream/40 text-left text-[11px] tracking-[0.12em] text-muted uppercase">
                  <tr>
                    {sizes.length > 0 && <th className="px-3 py-2 font-medium">Size</th>}
                    {perColourStock && named.length > 0 && <th className="px-3 py-2 font-medium">Colour</th>}
                    <th className="px-3 py-2 font-medium">Stock ({unit})</th>
                    <th className="px-3 py-2 font-medium">SKU</th>
                    <th className="px-3 py-2 font-medium">Price (₹, optional)</th>
                  </tr>
                </thead>
                <tbody>
                  {combos.map((c) => {
                    const l = line(c.size, c.colour);
                    const label = [c.size, c.colour].filter(Boolean).join(" / ");
                    const hex = colours.find((x) => x.name.trim() === c.colour)?.hex;
                    return (
                      <tr key={key(c.size, c.colour)} className="border-t border-sand">
                        {sizes.length > 0 && <td className="px-3 py-2 font-medium whitespace-nowrap">{c.size}</td>}
                        {perColourStock && named.length > 0 && (
                          <td className="px-3 py-2 whitespace-nowrap">
                            <span className="inline-flex items-center gap-2">
                              <span aria-hidden className="h-3.5 w-3.5 rounded-full border border-sand-strong" style={{ background: hex }} />
                              {c.colour || <span className="text-muted">(unnamed)</span>}
                            </span>
                          </td>
                        )}
                        <td className="px-3 py-1.5">
                          <input type="number" min={0} step={unit === "m" ? 0.1 : 1} value={l.stock} onChange={(e) => setLine(c.size, c.colour, { stock: e.target.value })} aria-label={`Stock for ${label}`} className={`!w-24 !py-1.5 ${Number(l.stock) <= 0 ? "!text-sale" : ""}`} />
                        </td>
                        <td className="px-3 py-1.5">
                          <input value={l.sku} onChange={(e) => setLine(c.size, c.colour, { sku: e.target.value })} aria-label={`SKU for ${label}`} placeholder="—" className="!w-40 !py-1.5" />
                        </td>
                        <td className="px-3 py-1.5">
                          <input type="number" min={0} step="0.01" value={l.price} onChange={(e) => setLine(c.size, c.colour, { price: e.target.value })} aria-label={`Price for ${label}`} placeholder="Same as product" className="!w-36 !py-1.5" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <label className="flex items-center gap-3">
              <span className="sr-only">Stock</span>
              <input type="number" min={0} step={unit === "m" ? 0.1 : 1} value={single} onChange={(e) => setSingle(e.target.value)} className="!w-36" aria-label={`Stock in ${unit === "m" ? "metres" : "pieces"}`} />
              <span className="text-sm text-muted">{unit === "m" ? "metres in stock" : "pieces in stock"}</span>
            </label>
          )}
        </div>
      )}
    </div>
  );
}
