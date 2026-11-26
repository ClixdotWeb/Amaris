"use client";
import { useRef, useState } from "react";
import { ImageUp, RotateCcw } from "lucide-react";

const TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

/**
 * Uploads one website picture (hero slide, tile, wallpaper) straight to Cloudinary with a signature from
 * our server, into the site folder. Returns a Cloudinary address that picks the best format and size.
 */
export async function uploadSiteImage(file: File, width = 2400): Promise<string> {
  if (!TYPES.includes(file.type)) throw new Error("Use a JPG, PNG, WebP or AVIF picture.");
  const sigRes = await fetch("/api/admin/uploads/sign?kind=site", { method: "POST" });
  const sig = await sigRes.json();
  if (!sigRes.ok) throw new Error(sig.error ?? "Could not start the upload.");
  if (file.size > sig.maxBytes) throw new Error(`The picture is larger than ${Math.round(sig.maxBytes / 1048576)} MB.`);
  const body = new FormData();
  body.append("file", file);
  body.append("api_key", sig.apiKey);
  body.append("timestamp", String(sig.timestamp));
  body.append("signature", sig.signature);
  body.append("folder", sig.folder);
  body.append("allowed_formats", sig.allowed_formats);
  const res = await fetch(sig.url, { method: "POST", body });
  const out = await res.json();
  if (!res.ok) throw new Error(out?.error?.message ?? "Upload failed.");
  return `https://res.cloudinary.com/${sig.cloud}/image/upload/f_auto,q_auto,c_limit,w_${width}/v${out.version}/${out.public_id}`;
}

/** "Upload picture" button with progress and errors. */
export function UploadButton({ onUploaded, label = "Upload picture", width }: { onUploaded: (url: string) => void; label?: string; width?: number }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <div>
      <input
        ref={input}
        type="file"
        accept={TYPES.join(",")}
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          setBusy(true);
          setError(null);
          try {
            onUploaded(await uploadSiteImage(file, width));
          } catch (err) {
            setError(err instanceof Error ? err.message : "Upload failed.");
          } finally {
            setBusy(false);
          }
        }}
      />
      <button type="button" onClick={() => input.current?.click()} disabled={busy} className="btn-outline btn-sm w-full">
        <ImageUp size={15} strokeWidth={1.5} aria-hidden /> {busy ? "Uploading…" : label}
      </button>
      {error && (
        <p role="alert" className="mt-1.5 text-xs text-sale">
          {error}
        </p>
      )}
    </div>
  );
}

const parsePos = (p: string) => {
  const m = p.match(/^([\d.]+)% ([\d.]+)%$/);
  return m ? { x: Number(m[1]), y: Number(m[2]) } : { x: 50, y: 50 };
};

/**
 * A website picture with upload, "back to the built-in picture" and, when `position` is given, a focus point:
 * click the part of the photo that must stay in view. The previews show the same crop the shop uses on a
 * wide screen and on a phone (CSS object-position), so the picture lines up on every screen.
 */
export function SiteImageField({
  value,
  fallback,
  onChange,
  position,
  onPosition,
  defaultPosition,
  aspect = "aspect-[16/10]",
  label,
}: {
  value: string;
  fallback: string;
  onChange: (url: string) => void;
  position?: string;
  onPosition?: (pos: string) => void;
  defaultPosition?: string;
  /** Preview shape when there is no focus point */
  aspect?: string;
  label: string;
}) {
  const src = value.trim() || fallback;
  const custom = !!value.trim() && value.trim() !== fallback;
  const pos = position ?? "50% 50%";
  const { x, y } = parsePos(pos);

  return (
    <div className="space-y-3">
      {onPosition ? (
        <>
          <p className="text-[13px] font-medium">{label}</p>
          {/* Whole photo: click to set the focus point */}
          <button
            type="button"
            className="relative block w-full cursor-crosshair overflow-hidden rounded-[12px] bg-cream"
            aria-label={`${label}: click the part of the photo that must always stay in view`}
            onClick={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              const px = Math.round(((e.clientX - r.left) / r.width) * 100);
              const py = Math.round(((e.clientY - r.top) / r.height) * 100);
              onPosition(`${Math.min(100, Math.max(0, px))}% ${Math.min(100, Math.max(0, py))}%`);
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" className="block h-auto w-full" />
            <span aria-hidden className="pointer-events-none absolute h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgb(0_0_0/0.35),0_4px_12px_rgb(0_0_0/0.35)]" style={{ left: `${x}%`, top: `${y}%` }}>
              <span className="absolute inset-[9px] rounded-full bg-white" />
            </span>
          </button>
          <p className="text-xs text-muted">Click the face or outfit: that part stays in view on every screen.</p>
          {/* What the shop shows: wide screens and phones */}
          <div className="grid grid-cols-[1fr_auto] items-end gap-3">
            <figure>
              <span className="block aspect-[16/9] overflow-hidden rounded-[8px] bg-cream">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="h-full w-full object-cover" style={{ objectPosition: pos }} />
              </span>
              <figcaption className="mt-1 text-[10px] tracking-[0.14em] text-muted uppercase">Computer</figcaption>
            </figure>
            <figure>
              <span className="block aspect-[9/16] w-16 overflow-hidden rounded-[8px] bg-cream">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="h-full w-full object-cover" style={{ objectPosition: pos }} />
              </span>
              <figcaption className="mt-1 text-[10px] tracking-[0.14em] text-muted uppercase">Phone</figcaption>
            </figure>
          </div>
        </>
      ) : (
        <span className={`block w-full overflow-hidden rounded-[12px] bg-cream ${aspect}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="" className="h-full w-full object-cover" />
        </span>
      )}
      <div className="grid grid-cols-[1fr_auto] gap-2">
        <UploadButton
          onUploaded={(url) => {
            onChange(url);
            onPosition?.("50% 40%");
          }}
        />
        {custom && (
          <button
            type="button"
            className="btn-outline btn-sm"
            title="Use the built-in picture"
            aria-label="Use the built-in picture"
            onClick={() => {
              onChange("");
              if (defaultPosition) onPosition?.(defaultPosition);
            }}
          >
            <RotateCcw size={14} strokeWidth={1.5} />
          </button>
        )}
      </div>
    </div>
  );
}
