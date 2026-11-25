"use client";
import { useActionState } from "react";
import { saveSettings } from "./actions";
import { Field, FormSection } from "@/components/admin/ui";
import { useActionToast } from "@/components/admin/Toaster";
import type { ShopSettings } from "@/types";

const rupees = (p: number | null) => (p == null ? "" : String(p / 100));

export function SettingsForm({ settings: s }: { settings: ShopSettings }) {
  const [state, action, pending] = useActionState(saveSettings, undefined);
  useActionToast(state);
  const rates = Object.entries(s.international_rates)
    .map(([k, v]) => `${k}=${v / 100}`)
    .join(", ");
  const money = { type: "number", step: "0.01", min: 0, inputMode: "decimal" as const };

  return (
    <form action={action} className="space-y-6">
      <div className="max-w-4xl space-y-6">
      <FormSection title="Stitching" description="Charged when a customer asks for an unstitched suit to be stitched.">
        <Field label="Default stitching charge (₹)" htmlFor="default_stitching_charge" hint="A product can override this on its own edit page.">
          <input id="default_stitching_charge" name="default_stitching_charge" {...money} defaultValue={rupees(s.default_stitching_charge)} aria-describedby="default_stitching_charge-hint" className="max-w-xs" />
        </Field>
      </FormSection>

      <FormSection title="Domestic shipping" description="India Post. The charge is per item and multiplied by the number of items.">
        <div className="grid gap-5 md:grid-cols-3">
          <Field label="Within Kerala (₹ per item)" htmlFor="shipping_kerala_per_item" hint="PIN codes 670000–695999.">
            <input id="shipping_kerala_per_item" name="shipping_kerala_per_item" {...money} defaultValue={rupees(s.shipping_kerala_per_item)} aria-describedby="shipping_kerala_per_item-hint" />
          </Field>
          <Field label="Rest of India (₹ per item)" htmlFor="shipping_india_per_item">
            <input id="shipping_india_per_item" name="shipping_india_per_item" {...money} defaultValue={rupees(s.shipping_india_per_item)} />
          </Field>
          <Field label="Free shipping above (₹)" htmlFor="free_shipping_above" hint="Leave empty for never.">
            <input id="free_shipping_above" name="free_shipping_above" {...money} defaultValue={rupees(s.free_shipping_above)} aria-describedby="free_shipping_above-hint" />
          </Field>
        </div>
      </FormSection>

      <FormSection title="International shipping" description="One flat rate per country. Countries not listed can't check out.">
        <Field label="Rates (₹)" htmlFor="international_rates" hint="Format: US=2500, AE=1800, GB=3000">
          <textarea id="international_rates" name="international_rates" rows={3} defaultValue={rates} aria-describedby="international_rates-hint" />
        </Field>
      </FormSection>

      <FormSection title="Payments">
        <p className="text-sm text-muted">Cash on delivery is added in the Coupons &amp; COD phase.</p>
      </FormSection>
      </div>

      <div className="sticky bottom-0 z-10 -mx-4 flex justify-end border-t border-sand bg-ivory/95 px-4 py-3 backdrop-blur md:-mx-8 md:px-8">
        <button type="submit" className="btn-primary btn-sm" disabled={pending}>
          {pending ? "Saving…" : "Save settings"}
        </button>
      </div>
    </form>
  );
}
