"use client";
import { useOptimistic, useState, useTransition } from "react";
import { Select } from "@/components/admin/Select";
import { useToast } from "@/components/admin/Toaster";
import { saveProductionNote, setProductionStatus } from "./actions";
import { PRODUCTION_LABELS } from "./labels";
import type { ProductionStatus } from "@/types";

/** Workshop step for one item; saves as soon as it changes. */
export function ProductionStep({ itemId, status, name }: { itemId: string; status: ProductionStatus; name: string }) {
  const [value, setValue] = useOptimistic(status);
  const [pending, start] = useTransition();
  const toast = useToast();
  return (
    <div className="w-32" aria-busy={pending}>
      <Select
        label={`Step for ${name}`}
        size="sm"
        value={value}
        disabled={pending}
        options={Object.entries(PRODUCTION_LABELS).map(([v, label]) => ({ value: v, label }))}
        onChange={(v) =>
          start(async () => {
            setValue(v as ProductionStatus);
            const r = await setProductionStatus(itemId, v as ProductionStatus);
            if (r.error) toast(r.error, "error");
            else toast(`${name}: ${PRODUCTION_LABELS[v as ProductionStatus]}`);
          })
        }
      />
    </div>
  );
}

/** Short workshop note, saved when the field loses focus. */
export function ProductionNote({ itemId, note }: { itemId: string; note: string | null }) {
  const [saved, setSaved] = useState(note ?? "");
  const toast = useToast();
  return (
    <input
      defaultValue={note ?? ""}
      maxLength={300}
      placeholder="Add a note"
      aria-label="Workshop note"
      className="!h-9 !w-40 !py-0 text-[13px]"
      onBlur={async (e) => {
        const v = e.currentTarget.value.trim();
        if (v === saved) return;
        const r = await saveProductionNote(itemId, v);
        if (r.error) toast(r.error, "error");
        else {
          setSaved(v);
          toast("Note saved.");
        }
      }}
    />
  );
}
