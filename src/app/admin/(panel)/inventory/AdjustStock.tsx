"use client";
import { useActionState, useEffect, useRef } from "react";
import { adjustStock } from "./actions";
import { Select } from "@/components/admin/Select";
import { useActionToast } from "@/components/admin/Toaster";

/** Inline stock change for one row: Add / Remove / Set to, an amount and a reason. */
export function AdjustStock({ productId, variantId, unit, label }: { productId: string; variantId: string | null; unit: "pcs" | "m"; label: string }) {
  const [state, action, pending] = useActionState(adjustStock, undefined);
  useActionToast(state);
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    // Clear the amount after a successful change (the other choices stay as they were)
    const input = form.current?.querySelector<HTMLInputElement>("input[name=amount]");
    if (state?.ok && input) input.value = "";
  }, [state]);
  return (
    <form ref={form} action={action} className="flex flex-wrap items-center justify-end gap-2" aria-label={`Change stock of ${label}`}>
      <input type="hidden" name="productId" value={productId} />
      {variantId && <input type="hidden" name="variantId" value={variantId} />}
      <div className="w-[6.5rem]">
        <Select name="mode" label="Change" size="sm" defaultValue="add" options={[{ value: "add", label: "Add" }, { value: "remove", label: "Remove" }, { value: "set", label: "Set to" }]} />
      </div>
      <input
        name="amount"
        type="number"
        min={0}
        step={unit === "m" ? 0.1 : 1}
        inputMode="decimal"
        required
        aria-label={unit === "m" ? "Metres" : "Pieces"}
        placeholder={unit === "m" ? "m" : "pcs"}
        className="!h-9 !w-20 !py-0 text-sm"
      />
      <div className="w-[7.5rem]">
        <Select
          name="reason"
          label="Reason"
          size="sm"
          defaultValue="restock"
          options={[
            { value: "restock", label: "New stock" },
            { value: "correction", label: "Correction" },
            { value: "returned", label: "Returned" },
            { value: "damaged", label: "Damaged" },
          ]}
        />
      </div>
      <button type="submit" className="btn-primary btn-sm !h-9 !py-0" disabled={pending}>
        {pending ? "…" : "Update"}
      </button>
    </form>
  );
}
