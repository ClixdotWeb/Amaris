import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { ShopSettings } from "@/types";
import { USE_MOCK } from "./mode";
import { mockSettings } from "./mock";

const DEFAULTS: ShopSettings = {
  default_stitching_charge: 0,
  stitching_charge_by_category: {},
  domestic_shipping_fee: 0,
  free_shipping_above: null,
  international_rates: {},
  cod_enabled: false,
};

export async function getSettings(): Promise<ShopSettings> {
  if (USE_MOCK) return mockSettings;
  const supabase = await createClient();
  const { data } = await supabase.from("settings").select("data").eq("id", 1).maybeSingle();
  return { ...DEFAULTS, ...(data?.data ?? {}) };
}
