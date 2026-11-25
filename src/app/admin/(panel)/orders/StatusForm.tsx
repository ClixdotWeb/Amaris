"use client";
import { useActionState } from "react";
import { updateOrderStatus } from "./actions";
import { ORDER_STATUS_LABELS } from "@/components/account/OrderStatusLabel";
import { Field } from "@/components/admin/ui";
import { Select } from "@/components/admin/Select";
import { useActionToast } from "@/components/admin/Toaster";
import type { OrderStatus } from "@/types";

/** Status change (only the moves allowed from the current status) + internal notes. */
export function StatusForm({
  orderId,
  current,
  allowed,
  notes,
}: {
  orderId: string;
  current: OrderStatus;
  allowed: OrderStatus[];
  notes: string | null;
}) {
  const [state, action, pending] = useActionState(updateOrderStatus, undefined);
  useActionToast(state);
  const options = [current, ...allowed.filter((s) => s !== "dispatched")];
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="id" value={orderId} />
      <Field label="Status" htmlFor="status" hint={options.length === 1 ? "This order can't change status any more." : "Dispatch is set with the Dispatch form."}>
        <Select
          id="status"
          name="status"
          label="Status"
          defaultValue={current}
          describedBy="status-hint"
          options={options.map((s) => ({ value: s, label: `${ORDER_STATUS_LABELS[s]}${s === current ? " (current)" : ""}` }))}
        />
      </Field>
      <Field label="Internal notes (not shown to the customer)" htmlFor="admin_notes">
        <textarea id="admin_notes" name="admin_notes" rows={3} defaultValue={notes ?? ""} maxLength={2000} />
      </Field>
      <button type="submit" disabled={pending} className="btn-primary btn-sm w-full">{pending ? "Saving…" : "Save"}</button>
    </form>
  );
}
