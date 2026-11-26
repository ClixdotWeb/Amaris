"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/guard";
import { diffFields, logActivity } from "@/lib/admin/activity";
import { db } from "@/lib/db";
import { rupeesToPaise } from "@/lib/format";
import type { ShopSettings } from "@/types";

export type SettingsState = { ok?: string; error?: string } | undefined;

/** Parses "US=2500, AE=1800" (₹) into { US: 250000, AE: 180000 } (paise). Returns null if a part is invalid. */
function parseRates(s: string): Record<string, number> | null {
  const parts = s.split(/[,\n]/).map((p) => p.trim()).filter(Boolean);
  const out: Record<string, number> = {};
  for (const p of parts) {
    const m = p.match(/^([A-Za-z]{2})\s*=\s*(\d+(?:\.\d{1,2})?)$/);
    if (!m) return null;
    out[m[1].toUpperCase()] = rupeesToPaise(Number(m[2]));
  }
  return out;
}

const rupeesField = z.preprocess((v) => (v === "" || v == null ? 0 : Number(v)), z.number({ message: "Enter a number." }).nonnegative("Can't be negative.").max(1_000_000));

const schema = z.object({
  default_stitching_charge: rupeesField,
  shipping_kerala_per_item: rupeesField,
  shipping_india_per_item: rupeesField,
  free_shipping_above: z.preprocess((v) => (v === "" || v == null ? null : Number(v)), z.number().nonnegative().max(10_000_000).nullable()),
  international_rates: z.string().max(2000).optional(),
  cod_enabled: z.string().optional(),
  cod_fee: rupeesField,
  cod_max_order: z.preprocess((v) => (v === "" || v == null ? null : Number(v)), z.number().positive().max(10_000_000).nullable()),
});

const LABELS: Record<string, string> = {
  default_stitching_charge: "Stitching charge",
  shipping_kerala_per_item: "Kerala shipping",
  shipping_india_per_item: "Rest of India shipping",
  free_shipping_above: "Free shipping above",
  international_rates: "International rates",
  cod_enabled: "Cash on delivery",
  cod_fee: "COD charge",
  cod_max_order: "COD order limit",
};

export async function saveSettings(_: SettingsState, form: FormData): Promise<SettingsState> {
  const me = await requireAdmin("/admin/settings");
  const parsed = schema.safeParse(Object.fromEntries(form));
  if (!parsed.success) {
    const i = parsed.error.issues[0];
    return { error: `${LABELS[String(i.path[0])] ?? "A field"}: ${i.message}` };
  }
  const v = parsed.data;
  const rates = parseRates(v.international_rates ?? "");
  if (!rates) return { error: "International rates: use the format US=2500, AE=1800." };

  const current = await db.settings.get();
  const data: ShopSettings = {
    ...current,
    default_stitching_charge: rupeesToPaise(v.default_stitching_charge),
    shipping_kerala_per_item: rupeesToPaise(v.shipping_kerala_per_item),
    shipping_india_per_item: rupeesToPaise(v.shipping_india_per_item),
    free_shipping_above: v.free_shipping_above != null ? rupeesToPaise(v.free_shipping_above) : null,
    international_rates: rates,
    cod_enabled: v.cod_enabled === "on",
    cod_fee: rupeesToPaise(v.cod_fee),
    cod_max_order: v.cod_max_order != null ? rupeesToPaise(v.cod_max_order) : null,
  };
  await db.settings.save(data);
  const diff = diffFields(current, data, ["default_stitching_charge", "shipping_kerala_per_item", "shipping_india_per_item", "free_shipping_above", "international_rates", "cod_enabled", "cod_fee", "cod_max_order"]);
  if (Object.keys(diff).length)
    await logActivity(me, { action: "settings.update", entity_type: "settings", summary: `Changed ${Object.keys(diff).map((k) => LABELS[k]).join(", ")}`, diff });
  revalidatePath("/admin/settings");
  return { ok: Object.keys(diff).length ? "Settings saved." : "No changes to save." };
}
