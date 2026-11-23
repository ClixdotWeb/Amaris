import { Clock, Truck } from "lucide-react";
import { DISPATCH } from "@/config/shop";
import type { DispatchType } from "@/types";

/** "Dispatched within 48 hours" vs "Dispatched in 45–60 days". Shown on product, cart, checkout. */
export function DispatchNote({ type, compact = false }: { type: DispatchType; compact?: boolean }) {
  const Icon = type === "in_stock" ? Truck : Clock;
  return (
    <p
      data-dispatch={type}
      className={`flex items-center gap-2 ${compact ? "text-xs" : "text-sm"} ${type === "in_stock" ? "text-success" : "text-gold"}`}
    >
      <Icon size={compact ? 14 : 16} strokeWidth={1.75} />
      {DISPATCH[type].label}
    </p>
  );
}
