"use client";
import { useEffect, useState } from "react";

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

  return (
    <div>
      <input type="hidden" name="uploaded_images" value={JSON.stringify(payload)} />
      <input
        type="file"
        accept={TYPES.join(",")}
        multiple
        disabled={files.length >= maxFiles}
        onChange={(e) => {
          void onPick(e.target.files);
          e.target.value = "";
        }}
      />
      {busy > 0 && <p role="status" className="mt-2 text-sm text-muted">Uploading {busy} photo{busy > 1 ? "s" : ""}…</p>}
      {error && <p role="alert" className="mt-2 text-sm text-sale">{error}</p>}
      {files.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-3">
          {files.map((f) => (
            <li key={f.public_id}>
              <img src={f.preview} alt={f.name} width={100} className="aspect-[3/4] w-[100px] rounded-media bg-cream object-cover" />
              <button type="button" className="mt-1 text-[11px] tracking-[0.14em] text-muted uppercase hover:text-sale" onClick={() => setFiles((cur) => cur.filter((x) => x.public_id !== f.public_id))}>
                Don&apos;t add
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-2 text-xs text-muted">JPG, PNG, WebP or AVIF, up to 10 MB each. Photos are added to the product when you save.</p>
    </div>
  );
}
