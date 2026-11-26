"use client";
import { useActionState } from "react";
import { markDispatched, updateOrderStatus } from "../orders/actions";
import { useActionToast } from "@/components/admin/Toaster";

/** Consignment number + "Dispatch" for one order (emails the customer). */
export function DispatchRowForm({ id, orderNumber }: { id: string; orderNumber: string }) {
  const [state, action, pending] = useActionState(markDispatched, undefined);
  useActionToast(state);
  return (
    <form action={action} className="flex items-center justify-end gap-2">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="carrier" value="India Post" />
      <label htmlFor={`cn-${id}`} className="sr-only">India Post consignment number for {orderNumber}</label>
      <input
        id={`cn-${id}`}
        name="consignment_number"
        required
        minLength={6}
        maxLength={40}
        placeholder="Consignment no."
        autoComplete="off"
        className="!h-9 !w-40 !py-0 font-mono text-[13px] uppercase"
      />
      <button type="submit" className="btn-primary btn-sm !h-9 !py-0" disabled={pending}>
        {pending ? "…" : "Dispatch"}
      </button>
    </form>
  );
}

/** Paid → Being prepared (packed and waiting for the post office). */
export function MarkPackedButton({ id }: { id: string }) {
  const [state, action, pending] = useActionState(updateOrderStatus, undefined);
  useActionToast(state);
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value="processing" />
      <button type="submit" className="btn-outline btn-sm !h-9 !py-0 whitespace-nowrap" disabled={pending}>
        {pending ? "…" : "Mark packed"}
      </button>
    </form>
  );
}
