/**
 * Every picture on the site is served from Cloudinary (uploaded with scripts/upload-to-cloudinary.mjs).
 * Code keeps the familiar local paths; cloudImage() turns them into Cloudinary URLs:
 *
 *   /Assets/products/saree/<product>/01.webp  →  amaris/products/saree/<product>/01
 *   /Assets/hero/hero-saree-red-banarasi.jpg  →  amaris/site/hero/hero-saree-red-banarasi
 *   /Assets/logo-dark.png                     →  amaris/site/logo-dark
 *
 * Cloudinary resizes on the fly (width) and picks the best format and quality for each browser.
 * (The damask background is a CSS url in globals.css and uses the same address written out in full.)
 */
const CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "slzv1rui";

/** Cloudinary URL for a site or product picture, optionally limited to a width (never upscaled). */
export function cloudImage(localPath: string, width?: number) {
  const publicId = (
    localPath.startsWith("/Assets/products/")
      ? localPath.replace(/^\/Assets\//, "amaris/")
      : localPath.replace(/^\/Assets\//, "amaris/site/")
  ).replace(/\.\w+$/, "");
  return cloudinaryUrl(publicId, width);
}

/** Cloudinary URL for a public ID (e.g. a photo uploaded in the admin), optionally limited to a width. */
export function cloudinaryUrl(publicId: string, width?: number) {
  const size = width ? `,c_limit,w_${width}` : "";
  return `https://res.cloudinary.com/${CLOUD}/image/upload/f_auto,q_auto${size}/${publicId}`;
}

/** Product photos (same function; named for readability). */
export const productPhoto = (localPath: string, width: number) => cloudImage(localPath, width);

/** Widths used across the site: full photo on the product page, small copy for cards, menus and the cart. */
export const PHOTO_FULL = 1600;
export const PHOTO_CARD = 640;
/** Full-screen photos (hero, banners): large enough for big screens, never upscaled. */
export const PHOTO_WIDE = 2400;
/** Logo: shown about 60px tall, 400px wide covers sharp high-density screens. */
export const LOGO_WIDTH = 400;
