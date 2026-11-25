"use client";
import { useActionState } from "react";
import { markDispatched } from "./actions";
import { Field } from "@/components/admin/ui";
import { useActionToast } from "@/components/admin/Toaster";

export function DispatchForm({ orderId, international, current }: { orderId: string; international: boolean; current?: string | null }) {
  const [state, action, pending] = useActionState(markDispatched, undefined);
  useActionToast(state);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="id" value={orderId} />
      <Field label="Carrier" htmlFor="carrier">
        <input id="carrier" name="carrier" defaultValue={international ? "" : "India Post"} required />
      </Field>
      <Field label="Consignment number" htmlFor="consignment_number" hint={current ? "Saving a new number replaces the old one." : undefined}>
        <input id="consignment_number" name="consignment_number" defaultValue={current ?? ""} required aria-describedby={current ? "consignment_number-hint" : undefined} />
      </Field>
      <button type="submit" disabled={pending} className="btn-primary btn-sm w-full">
        {pending ? "Saving…" : current ? "Update & email customer" : "Mark dispatched & email customer"}
      </button>
    </form>
  );
}
