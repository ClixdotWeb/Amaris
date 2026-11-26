"use client";
import { useActionState } from "react";
import { setReviewStatus } from "./actions";
import { useActionToast } from "@/components/admin/Toaster";
import type { Review } from "@/types";

/** One-click Approve / Hide / Back to waiting. */
export function ReviewStatusButton({ id, to, label, primary = false }: { id: string; to: Review["status"]; label: string; primary?: boolean }) {
  const [state, action, pending] = useActionState(setReviewStatus, undefined);
  useActionToast(state);
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={to} />
      <button type="submit" className={`${primary ? "btn-primary" : "btn-outline"} btn-sm`} disabled={pending}>
        {pending ? "…" : label}
      </button>
    </form>
  );
}
