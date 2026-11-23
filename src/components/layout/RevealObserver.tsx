"use client";
import { useEffect } from "react";

const STAGGER_MS = 90;
const MAX_STAGGER_MS = 720;

declare global {
  interface Window {
    __amarisReveal?: boolean;
  }
}

/**
 * One observer for the whole site. Adds .is-revealed to [data-reveal] elements, and to each child of
 * [data-reveal-stagger] containers (with a growing delay), the first time they scroll into view.
 * New elements (client-side navigation, re-rendered grids) are picked up by a MutationObserver.
 * Styles: globals.css ("Scroll reveal"). The .reveal-ready class is set before paint in app/layout.tsx.
 */
export function RevealObserver() {
  useEffect(() => {
    const root = document.documentElement;
    window.__amarisReveal = true; // tells the layout's fallback timer that reveal is running
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || !("IntersectionObserver" in window)) {
      root.classList.remove("reveal-ready");
      return;
    }
    root.classList.add("reveal-ready");

    const observed = new WeakSet<Element>();
    const revealedGroups = new WeakSet<Element>();

    const revealGroup = (el: Element) => {
      Array.from(el.children).forEach((child, i) => {
        if (child.classList.contains("is-revealed")) return;
        (child as HTMLElement).style.setProperty("--reveal-delay", `${Math.min(i * STAGGER_MS, MAX_STAGGER_MS)}ms`);
        child.classList.add("is-revealed");
      });
      revealedGroups.add(el);
    };

    const reveal = (el: Element) => {
      if (el.hasAttribute("data-reveal-stagger")) revealGroup(el);
      else el.classList.add("is-revealed");
    };

    // Curtain elements start fully clipped (clip-path: inset(100%…)), which IntersectionObserver treats as
    // never visible. So we watch their parent frame instead and reveal them through it.
    const selfWatched = new WeakSet<Element>();
    const viaParent = new Map<Element, Element[]>();

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const t = entry.target;
          if (selfWatched.has(t)) reveal(t);
          viaParent.get(t)?.forEach(reveal);
          viaParent.delete(t);
          io.unobserve(t);
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
    );

    const scan = () => {
      document.querySelectorAll("[data-reveal], [data-reveal-stagger]").forEach((el) => {
        // A group that already revealed shows any newly added children straight away
        if (revealedGroups.has(el)) {
          el.querySelectorAll(":scope > :not(.is-revealed)").forEach((c) => c.classList.add("is-revealed"));
          return;
        }
        if (observed.has(el)) return;
        observed.add(el);
        if (el.getAttribute("data-reveal") === "curtain" && el.parentElement) {
          const frame = el.parentElement;
          viaParent.set(frame, [...(viaParent.get(frame) ?? []), el]);
          io.observe(frame);
        } else {
          selfWatched.add(el);
          io.observe(el);
        }
      });
    };

    scan();
    const mo = new MutationObserver(scan);
    mo.observe(document.body, { childList: true, subtree: true });

    // Items at the very end of the page (e.g. the footer's bottom bar) can't scroll up into the
    // observer's zone: once the visitor reaches the bottom, reveal whatever is left.
    const onScroll = () => {
      if (window.innerHeight + window.scrollY < document.documentElement.scrollHeight - 4) return;
      document.querySelectorAll("[data-reveal]:not(.is-revealed)").forEach((el) => {
        el.classList.add("is-revealed");
        io.unobserve(el);
      });
      document.querySelectorAll("[data-reveal-stagger]").forEach((g) => {
        if (!revealedGroups.has(g)) {
          revealGroup(g);
          io.unobserve(g);
        }
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      io.disconnect();
      mo.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return null;
}
