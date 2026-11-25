"use client";
import { useActionState, useEffect, useRef } from "react";
import { Trash2 } from "lucide-react";
import { useActionToast } from "./Toaster";

export type ActionResult = { ok?: boolean | string; error?: string } | undefined;

/**
 * A button that asks "Are you sure?" in a dialog, then runs a server action with the given hidden fields.
 * Used for destructive or important actions (remove admin, hide product…). Result is shown as a toast.
 */
export function ConfirmButton({
  action,
  fields,
  label,
  title,
  message,
  confirmLabel,
  tone = "danger",
  size = "sm",
  trigger = "button",
}: {
  action: (state: ActionResult, form: FormData) => Promise<ActionResult>;
  fields: Record<string, string>;
  label: string;
  title: string;
  message: React.ReactNode;
  confirmLabel: string;
  tone?: "danger" | "primary";
  size?: "sm" | "md";
  /** "icon": a small round trash button (e.g. on a photo); the label becomes its accessible name. */
  trigger?: "button" | "icon";
}) {
  const [state, run, pending] = useActionState(action, undefined);
  const dialog = useRef<HTMLDialogElement>(null);
  useActionToast(state);
  useEffect(() => {
    if (state) dialog.current?.close();
  }, [state]);

  const btn = tone === "danger" ? "btn-danger" : "btn-primary";
  return (
    <>
      {trigger === "icon" ? (
        <button
          type="button"
          aria-label={label}
          title={label}
          onClick={() => dialog.current?.showModal()}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-ink shadow-sm transition-colors hover:bg-sale hover:text-white"
        >
          <Trash2 size={15} strokeWidth={1.5} aria-hidden />
        </button>
      ) : (
        <button type="button" className={`btn-outline ${size === "sm" ? "btn-sm" : ""}`} onClick={() => dialog.current?.showModal()}>
          {label}
        </button>
      )}
      <dialog
        ref={dialog}
        aria-labelledby={`${fields.id ?? label}-title`}
        className="m-auto w-[min(92vw,28rem)] rounded-card border border-sand bg-ivory p-0 text-ink shadow-pop backdrop:bg-ink/40"
        onClick={(e) => e.target === dialog.current && dialog.current?.close()}
      >
        <form action={run} className="p-6">
          {Object.entries(fields).map(([k, v]) => (
            <input key={k} type="hidden" name={k} value={v} />
          ))}
          <h2 id={`${fields.id ?? label}-title`} className="font-display text-2xl">{title}</h2>
          <div className="mt-2 text-sm text-muted">{message}</div>
          <div className="mt-6 flex justify-end gap-2">
            <button type="button" className="btn-outline btn-sm" onClick={() => dialog.current?.close()}>
              Cancel
            </button>
            <button type="submit" className={`${btn} btn-sm`} disabled={pending}>
              {pending ? "Working…" : confirmLabel}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
