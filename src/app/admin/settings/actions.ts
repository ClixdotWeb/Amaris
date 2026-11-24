"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { rupeesToPaise } from "@/lib/format";
import { getSettings } from "@/lib/data/settings";
import type { ShopSettings } from "@/types";

/** Parses "US=2500, AE=1800" (₹) into { US: 250000, AE: 180000 } (paise). */
function parseRates(s: string): Record<string, number> {
  return Object.fromEntries(
    s
      .split(/[,\n]/)
      .map((p) => p.split("=").map((x) => x.trim()))
      .filter(([k, v]) => /^[A-Za-z]{2}$/.test(k ?? "") && !isNaN(Number(v)))
      .map(([k, v]) => [k.toUpperCase(), rupeesToPaise(Number(v))]),
  );
}

export async function saveSettings(form: FormData) {
  await requireAdmin();
  const current = await getSettings();
  const free = String(form.get("free_shipping_above") ?? "");
  const data: ShopSettings = {
    default_stitching_charge: rupeesToPaise(Number(form.get("default_stitching_charge") || 0)),
    // TODO: add a per-category UI if the client wants different charges per category
    stitching_charge_by_category: current.stitching_charge_by_category,
    shipping_kerala_per_item: rupeesToPaise(Number(form.get("shipping_kerala_per_item") || 0)),
    shipping_india_per_item: rupeesToPaise(Number(form.get("shipping_india_per_item") || 0)),
    free_shipping_above: free ? rupeesToPaise(Number(free)) : null,
    international_rates: parseRates(String(form.get("international_rates") ?? "")),
    cod_enabled: form.get("cod_enabled") === "on",
  };
  const supabase = await createClient();
  await supabase.from("settings").update({ data }).eq("id", 1);
  revalidatePath("/", "layout");
}
