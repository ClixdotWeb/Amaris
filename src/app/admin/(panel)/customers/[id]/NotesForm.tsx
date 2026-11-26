"use client";
import { useActionState } from "react";
import { saveCustomerNotes } from "../actions";
import { useActionToast } from "@/components/admin/Toaster";

export function NotesForm({ id, notes }: { id: string; notes: string | null }) {
  const [state, action, pending] = useActionState(saveCustomerNotes, undefined);
  useActionToast(state);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="id" value={id} />
      <label htmlFor="cust-notes" className="sr-only">Private notes</label>
      <textarea id="cust-notes" name="notes" rows={4} maxLength={1000} defaultValue={notes ?? ""} placeholder="Only the shop sees these, e.g. preferred fit, past alterations." />
      <div className="flex justify-end">
        <button type="submit" className="btn-primary btn-sm" disabled={pending}>
          {pending ? "Saving…" : "Save notes"}
        </button>
      </div>
    </form>
  );
}
