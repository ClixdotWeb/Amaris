"use client";
import { useActionState } from "react";
import { markDispatched } from "./actions";

export function DispatchForm({ orderId, international, current }: { orderId: string; international: boolean; current?: string | null }) {
  const [state, action, pending] = useActionState(markDispatched, undefined);
  return (
    <form action={action}>
      <input type="hidden" name="id" value={orderId} />
      <label>
        Carrier
        <input name="carrier" defaultValue={international ? "" : "India Post"} required />
      </label>
      <label>
        Consignment number
        <input name="consignment_number" defaultValue={current ?? ""} required />
      </label>
      {state?.error && <p role="alert">{state.error}</p>}
      {state?.ok && <p role="status">Marked as dispatched. The customer has been emailed.</p>}
      <button type="submit" disabled={pending}>Mark dispatched & email customer</button>
    </form>
  );
}
