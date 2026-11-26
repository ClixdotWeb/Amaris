import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { ShopSettings } from "@/types";
import { USE_DASHBOARD_STORE, USE_MOCK } from "./mode";
import { db } from "@/lib/db";
import { mockSettings } from "./mock";

const DEFAULTS: ShopSettings = {
  default_stitching_charge: 0,
  stitching_charge_by_category: {},
  shipping_kerala_per_item: 6000, // ₹60
  shipping_india_per_item: 9000, // ₹90
  free_shipping_above: null,
  international_rates: {},
  cod_enabled: false,
};

export async function getSettings(): Promise<ShopSettings> {
  if (USE_DASHBOARD_STORE) return { ...DEFAULTS, ...(await db.settings.get()) };
  if (USE_MOCK) return mockSettings;
  const supabase = await createClient();
  const { data } = await supabase.from("settings").select("data").eq("id", 1).maybeSingle();
  return { ...DEFAULTS, ...(data?.data ?? {}) };
}
