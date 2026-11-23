"use client";
import { useActionState } from "react";
import type { AuthState } from "./actions";

type Field = { name: string; label: string; type?: string; autoComplete?: string; required?: boolean };

/** Generic auth form. Pages pass the server action + fields. */
export function AuthForm({
  action,
  fields,
  submitLabel,
  next,
}: {
  action: (s: AuthState, f: FormData) => Promise<AuthState>;
  fields: Field[];
  submitLabel: string;
  next?: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  return (
    <form action={formAction} className="space-y-4">
      {next && <input type="hidden" name="next" value={next} />}
      {fields.map((f) => (
        <label key={f.name} className="block">
          <span className="mb-1.5 block text-xs text-muted">{f.label}</span>
          <input name={f.name} type={f.type ?? "text"} autoComplete={f.autoComplete} required={f.required ?? true} />
        </label>
      ))}
      {state?.error && <p role="alert" className="text-sm text-sale">{state.error}</p>}
      {state?.message && <p role="status" className="text-sm text-success">{state.message}</p>}
      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? "Please wait…" : submitLabel}
      </button>
    </form>
  );
}

/** Centered card wrapper for auth pages. */
export function AuthCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="container-x flex justify-center py-16 md:py-24">
      <div className="card w-full max-w-md p-8 md:p-10">
        <h1 className="text-center font-display text-4xl">{title}</h1>
        {subtitle && <p className="mt-2 text-center text-sm text-muted">{subtitle}</p>}
        <div className="mt-8">{children}</div>
      </div>
    </section>
  );
}
