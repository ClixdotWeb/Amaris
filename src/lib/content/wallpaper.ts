import type { SiteWallpaper } from "@/types";

/* Shop background (dashboard → Homepage → Website wallpaper). Small module: also used in the browser. */

/** The built-in damask tile (white/pearl, 2 repeats wide). */
export const DEFAULT_WALLPAPER_URL = "https://res.cloudinary.com/slzv1rui/image/upload/f_auto,q_auto/amaris/site/damask-white";

/** CSS for the shop background, from the dashboard setting. null = keep the stylesheet's built-in damask. */
export function wallpaperCss(w: SiteWallpaper | undefined): string | null {
  if (!w || w.mode === "default") {
    if (!w || w.strength === 45) return null;
    return `:root{--pattern-opacity:${Math.min(100, Math.max(0, w.strength)) / 100}}`;
  }
  if (w.mode === "none") return "body::before{display:none}";
  // Only a plain https address goes into the CSS (no quotes, brackets or spaces that could break out of url())
  const url = w.image_url.replace(/["'\\()\s<>]/g, "");
  if (!/^https:\/\/[^/]+\//.test(url)) return null;
  const opacity = Math.min(100, Math.max(0, w.strength)) / 100;
  if (w.mode === "photo")
    // One picture behind every page: fixed to the screen so it doesn't stretch over long pages
    return `body::before{position:fixed;background:url("${url}") center/cover no-repeat;opacity:${opacity}}`;
  const size = Math.min(2000, Math.max(80, Math.round(w.size)));
  return `body::before{background:url("${url}") 0 0/${size}px auto repeat;opacity:${opacity}}`;
}
