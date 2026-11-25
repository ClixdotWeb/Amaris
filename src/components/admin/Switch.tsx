"use client";
import { useOptimistic, useState, useTransition } from "react";
import { useToast } from "./Toaster";

/**
 * On/off switch in the site's colours (maroon when on). Keyboard: Tab to focus, Space/Enter to flip.
 * Accessible as role="switch" with aria-checked.
 */
export function Switch({
  checked,
  onChange,
  label,
  labelHidden = false,
  disabled = false,
  describedBy,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  /** Hide the text label visually (still read by screen readers). */
  labelHidden?: boolean;
  disabled?: boolean;
  describedBy?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-describedby={describedBy}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="group inline-flex items-center gap-3 text-sm"
    >
      <span
        aria-hidden
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors duration-200 ease-soft ${
          checked ? "border-maroon bg-maroon" : "border-sand-strong bg-white"
        }`}
      >
        <span
          className={`absolute left-0.5 h-[18px] w-[18px] rounded-full shadow-sm transition-transform duration-200 ease-soft ${
            checked ? "translate-x-5 bg-white" : "translate-x-0 bg-sand-strong"
          }`}
        />
      </span>
      <span className={labelHidden ? "sr-only" : ""}>{label}</span>
    </button>
  );
}

/** A Switch inside a normal form: sends name="on" when on (like a checkbox), nothing when off. */
export function FormSwitch({
  name,
  defaultChecked,
  label,
  hint,
}: {
  name: string;
  defaultChecked: boolean;
  label: string;
  hint?: string;
}) {
  const [on, setOn] = useState(defaultChecked);
  const hintId = hint ? `${name}-hint` : undefined;
  return (
    <div>
      {on && <input type="hidden" name={name} value="on" />}
      <Switch checked={on} onChange={setOn} label={label} describedBy={hintId} />
      {hint && (
        <p id={hintId} className="mt-1.5 text-xs text-muted">
          {hint}
        </p>
      )}
    </div>
  );
}

/**
 * A Switch that saves immediately through a server action (e.g. stitching on/off in the products list).
 * Flips at once, then rolls back and shows an error toast if saving fails.
 */
export function InstantSwitch({
  checked,
  label,
  save,
  onMessage,
  offMessage,
}: {
  checked: boolean;
  label: string;
  save: (next: boolean) => Promise<{ ok?: boolean | string; error?: string }>;
  onMessage: string;
  offMessage: string;
}) {
  const [optimistic, setOptimistic] = useOptimistic(checked);
  const [pending, start] = useTransition();
  const toast = useToast();
  return (
    <Switch
      checked={optimistic}
      label={label}
      labelHidden
      disabled={pending}
      onChange={(next) =>
        start(async () => {
          setOptimistic(next);
          const r = await save(next);
          if (r.error) toast(r.error, "error");
          else toast(next ? onMessage : offMessage);
        })
      }
    />
  );
}
