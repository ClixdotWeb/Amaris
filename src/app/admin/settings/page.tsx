import { getSettings } from "@/lib/data/settings";
import { saveSettings } from "./actions";

const rupees = (p: number | null) => (p == null ? "" : String(p / 100));

export default async function AdminSettingsPage() {
  const s = await getSettings();
  const rates = Object.entries(s.international_rates)
    .map(([k, v]) => `${k}=${v / 100}`)
    .join(", ");

  return (
    <section>
      <h1>Shop settings</h1>
      <form action={saveSettings}>
        <fieldset>
          <legend>Stitching</legend>
          <label>
            Default stitching charge (₹)
            <input name="default_stitching_charge" type="number" step="0.01" min={0} defaultValue={rupees(s.default_stitching_charge)} />
          </label>
          <p>A product can override this on its own edit page.</p>
        </fieldset>

        <fieldset>
          <legend>Domestic shipping (India Post)</legend>
          <label>
            Shipping fee (₹)
            <input name="domestic_shipping_fee" type="number" step="0.01" min={0} defaultValue={rupees(s.domestic_shipping_fee)} />
          </label>
          <label>
            Free shipping on orders above (₹, leave empty for never)
            <input name="free_shipping_above" type="number" step="0.01" min={0} defaultValue={rupees(s.free_shipping_above)} />
          </label>
        </fieldset>

        <fieldset>
          <legend>International shipping</legend>
          <label>
            Flat rate per country, in ₹ (format: US=2500, AE=1800, GB=3000). Countries not listed cannot check out.
            <textarea name="international_rates" defaultValue={rates} />
          </label>
        </fieldset>

        <fieldset>
          <legend>Payments</legend>
          <label>
            <input type="checkbox" name="cod_enabled" defaultChecked={s.cod_enabled} disabled />
            Cash on delivery (not built yet, waiting for the client&apos;s decision)
          </label>
        </fieldset>

        <button type="submit">Save settings</button>
      </form>
    </section>
  );
}
