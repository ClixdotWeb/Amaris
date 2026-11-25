"use client";
import { useActionState, useEffect, useRef } from "react";
import { addAdmin } from "./actions";
import { Field } from "@/components/admin/ui";
import { useActionToast } from "@/components/admin/Toaster";
import { MIN_PASSWORD_HINT } from "./constants";

export function AddAdminForm() {
  const [state, action, pending] = useActionState(addAdmin, undefined);
  const form = useRef<HTMLFormElement>(null);
  useActionToast(state);
  useEffect(() => {
    if (state?.ok) form.current?.reset();
  }, [state]);
  const err = state?.fieldErrors ?? {};
  const describe = (id: string, hint?: boolean) => [hint && `${id}-hint`, err[id as keyof typeof err] && `${id}-error`].filter(Boolean).join(" ") || undefined;

  return (
    <form ref={form} action={action} className="grid gap-4 md:grid-cols-3" noValidate>
      <Field label="Name" htmlFor="full_name" error={err.full_name}>
        <input id="full_name" name="full_name" autoComplete="off" required aria-invalid={!!err.full_name} aria-describedby={describe("full_name")} />
      </Field>
      <Field label="Email" htmlFor="email" error={err.email}>
        <input id="email" name="email" type="email" autoComplete="off" required aria-invalid={!!err.email} aria-describedby={describe("email")} />
      </Field>
      <Field label="Starting password" htmlFor="password" hint={MIN_PASSWORD_HINT} error={err.password}>
        <input id="password" name="password" type="password" autoComplete="new-password" required aria-invalid={!!err.password} aria-describedby={describe("password", true)} />
      </Field>
      <div className="md:col-span-3">
        <button type="submit" className="btn-primary btn-sm" disabled={pending}>
          {pending ? "Adding…" : "Add admin"}
        </button>
      </div>
    </form>
  );
}
