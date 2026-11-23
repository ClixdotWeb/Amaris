"use client";
import { useActionState, useState } from "react";
import { saveProduct } from "./actions";
import type { Category, ProductWithRelations } from "@/types";

const rupees = (paise: number | null | undefined) => (paise == null ? "" : String(paise / 100));

/** Add / edit product. Fields shown depend on the category's product type. */
export function ProductForm({ categories, product }: { categories: Category[]; product?: ProductWithRelations }) {
  const [state, action, pending] = useActionState(saveProduct, undefined);
  const [categoryId, setCategoryId] = useState(product?.category_id ?? categories[0]?.id ?? "");
  const [sizes, setSizes] = useState(product?.sizes.join(", ") ?? "");
  const type = categories.find((c) => c.id === categoryId)?.product_type;
  const sizeList = sizes.split(",").map((s) => s.trim()).filter(Boolean);
  const stockFor = (s: string) => product?.variants.find((v) => v.size === s)?.stock_qty ?? 0;

  return (
    <form action={action}>
      {product && <input type="hidden" name="id" value={product.id} />}

      <fieldset>
        <legend>Basics</legend>
        <label>Name <input name="name" required defaultValue={product?.name} /></label>
        <label>URL slug (optional) <input name="slug" defaultValue={product?.slug} /></label>
        <label>
          Category
          <select name="category_id" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </label>
        <label>Description <textarea name="description" rows={5} defaultValue={product?.description ?? ""} /></label>
        <label>Fabric <input name="fabric" defaultValue={product?.fabric ?? ""} /></label>
        <label>Wash & care <textarea name="care_instructions" defaultValue={product?.care_instructions ?? ""} /></label>
      </fieldset>

      <fieldset>
        <legend>Price</legend>
        <label>
          Price (₹){type === "running_material" && " per metre"}
          <input name="price" type="number" step="0.01" min={0} required defaultValue={rupees(product?.price)} />
        </label>
        <label>
          Original price (₹, optional, shown struck through)
          <input name="compare_at_price" type="number" step="0.01" min={0} defaultValue={rupees(product?.compare_at_price)} />
        </label>
      </fieldset>

      {type === "ready_made" && (
        <fieldset>
          <legend>Sizes & stock</legend>
          <label>
            Sizes (comma separated, leave empty for one-size items like sarees)
            <input name="sizes" value={sizes} onChange={(e) => setSizes(e.target.value)} placeholder="S, M, L, XL" />
          </label>
          {sizeList.map((s) => (
            <label key={s}>
              Stock for {s}
              <input name={`variant_stock[${s}]`} type="number" min={0} defaultValue={stockFor(s)} />
            </label>
          ))}
          {sizeList.length === 0 && (
            <label>Stock <input name="stock_qty" type="number" min={0} defaultValue={product?.stock_qty ?? 0} /></label>
          )}
        </fieldset>
      )}

      {type === "unstitched" && (
        <fieldset>
          <legend>Stock & stitching</legend>
          <label>Stock <input name="stock_qty" type="number" min={0} defaultValue={product?.stock_qty ?? 0} /></label>
          <label>
            <input type="checkbox" name="stitching_available" defaultChecked={product?.stitching_available ?? true} />
            Offer stitching add-on
          </label>
          <label>
            Stitching charge for this product (₹, leave empty to use the default from Settings)
            <input name="stitching_charge" type="number" step="0.01" min={0} defaultValue={rupees(product?.stitching_charge)} />
          </label>
        </fieldset>
      )}

      {type === "custom_made" && (
        <fieldset>
          <legend>Sizes</legend>
          <p>Custom-made items are always made to order (45–60 days). Customers choose a standard size or enter measurements.</p>
          <label>
            Standard sizes offered (comma separated, leave empty for the default list)
            <input name="sizes" value={sizes} onChange={(e) => setSizes(e.target.value)} />
          </label>
        </fieldset>
      )}

      {type === "running_material" && (
        <fieldset>
          <legend>Metres</legend>
          <label>Stock (metres) <input name="stock_qty" type="number" step="0.1" min={0} defaultValue={product?.stock_qty ?? 0} /></label>
          <label>Minimum order (m) <input name="min_metres" type="number" step="0.1" min={0} defaultValue={product?.min_metres ?? 1} /></label>
          <label>Step (m) <input name="metre_step" type="number" step="0.1" min={0} defaultValue={product?.metre_step ?? 0.5} /></label>
        </fieldset>
      )}

      <fieldset>
        <legend>Visibility</legend>
        <label><input type="checkbox" name="is_active" defaultChecked={product?.is_active ?? true} /> Live on the website</label>
        <label><input type="checkbox" name="is_new_arrival" defaultChecked={product?.is_new_arrival} /> New Arrival</label>
        <label><input type="checkbox" name="is_hot_deal" defaultChecked={product?.is_hot_deal} /> Hot Deal</label>
        <label><input type="checkbox" name="is_preorder" defaultChecked={product?.is_preorder} /> Pre-order (dispatch in 45–60 days)</label>
      </fieldset>

      <fieldset>
        <legend>Add images</legend>
        <input type="file" name="images" accept="image/*" multiple />
      </fieldset>

      {state?.error && <p role="alert">{state.error}</p>}
      <button type="submit" disabled={pending}>{pending ? "Saving…" : "Save product"}</button>
    </form>
  );
}
