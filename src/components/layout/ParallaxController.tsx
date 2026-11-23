"use client";
import { useEffect } from "react";

/**
 * Scroll parallax for [data-parallax="<speed>"] elements (images sized 120% of their frame, offset -10%).
 * Each frame, an image is shifted against its frame's distance from the viewport centre, clamped to the
 * spare 10% so edges never show. Uses the CSS `translate` property, so it combines with transform/scale
 * animations (curtain reveal, hover zoom, hero settle). Off for prefers-reduced-motion.
 */
export function ParallaxController() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      const vh = window.innerHeight;
      document.querySelectorAll<HTMLElement>("[data-parallax]").forEach((el) => {
        const box = (el.parentElement ?? el).getBoundingClientRect();
        if (box.bottom < -100 || box.top > vh + 100) return; // off screen: skip
        const speed = parseFloat(el.dataset.parallax || "0.12");
        const fromCentre = box.top + box.height / 2 - vh / 2;
        const limit = box.height * 0.1; // the image has 10% spare above and below
        const shift = Math.max(-limit, Math.min(limit, -fromCentre * speed));
        el.style.translate = `0 ${shift.toFixed(1)}px`;
      });
    };
    const request = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", request);
    // New images (slideshow changes, client-side navigation) get positioned straight away
    const mo = new MutationObserver(request);
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", request);
      window.removeEventListener("resize", request);
      mo.disconnect();
    };
  }, []);

  return null;
}
