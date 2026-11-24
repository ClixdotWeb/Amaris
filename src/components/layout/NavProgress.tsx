"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * Thin rose-gold line along the top of the header that starts the instant an internal link is clicked
 * and completes when the new page arrives, so navigation never feels unresponsive.
 */
export function NavProgress() {
  const path = usePathname();
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");
  const fallback = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement).closest("a");
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname && url.search === location.search) return; // same page / hash link
      setState("loading");
      if (fallback.current) clearTimeout(fallback.current);
      fallback.current = setTimeout(() => setState("idle"), 10000);
    };
    document.addEventListener("click", onClick, true); // capture: runs before Link cancels the native click
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  // New page rendered → finish the bar, then hide it
  useEffect(() => {
    setState((s) => (s === "loading" ? "done" : s));
    const t = setTimeout(() => setState((s) => (s === "done" ? "idle" : s)), 550);
    return () => clearTimeout(t);
  }, [path]);

  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 z-[60] block h-[2px] origin-left bg-[#b07a5c]"
      style={{
        transform: `scaleX(${state === "idle" ? 0 : state === "loading" ? 0.85 : 1})`,
        opacity: state === "idle" ? 0 : 1,
        transition:
          state === "loading"
            ? "transform 8s cubic-bezier(0.05, 0.8, 0.2, 1), opacity 0.15s"
            : state === "done"
              ? "transform 0.25s ease-out, opacity 0.3s 0.2s"
              : "none",
      }}
    />
  );
}
