/**
 * Uploads the product photos used by the site (src/lib/data/catalog.json) to Cloudinary.
 *
 *   node scripts/upload-to-cloudinary.mjs            upload everything (skips photos already uploaded)
 *   node scripts/upload-to-cloudinary.mjs --limit 1  upload just one (connection test)
 *   node scripts/upload-to-cloudinary.mjs --site     upload the website pictures (hero, logo, banners…) to amaris/site/
 *
 * Reads CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET from .env.local.
 * Local file  public/Assets/products/<collection>/<product>/01.webp
 * becomes     amaris/products/<collection>/<product>/01   (Cloudinary public ID)
 * Results are written to scripts/cloudinary-uploads.json (local path → public ID).
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const ROOT = process.cwd();
const env = Object.fromEntries(
  fs.readFileSync(path.join(ROOT, ".env.local"), "utf8")
    .split(/\r?\n/)
    .map((l) => l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/))
    .filter(Boolean)
    .map((m) => [m[1], m[2].trim()]),
);
const CLOUD = env.CLOUDINARY_CLOUD_NAME, KEY = env.CLOUDINARY_API_KEY, SECRET = env.CLOUDINARY_API_SECRET;
if (!CLOUD || !KEY || !SECRET || SECRET.startsWith("PASTE")) throw new Error("Cloudinary settings missing in .env.local");

const limitArg = process.argv.indexOf("--limit");
const LIMIT = limitArg > 0 ? Number(process.argv[limitArg + 1]) : Infinity;
const CONCURRENCY = 4;
const LOG = path.join(ROOT, "scripts", "cloudinary-uploads.json");
const done = fs.existsSync(LOG) ? JSON.parse(fs.readFileSync(LOG, "utf8")) : {};

/** Website pictures (not products). Upload with --site. Keep in sync with src/lib/images.ts (siteImage). */
const SITE_FILES = [
  "/Assets/hero/hero-readymade-black-chikankari.jpg",
  "/Assets/hero/hero-saree-red-banarasi.jpg",
  "/Assets/hero/hero-suit-yellow-garden.jpg",
  "/Assets/logo-dark.png",
  "/Assets/logo-light.png",
  "/Assets/banner-hq.webp",
  "/Assets/banner-cta-hq.webp",
  "/Assets/burgundy-wall.webp",
  "/Assets/damask-white.webp",
  "/Assets/placeholders/kids.jpg",
  "/Assets/placeholders/kurti.jpg",
];

const catalog = JSON.parse(fs.readFileSync(path.join(ROOT, "src/lib/data/catalog.json"), "utf8"));
const files = process.argv.includes("--site")
  ? SITE_FILES
  : [...new Set(catalog.flatMap((p) => p.images))]; // e.g. /Assets/products/saree/x/01.webp
const todo = files.filter((f) => !done[f]).slice(0, LIMIT);
const pending = files.filter((f) => !done[f]).length;
console.log(`${files.length} files in this set, ${pending} not yet uploaded, uploading ${todo.length}`);

const sign = (params) =>
  crypto.createHash("sha1")
    .update(Object.keys(params).sort().map((k) => `${k}=${params[k]}`).join("&") + SECRET)
    .digest("hex");

async function upload(local) {
  // /Assets/products/x/01.webp → amaris/products/x/01 ; /Assets/hero/a.jpg → amaris/site/hero/a
  const publicId = (local.startsWith("/Assets/products/")
    ? local.replace(/^\/Assets\//, "amaris/")
    : local.replace(/^\/Assets\//, "amaris/site/")
  ).replace(/\.\w+$/, "");
  const params = {
    public_id: publicId,
    asset_folder: path.posix.dirname(publicId),
    overwrite: "false",
    timestamp: String(Math.floor(Date.now() / 1000)),
  };
  const form = new FormData();
  for (const [k, v] of Object.entries(params)) form.append(k, v);
  form.append("api_key", KEY);
  form.append("signature", sign(params));
  const buf = fs.readFileSync(path.join(ROOT, "public", local));
  form.append("file", new Blob([buf]), path.basename(local));
  for (let attempt = 1; attempt <= 4; attempt++) {
    const r = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD}/image/upload`, { method: "POST", body: form });
    const j = await r.json().catch(() => ({}));
    if (r.ok) return { publicId: j.public_id, bytes: j.bytes, width: j.width, height: j.height, format: j.format };
    if (attempt === 4 || (r.status < 500 && r.status !== 429)) throw new Error(`${r.status} ${j.error?.message ?? ""} (${local})`);
    await new Promise((res) => setTimeout(res, 3000 * attempt));
  }
}

let ok = 0, failed = 0, i = 0;
const save = () => fs.writeFileSync(LOG, JSON.stringify(done, null, 1));
async function worker() {
  while (i < todo.length) {
    const f = todo[i++];
    try {
      const r = await upload(f);
      done[f] = r.publicId;
      ok++;
      if (todo.length <= 3) console.log("uploaded", f, "→", r.publicId, `${r.width}x${r.height} ${r.format} ${r.bytes}B`);
    } catch (e) {
      failed++;
      console.log("FAILED", e.message);
    }
    if ((ok + failed) % 50 === 0) { save(); console.log(`progress ${ok + failed}/${todo.length} (failed ${failed})`); }
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, worker));
save();
console.log(`DONE uploaded ${ok}, failed ${failed}, this set complete: ${files.filter((f) => done[f]).length}/${files.length}`);
