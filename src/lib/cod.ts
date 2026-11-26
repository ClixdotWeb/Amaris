import type { Order, ShopSettings } from "@/types";
import { formatINR } from "@/lib/format";

/** Can this order be paid by cash on delivery? (India only, switched on in Shop settings, within the limit) */
export function codAllowed(s: Pick<ShopSettings, "cod_enabled" | "cod_max_order" | "cod_fee">, order: Pick<Order, "is_international" | "total">): { ok: true } | { ok: false; reason: string } {
  if (!s.cod_enabled) return { ok: false, reason: "Cash on delivery isn't available." };
  if (order.is_international) return { ok: false, reason: "Cash on delivery is only for orders delivered in India." };
  const total = order.total + (s.cod_fee ?? 0);
  if (s.cod_max_order != null && total > s.cod_max_order) return { ok: false, reason: `Cash on delivery is for orders up to ${formatINR(s.cod_max_order)}.` };
  return { ok: true };
}
