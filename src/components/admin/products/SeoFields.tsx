"use client";
import { useState } from "react";
import { Field } from "@/components/admin/ui";
import { site } from "@/config/site";

const HOST = (() => {
  try {
    return new URL(site.url).host;
  } catch {
    return "your-site";
  }
})();

const TITLE_MAX = 60;
const DESC_MAX = 160;

/** Search title + description with character counts and a Google-style preview. Empty = filled in from the product. */
export function SeoFields({
  defaultTitle,
  defaultDescription,
  fallbackTitle,
  fallbackDescription,
  slug,
}: {
  defaultTitle: string;
  defaultDescription: string;
  fallbackTitle: string;
  fallbackDescription: string;
  slug: string;
}) {
  const [title, setTitle] = useState(defaultTitle);
  const [desc, setDesc] = useState(defaultDescription);
  const shownTitle = (title || fallbackTitle || "Product name").slice(0, TITLE_MAX + 10);
  const shownDesc = (desc || fallbackDescription || "Product description").replace(/\s+/g, " ").slice(0, DESC_MAX + 10);
  const count = (n: number, max: number) => (
    <span className={n > max ? "text-sale" : "text-muted"}>
      {n}/{max}
    </span>
  );

  return (
    <div className="grid min-w-0 gap-5 [&>*]:min-w-0">
      <Field label="Search title" htmlFor="meta_title" hint={`Leave empty to use the product name. ${title.length}/${TITLE_MAX} characters.`}>
        <input id="meta_title" name="meta_title" value={title} maxLength={70} onChange={(e) => setTitle(e.target.value)} placeholder={fallbackTitle} aria-describedby="meta_title-hint" />
      </Field>
      <Field label="Search description" htmlFor="meta_description" hint={`Leave empty to use the start of the description. ${desc.length}/${DESC_MAX} characters.`}>
        <textarea id="meta_description" name="meta_description" rows={3} value={desc} maxLength={170} onChange={(e) => setDesc(e.target.value)} aria-describedby="meta_description-hint" />
      </Field>
      <div className="rounded-[var(--radius-control)] border border-sand bg-white p-4" aria-label="Google preview">
        <p className="mb-2 flex justify-between text-[11px] tracking-[0.14em] text-muted uppercase">
          <span>Google preview</span>
          <span>
            {count(title.length, TITLE_MAX)} · {count(desc.length, DESC_MAX)}
          </span>
        </p>
        <p className="truncate text-xs text-success">{HOST} › product › {slug || "…"}</p>
        <p className="mt-0.5 truncate text-lg leading-snug text-maroon">{shownTitle} | Amaris Boutique</p>
        <p className="line-clamp-2 text-sm text-muted">{shownDesc}</p>
      </div>
    </div>
  );
}
