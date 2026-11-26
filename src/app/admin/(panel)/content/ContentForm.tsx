"use client";
import Link from "next/link";
import { useActionState, useState } from "react";
import { ExternalLink, Plus, X } from "lucide-react";
import { saveContent } from "./actions";
import { Field, FormSection } from "@/components/admin/ui";
import { useActionToast } from "@/components/admin/Toaster";
import { SiteImageField, UploadButton } from "@/components/admin/SiteImageField";
import { DEFAULT_WALLPAPER_URL } from "@/lib/content/wallpaper";
import type { HomeContent, SiteWallpaper } from "@/types";

/**
 * Home page editor. Every field shows the built-in text as its placeholder; leave a field empty to keep it.
 * Saved as one JSON field so the three slides, messages and tiles save together.
 */
export function ContentForm({
  content,
  defaults,
  collections,
}: {
  content: HomeContent;
  defaults: HomeContent;
  collections: { id: string; name: string; count: number; active: boolean }[];
}) {
  const [state, action, pending] = useActionState(saveContent, undefined);
  useActionToast(state);
  const [c, setC] = useState<HomeContent>(() => structuredClone(content));
  const setHero = (i: number, k: keyof HomeContent["hero"][number], v: string) => setC((d) => ({ ...d, hero: d.hero.map((h, j) => (j === i ? { ...h, [k]: v } : h)) }));
  const setTile = (i: number, k: keyof HomeContent["promo_tiles"][number], v: string) =>
    setC((d) => ({ ...d, promo_tiles: d.promo_tiles.map((t, j) => (j === i ? { ...t, [k]: v } : t)) }));

  const setWall = (patch: Partial<SiteWallpaper>) => setC((d) => ({ ...d, wallpaper: { ...d.wallpaper, ...patch } }));
  const w = c.wallpaper;
  const wallSrc = w.mode === "pattern" || w.mode === "photo" ? w.image_url : DEFAULT_WALLPAPER_URL;

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="content" value={JSON.stringify(c)} />

      <FormSection title="Hero slides" description="The three full-screen slides at the top of the home page. The big words read “left right”, e.g. “ready to wear”.">
        <div className="grid gap-6 xl:grid-cols-3 [&>*]:min-w-0">
          {c.hero.map((h, i) => {
            const d = defaults.hero[i];
            return (
              <fieldset key={i} className="space-y-4 rounded-[16px] border border-sand/80 p-4">
                <legend className="px-1 text-[11px] tracking-[0.18em] text-muted uppercase">Slide {i + 1}</legend>
                <SiteImageField
                  label="Photo"
                  value={h.image_url === d.image_url ? "" : h.image_url}
                  fallback={d.image_url}
                  onChange={(url) => setHero(i, "image_url", url)}
                  position={h.position}
                  onPosition={(p) => setHero(i, "position", p)}
                  defaultPosition={d.position}
                />
                <div className="grid grid-cols-2 gap-3">
                  <Field label="First word" htmlFor={`h${i}-l`}>
                    <input id={`h${i}-l`} value={h.left} placeholder={d.left} maxLength={30} onChange={(e) => setHero(i, "left", e.target.value)} />
                  </Field>
                  <Field label="Second words" htmlFor={`h${i}-r`}>
                    <input id={`h${i}-r`} value={h.right} placeholder={d.right} maxLength={30} onChange={(e) => setHero(i, "right", e.target.value)} />
                  </Field>
                </div>
                <Field label="Small line above" htmlFor={`h${i}-t`}>
                  <input id={`h${i}-t`} value={h.tagline} placeholder={d.tagline} maxLength={60} onChange={(e) => setHero(i, "tagline", e.target.value)} />
                </Field>
                <Field label="Description" htmlFor={`h${i}-d`}>
                  <textarea id={`h${i}-d`} rows={2} value={h.description} placeholder={d.description} maxLength={200} onChange={(e) => setHero(i, "description", e.target.value)} />
                </Field>
                <Field label="Button goes to" htmlFor={`h${i}-h`}>
                  <input id={`h${i}-h`} value={h.href} placeholder={d.href} maxLength={300} onChange={(e) => setHero(i, "href", e.target.value)} />
                </Field>
              </fieldset>
            );
          })}
        </div>
      </FormSection>

      <FormSection title="Announcement messages" description="The burgundy band that scrolls under the hero. Keep each message short.">
        <ol className="space-y-2">
          {c.announcements.map((m, i) => (
            <li key={i} className="flex items-center gap-2">
              <span className="w-5 text-center text-xs text-muted">{i + 1}</span>
              <label htmlFor={`an-${i}`} className="sr-only">Message {i + 1}</label>
              <input id={`an-${i}`} value={m} maxLength={90} onChange={(e) => setC((d) => ({ ...d, announcements: d.announcements.map((x, j) => (j === i ? e.target.value : x)) }))} />
              <button
                type="button"
                aria-label={`Remove message ${i + 1}`}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted hover:bg-cream hover:text-sale"
                onClick={() => setC((d) => ({ ...d, announcements: d.announcements.filter((_, j) => j !== i) }))}
              >
                <X size={15} />
              </button>
            </li>
          ))}
        </ol>
        <button type="button" disabled={c.announcements.length >= 8} onClick={() => setC((d) => ({ ...d, announcements: [...d.announcements, ""] }))} className="inline-flex items-center gap-1.5 self-start text-[11px] tracking-[0.14em] text-maroon uppercase">
          <Plus size={13} /> Add message
        </button>
        {c.announcements.filter((a) => a.trim()).length === 0 && <p className="text-xs text-muted">With no messages, the built-in ones are shown.</p>}
      </FormSection>

      <FormSection title="Promo tiles" description="The two large photo tiles further down the home page.">
        <div className="grid gap-6 md:grid-cols-2 [&>*]:min-w-0">
          {c.promo_tiles.map((t, i) => {
            const d = defaults.promo_tiles[i];
            return (
              <fieldset key={i} className="space-y-4 rounded-[16px] border border-sand/80 p-4">
                <legend className="px-1 text-[11px] tracking-[0.18em] text-muted uppercase">Tile {i + 1}</legend>
                <SiteImageField label={`Tile ${i + 1} photo`} value={t.image_url === d.image_url ? "" : t.image_url} fallback={d.image_url} onChange={(url) => setTile(i, "image_url", url)} aspect="aspect-[5/4]" />
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Small line" htmlFor={`t${i}-e`}>
                    <input id={`t${i}-e`} value={t.eyebrow} placeholder={d.eyebrow} maxLength={40} onChange={(e) => setTile(i, "eyebrow", e.target.value)} />
                  </Field>
                  <Field label="Title" htmlFor={`t${i}-t`}>
                    <input id={`t${i}-t`} value={t.title} placeholder={d.title} maxLength={40} onChange={(e) => setTile(i, "title", e.target.value)} />
                  </Field>
                </div>
                <Field label="Goes to" htmlFor={`t${i}-h`}>
                  <input id={`t${i}-h`} value={t.href} placeholder={d.href} maxLength={300} onChange={(e) => setTile(i, "href", e.target.value)} />
                </Field>
              </fieldset>
            );
          })}
        </div>
      </FormSection>

      <FormSection title="Featured collections" description="Each ticked collection shows as a row of products on the home page, after New Arrivals.">
        {collections.length === 0 ? (
          <p className="text-sm text-muted">
            No collections yet. <Link href="/admin/collections/new" className="text-maroon underline underline-offset-4">Create one</Link>.
          </p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {collections.map((col) => {
              const on = c.featured_collection_ids.includes(col.id);
              return (
                <label key={col.id} className="flex cursor-pointer items-center gap-3 rounded-[12px] border border-sand/80 px-4 py-3 has-[:checked]:border-maroon has-[:checked]:bg-maroon/[0.03]">
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={() => setC((d) => ({ ...d, featured_collection_ids: on ? d.featured_collection_ids.filter((x) => x !== col.id) : [...d.featured_collection_ids, col.id] }))}
                  />
                  <span className="min-w-0 flex-1 text-sm">
                    {col.name}
                    <span className="block text-xs text-muted">
                      {col.count} product{col.count === 1 ? "" : "s"}
                      {!col.active && " · hidden, won't show"}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        )}
      </FormSection>

      <FormSection title="Website wallpaper" description="The background behind every page of the shop (the damask pattern today). Cards, the header and banners stay on top of it.">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] [&>*]:min-w-0">
          <div className="space-y-5">
            <fieldset>
              <legend className="mb-2 text-[13px] font-medium">Style</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {(
                  [
                    ["default", "Built-in damask", "The boutique's pattern"],
                    ["pattern", "My pattern", "An uploaded picture, repeated like wallpaper"],
                    ["photo", "My photo", "One uploaded picture filling the screen"],
                    ["none", "Plain", "No wallpaper, plain ivory"],
                  ] as const
                ).map(([mode, title, hint]) => (
                  <label key={mode} className="flex cursor-pointer items-start gap-3 rounded-[12px] border border-sand/80 px-4 py-3 has-[:checked]:border-maroon has-[:checked]:bg-maroon/[0.03]">
                    <input type="radio" name="wallpaper-mode" checked={w.mode === mode} onChange={() => setWall({ mode })} className="mt-0.5" />
                    <span className="text-sm">
                      {title}
                      <span className="block text-xs text-muted">{hint}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
            {(w.mode === "pattern" || w.mode === "photo") && (
              <div className="space-y-2">
                <UploadButton label={w.image_url ? "Upload a different picture" : "Upload picture"} width={w.mode === "photo" ? 2400 : 1600} onUploaded={(url) => setWall({ image_url: url })} />
                <p className="text-xs text-muted">{w.mode === "pattern" ? "Use a seamless tile (its edges match), light in colour so text stays easy to read." : "Choose a calm, light picture: the shop's text sits on top of it."}</p>
              </div>
            )}
            {w.mode !== "none" && (
              <Field label={`Strength: ${w.strength}%`} htmlFor="wall-strength" hint="Lower is softer. The built-in damask is 45%.">
                <input id="wall-strength" type="range" min={0} max={100} step={5} value={w.strength} onChange={(e) => setWall({ strength: Number(e.target.value) })} className="w-full accent-[var(--color-maroon)]" aria-describedby="wall-strength-hint" />
              </Field>
            )}
            {w.mode === "pattern" && (
              <Field label={`Pattern size: ${w.size}px`} htmlFor="wall-size" hint="Width of one repeat of the picture.">
                <input id="wall-size" type="range" min={120} max={1600} step={20} value={w.size} onChange={(e) => setWall({ size: Number(e.target.value) })} className="w-full accent-[var(--color-maroon)]" aria-describedby="wall-size-hint" />
              </Field>
            )}
          </div>
          <figure>
            <div
              className="relative aspect-[4/3] overflow-hidden rounded-[14px] border border-sand bg-ivory"
              aria-label="Wallpaper preview"
              role="img"
            >
              {w.mode !== "none" && wallSrc && (
                <span
                  aria-hidden
                  className="absolute inset-0"
                  style={{
                    backgroundImage: `url("${wallSrc}")`,
                    backgroundSize: w.mode === "photo" ? "cover" : w.mode === "pattern" ? `${Math.round(w.size / 2)}px auto` : "662px auto",
                    backgroundPosition: w.mode === "photo" ? "center" : "0 0",
                    backgroundRepeat: w.mode === "photo" ? "no-repeat" : "repeat",
                    opacity: w.strength / 100,
                  }}
                />
              )}
              <div className="relative flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
                <p className="text-[11px] tracking-[0.3em] text-gold uppercase">Explore</p>
                <p className="font-display text-3xl text-ink">Shop by category</p>
                <div className="mt-2 flex gap-3">
                  {[0, 1, 2].map((n) => (
                    <span key={n} className="h-14 w-14 rounded-full border border-sand bg-cream/80" />
                  ))}
                </div>
              </div>
            </div>
            <figcaption className="mt-2 text-xs text-muted">Preview at half size. Save to see it on the shop.</figcaption>
          </figure>
        </div>
      </FormSection>

      <div className="sticky bottom-0 z-10 -mx-4 flex items-center justify-between gap-3 border-t border-sand bg-ivory/95 px-4 py-3 backdrop-blur md:-mx-8 md:px-8">
        <a href="/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[11px] tracking-[0.14em] text-muted uppercase hover:text-maroon">
          View home page <ExternalLink size={13} />
        </a>
        <button type="submit" className="btn-primary btn-sm" disabled={pending}>
          {pending ? "Saving…" : "Save home page"}
        </button>
      </div>
    </form>
  );
}
