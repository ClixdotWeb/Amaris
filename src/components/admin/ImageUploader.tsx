"use client";
import { useEffect, useState } from "react";
import { ImagePlus, X } from "lucide-react";

type Signature = {
  url: string;
  apiKey: string;
  allowed_formats: string;
  folder: string;
  timestamp: number;
  signature: string;
  maxBytes: number;
};
type Uploaded = { public_id: string; version: number; signature: string; bytes: number; format: string; preview: string; name: string };

const TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

/**
 * Uploads photos straight from the browser to Cloudinary (signed by our server), then puts the
 * results in a hidden `uploaded_images` field. The server re-checks every upload when the form is saved.
 */
export function ImageUploader({ maxFiles, onBusyChange }: { maxFiles: number; onBusyChange?: (busy: boolean) => void }) {
  const [files, setFiles] = useState<Uploaded[]>([]);
  const [busy, setBusy] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [over, setOver] = useState(false);

  const track = (delta: number) => setBusy((n) => n + delta);
  useEffect(() => onBusyChange?.(busy > 0), [busy, onBusyChange]);

  async function upload(file: File) {
    if (!TYPES.includes(file.type)) throw new Error(`${file.name}: use JPG, PNG, WebP or AVIF.`);
    const sigRes = await fetch("/api/admin/uploads/sign", { method: "POST" });
    const sig = (await sigRes.json()) as Signature & { error?: string };
    if (!sigRes.ok) throw new Error(sig.error ?? "Could not start the upload.");
    if (file.size > sig.maxBytes) throw new Error(`${file.name}: larger than ${Math.round(sig.maxBytes / 1048576)} MB.`);

    const body = new FormData();
    body.append("file", file);
    body.append("api_key", sig.apiKey);
    body.append("timestamp", String(sig.timestamp));
    body.append("signature", sig.signature);
    body.append("folder", sig.folder);
    body.append("allowed_formats", sig.allowed_formats);
    const res = await fetch(sig.url, { method: "POST", body });
    const out = await res.json();
    if (!res.ok) throw new Error(`${file.name}: ${out?.error?.message ?? "upload failed"}`);
    return {
      public_id: out.public_id,
      version: out.version,
      signature: out.signature,
      bytes: out.bytes,
      format: out.format,
      preview: URL.createObjectURL(file),
      name: file.name,
    } satisfies Uploaded;
  }

  async function onPick(list: FileList | null) {
    setError(null);
    const picked = Array.from(list ?? []).slice(0, Math.max(0, maxFiles - files.length));
    if ((list?.length ?? 0) > picked.length) setError(`You can add ${maxFiles} photos at most.`);
    await Promise.all(
      picked.map(async (f) => {
        track(1);
        try {
          const u = await upload(f);
          setFiles((cur) => [...cur, u]);
        } catch (e) {
          setError(e instanceof Error ? e.message : "Upload failed.");
        } finally {
          track(-1);
        }
      }),
    );
  }

  const payload = files.map(({ public_id, version, signature, bytes, format }) => ({ public_id, version, signature, bytes, format }));
  const full = files.length >= maxFiles;

  return (
    <div>
      <input type="hidden" name="uploaded_images" value={JSON.stringify(payload)} />
      {/* Drop zone: click "Add photos" or drag pictures onto it */}
      <label
        onDragOver={(e) => {
          e.preventDefault();
          if (!full) setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          if (!full) void onPick(e.dataTransfer.files);
        }}
        className={`flex flex-col items-center justify-center gap-3 rounded-[16px] border-2 border-dashed px-6 py-9 text-center transition-colors ${
          full ? "cursor-not-allowed border-sand opacity-60" : over ? "cursor-copy border-maroon bg-maroon/[0.04]" : "cursor-pointer border-sand-strong/40 bg-cream/30 hover:border-maroon/60 hover:bg-cream/60"
        }`}
      >
        <input
          type="file"
          accept={TYPES.join(",")}
          multiple
          disabled={full}
          className="sr-only"
          onChange={(e) => {
            void onPick(e.target.files);
            e.target.value = "";
          }}
        />
        <span aria-hidden className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-maroon shadow-card">
          <ImagePlus size={22} strokeWidth={1.4} />
        </span>
        <span className="btn-primary btn-sm pointer-events-none">{full ? `${maxFiles} photos added` : "Add photos"}</span>
        <span className="text-xs text-muted">or drag them here · JPG, PNG, WebP or AVIF, up to 10 MB each</span>
      </label>

      {error && (
        <p role="alert" className="mt-3 rounded-[10px] bg-sale/[0.06] px-3 py-2 text-sm text-sale">
          {/api.?key/i.test(error) ? "Photo upload isn't set up: the Cloudinary key in .env.local is not valid. Ask your developer to add a new key." : error}
        </p>
      )}

      {(files.length > 0 || busy > 0) && (
        <ul className="mt-4 flex flex-wrap gap-3" aria-live="polite">
          {files.map((f) => (
            <li key={f.public_id} className="group/ph relative">
              <img src={f.preview} alt={f.name} width={100} className="aspect-[3/4] w-[100px] rounded-[10px] bg-cream object-cover" />
              <button
                type="button"
                aria-label={`Don't add ${f.name}`}
                className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-white text-muted shadow-card transition-colors hover:text-sale"
                onClick={() => setFiles((cur) => cur.filter((x) => x.public_id !== f.public_id))}
              >
                <X size={14} />
              </button>
            </li>
          ))}
          {Array.from({ length: busy }, (_, i) => (
            <li key={`up-${i}`} role="status" className="flex aspect-[3/4] w-[100px] animate-pulse items-center justify-center rounded-[10px] bg-cream text-[11px] text-muted">
              Uploading…
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 text-xs text-muted">Photos are added to the product when you save.</p>
    </div>
  );
}
