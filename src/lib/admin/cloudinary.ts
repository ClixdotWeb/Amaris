import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { z } from "zod";

/**
 * Admin photo uploads go from the browser straight to Cloudinary, with a short-lived signature from our server.
 * The signature fixes the folder and file types; after upload the server checks Cloudinary's response
 * signature, folder, format and size before the photo is attached to a product.
 */
export const UPLOAD_MAX_BYTES = 10 * 1024 * 1024;
export const UPLOAD_FORMATS = ["jpg", "png", "webp", "avif"] as const;

const env = () => ({
  cloud: process.env.CLOUDINARY_CLOUD_NAME ?? process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "",
  key: process.env.CLOUDINARY_API_KEY ?? "",
  secret: process.env.CLOUDINARY_API_SECRET ?? "",
  folder: (process.env.CLOUDINARY_UPLOAD_FOLDER ?? "amaris/dev/products").replace(/^\/+|\/+$/g, ""),
});

export const uploadsConfigured = () => {
  const e = env();
  return !!(e.cloud && e.key && e.secret);
};

const sha1 = (s: string) => createHash("sha1").update(s).digest("hex");

/** Cloudinary's signature: parameters sorted by name, joined as a=b&c=d, then the API secret appended, SHA-1. */
function sign(params: Record<string, string | number>) {
  const str = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return sha1(str + env().secret);
}

export function uploadSignature() {
  const e = env();
  const params = { allowed_formats: UPLOAD_FORMATS.join(","), folder: e.folder, timestamp: Math.floor(Date.now() / 1000) };
  return {
    url: `https://api.cloudinary.com/v1_1/${e.cloud}/image/upload`,
    apiKey: e.key,
    ...params,
    signature: sign(params),
    maxBytes: UPLOAD_MAX_BYTES,
  };
}

/** What the browser sends back for each uploaded photo (fields from Cloudinary's upload response). */
export const uploadedImageSchema = z.object({
  public_id: z.string().min(1).max(300),
  version: z.coerce.number().int().positive(),
  signature: z.string().regex(/^[a-f0-9]{40}$/),
  bytes: z.number().int().positive(),
  format: z.string(),
});
export type UploadedImage = z.infer<typeof uploadedImageSchema>;

/** True only if Cloudinary really produced this upload and it obeys our rules. */
export function verifyUpload(u: UploadedImage) {
  const expected = sha1(`public_id=${u.public_id}&version=${u.version}${env().secret}`);
  const genuine = timingSafeEqual(Buffer.from(expected), Buffer.from(u.signature));
  return (
    genuine &&
    u.public_id.startsWith(`${env().folder}/`) &&
    (UPLOAD_FORMATS as readonly string[]).includes(u.format) &&
    u.bytes <= UPLOAD_MAX_BYTES
  );
}

/** Photos the admin uploaded (inside the upload folder) can be deleted; catalogue photos used by the shop never are. */
export const isAdminUpload = (publicId: string | null | undefined) => !!publicId && publicId.startsWith(`${env().folder}/`);

export async function destroyImage(publicId: string) {
  if (!isAdminUpload(publicId) || !uploadsConfigured()) return;
  const e = env();
  const params = { public_id: publicId, timestamp: Math.floor(Date.now() / 1000) };
  const body = new URLSearchParams({ ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])), api_key: e.key, signature: sign(params) });
  const res = await fetch(`https://api.cloudinary.com/v1_1/${e.cloud}/image/destroy`, { method: "POST", body });
  if (!res.ok) console.error("[cloudinary] destroy failed", publicId, res.status);
}
