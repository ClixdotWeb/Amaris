"use client";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";

export type SelectOption = { value: string; label: string; disabled?: boolean };
export type SelectGroup = { label?: string; options: SelectOption[] };

/**
 * Dropdown in the shop's style, replacing the browser's own list (which can't be styled):
 * rounded white panel with a soft shadow, roomy options, cream hover, burgundy + check for the selected one.
 * Keyboard: Enter/Space/↓ opens, ↑↓ Home End move, Enter picks, Esc closes, typing jumps to a match.
 * Works in plain forms too: pass `name` and the value is sent in a hidden input.
 */
export function Select({
  options,
  groups,
  value: controlled,
  defaultValue,
  onChange,
  name,
  label,
  id,
  placeholder,
  disabled,
  size = "md",
  className = "",
  describedBy,
}: {
  options?: SelectOption[];
  groups?: SelectGroup[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  name?: string;
  /** Accessible name (shown to screen readers; pair with a visible <label htmlFor={id}> when there is one). */
  label: string;
  id?: string;
  placeholder?: string;
  disabled?: boolean;
  size?: "sm" | "md";
  className?: string;
  describedBy?: string;
}) {
  const all: SelectGroup[] = groups ?? [{ options: options ?? [] }];
  const flat = all.flatMap((g) => g.options);
  const [inner, setInner] = useState(defaultValue ?? flat[0]?.value ?? "");
  const value = controlled ?? inner;
  const selected = flat.find((o) => o.value === value);

  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [pos, setPos] = useState<{ left: number; width: number; top?: number; bottom?: number } | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const typed = useRef({ text: "", at: 0 });
  const auto = useId();
  const buttonId = id ?? `${auto}-button`;
  const listId = `${auto}-list`;

  const choose = (v: string) => {
    if (controlled === undefined) setInner(v);
    onChange?.(v);
    setOpen(false);
    button.current?.focus();
  };

  const openList = () => {
    if (disabled) return;
    const i = flat.findIndex((o) => o.value === value);
    setActive(i >= 0 ? i : 0);
    setOpen(true);
  };

  // The list is drawn at the top level of the page (so no card or animation layer can clip it), placed under
  // the button, or above it when there isn't room below (e.g. the bulk bar at the bottom of the screen).
  useLayoutEffect(() => {
    if (!open || !root.current) return;
    const place = () => {
      const r = root.current!.getBoundingClientRect();
      const below = window.innerHeight - r.bottom;
      const up = below < 300 && r.top > below;
      setPos(up ? { left: r.left, width: r.width, bottom: window.innerHeight - r.top + 8 } : { left: r.left, width: r.width, top: r.bottom + 8 });
    };
    place();
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [open]);
  useEffect(() => {
    if (open && pos) list.current?.focus({ preventScroll: true });
  }, [open, pos]);

  useEffect(() => {
    if (!open) return;
    list.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => !root.current?.contains(e.target as Node) && !list.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  const move = (from: number, step: number) => {
    let i = from;
    for (let n = 0; n < flat.length; n++) {
      i = (i + step + flat.length) % flat.length;
      if (!flat[i].disabled) return i;
    }
    return from;
  };

  const onListKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") setActive((a) => move(a, 1));
    else if (e.key === "ArrowUp") setActive((a) => move(a, -1));
    else if (e.key === "Home") setActive(move(-1, 1));
    else if (e.key === "End") setActive(move(flat.length, -1));
    else if (e.key === "Enter" || e.key === " ") {
      if (flat[active] && !flat[active].disabled) choose(flat[active].value);
    } else if (e.key === "Escape") {
      setOpen(false);
      button.current?.focus();
    } else if (e.key === "Tab") setOpen(false);
    else if (e.key.length === 1) {
      const now = Date.now();
      typed.current = { text: (now - typed.current.at < 700 ? typed.current.text : "") + e.key.toLowerCase(), at: now };
      const i = flat.findIndex((o) => !o.disabled && o.label.toLowerCase().startsWith(typed.current.text));
      if (i >= 0) setActive(i);
      return;
    } else return;
    e.preventDefault();
  };

  const h = size === "sm" ? "h-9 text-[13px]" : "h-10 text-sm";
  let index = -1;

  return (
    <div ref={root} className={`relative ${className}`}>
      {name && <input type="hidden" name={name} value={value} />}
      <button
        ref={button}
        id={buttonId}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={label}
        aria-describedby={describedBy}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={(e) => {
          if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
            e.preventDefault();
            openList();
          }
        }}
        className={`flex w-full items-center justify-between gap-2 rounded-[var(--radius-control)] border bg-white pr-3 pl-3.5 text-left transition-[border-color,box-shadow,background-color] duration-200 ${h} ${
          open ? "border-maroon shadow-[0_0_0_3px_rgb(110_31_42/0.1)]" : "border-sand-strong/60 hover:border-sand-strong"
        } disabled:cursor-not-allowed disabled:opacity-50`}
      >
        <span className={`truncate ${selected ? "" : "text-muted"}`}>{selected?.label ?? placeholder ?? "Choose…"}</span>
        <ChevronDown size={15} strokeWidth={1.5} aria-hidden className={`shrink-0 text-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open &&
        pos &&
        createPortal(
        <ul
          ref={list}
          id={listId}
          role="listbox"
          tabIndex={-1}
          aria-label={label}
          aria-activedescendant={`${listId}-${active}`}
          onKeyDown={onListKey}
          style={{ position: "fixed", left: pos.left, minWidth: pos.width, top: pos.top, bottom: pos.bottom }}
          className="dropdown-panel z-[95] max-h-80 space-y-0.5 overflow-y-auto font-sans outline-none animate-fade-up [animation-duration:0.2s]"
        >
          {all.map((g, gi) => (
            <li key={gi} role="presentation">
              {g.label && (
                <p role="presentation" className={`px-4 pt-2 pb-1 text-[10px] tracking-[0.2em] text-muted uppercase ${gi ? "mt-1 border-t border-sand/70 pt-2.5" : ""}`}>
                  {g.label}
                </p>
              )}
              <ul role="group" aria-label={g.label}>
                {g.options.map((o) => {
                  index++;
                  const i = index;
                  const isSel = o.value === value;
                  return (
                    <li
                      key={o.value}
                      id={`${listId}-${i}`}
                      data-index={i}
                      role="option"
                      aria-selected={isSel}
                      aria-disabled={o.disabled || undefined}
                      onPointerEnter={() => !o.disabled && setActive(i)}
                      onClick={() => !o.disabled && choose(o.value)}
                      data-active={!o.disabled && i === active}
                      className="dropdown-item"
                    >
                      {o.label}
                      {isSel && <Check size={16} strokeWidth={1.8} aria-hidden className="shrink-0" />}
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ul>,
          document.body,
        )}
    </div>
  );
}
