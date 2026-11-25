# Amaris Admin — UI Guide

How the admin dashboard looks, taken from the storefront. **The website decides how the dashboard looks.**
Audit date: 2026-11-25. Source of truth for tokens: `src/app/globals.css` (Tailwind v4 `@theme`, there is no `tailwind.config`).

Status: **Approved 2026-11-25** (tokens in §9 added). §11 records the premium pass that followed.

---

## 1. Colours

All colours are Tailwind v4 theme tokens in `src/app/globals.css` → `@theme { … }`. Each one is usable as a utility (`bg-maroon`, `text-muted`, `border-sand` …) and as a CSS variable (`var(--color-maroon)`).
The file marks the palette as a **placeholder until the client sends brand colours**, so the dashboard must only use tokens: when the palette changes, the admin follows.

| Role | Token | Hex | Used on the site for |
|---|---|---|---|
| Page background | `ivory` | `#fbf7f1` | `body` background |
| Section tint / hover | `cream` | `#f4ece0` | image placeholders, menu hover rows |
| Border / divider | `sand` | `#e8dccb` | inputs, cards, table rows, header border |
| Text | `ink` | `#2b2a2c` | body text, headings |
| Muted text | `muted` | `#7a6d66` | secondary text, table headers, hints |
| Primary | `maroon` | `#6e1f2a` | primary buttons, links, focus ring, active chips |
| Primary dark | `maroon-dark` | `#350f10` | button hover, footer, admin sidebar |
| Accent | `gold` | `#b07a5c` | eyebrows, icons, dividers |
| Accent light | `gold-light` | `#eedccf` | highlights, notes, footer headings, text selection |
| Error / sale | `sale` | `#b3261e` | errors, sale badges, "Hot Deals" |
| Success | `success` | `#2f6b3b` | success messages, WhatsApp, "Delivered" |
| Surface | — | `#fff` | cards, tables, inputs (`.card`, `.table-amaris`, form base) |

Other colours already in use:
- Shadows use `rgba(43,42,44,…)`, which is `ink` (see §4).
- The home page's burgundy banners hard-code `#d9a587`, `#f8f1ea`, `#ecc7ae`, `#e3bfa6` and `#350f10` (`src/app/(shop)/page.tsx`, `src/app/(shop)/search/page.tsx`, `src/components/home/AtelierBanner.tsx`). The admin will **not** copy these.
- Razorpay Checkout uses `#6e1f2a` (`src/components/checkout/CheckoutForm.tsx`), which is `maroon`.

**Missing for the dashboard:** a warning colour (low stock, awaiting payment, due soon), and a border dark enough for form controls (see §8).

### Contrast (WCAG 2.1)
| Pair | Ratio | Verdict |
|---|---|---|
| ink on ivory | 13.4 | ✅ AA/AAA |
| muted on ivory / white | 4.7 / 5.0 | ✅ AA for normal text |
| maroon on ivory | 10.4 | ✅ |
| white on maroon | 11.1 | ✅ |
| ivory on maroon-dark | 16.0 | ✅ |
| gold-light on maroon-dark | 12.9 | ✅ |
| sale on white | 6.5 | ✅ |
| success on white | 6.4 | ✅ |
| **gold on ivory / white** | **3.4 / 3.6** | ⚠️ large text (≥ 18.66px bold or 24px) and icons only. The site uses it for small "eyebrow" labels; the admin won't. |
| **sand on white** (input borders) | **1.35** | ❌ fails the 3:1 rule for form-control outlines (WCAG 1.4.11) |

---

## 2. Typography

Loaded with `next/font/google` in `src/app/layout.tsx`, and exposed as CSS variables on `<html>`:

| Role | Font | Weights / styles | Variable → token | Utility |
|---|---|---|---|---|
| Display (headings) | **Cormorant Garamond** | 400, 500, 600, normal + italic | `--font-cormorant` → `--font-display` | `font-display` |
| Body / UI | **Jost** | 300, 400, 500 | `--font-jost` → `--font-sans` | default (`body`) |

Base rules (`globals.css` `@layer base`): `body` is Jost and ink; `h1, h2, h3` are display, weight 500, line height 1.15; `legend` is 0.8rem, weight 500, letter spacing 0.12em, uppercase.

Type patterns used across the site:
| Pattern | Classes | Where |
|---|---|---|
| Page title | `font-display text-4xl` (36px) to `text-5xl` | auth cards, page headers |
| Section title | `.section-title` → display, `clamp(1.8rem, 3vw, 2.6rem)`, tracking 0.04em, uppercase | home sections |
| Eyebrow | `.eyebrow` → 0.72rem, tracking 0.22em, uppercase, gold, weight 500 | above titles |
| Small caps label | `text-[11px] tracking-[0.18em] uppercase` (also 10px / 0.3em, 12px / 0.14em) | menus, buttons, badges |
| Body | `text-sm` (14px), `leading-relaxed` | most text |
| Hint | `text-xs text-muted` | form hints, captions |
| Button | 0.8rem, weight 500, tracking 0.16em, uppercase | `.btn-*` |
| Table header | 0.72rem, weight 500, tracking 0.12em, uppercase, muted | `.table-amaris th` |

**Admin type scale** (built only from the patterns above):
- page title: `font-display text-3xl` (30px);
- card / section title: `font-display text-2xl`;
- KPI value: `font-display text-4xl`;
- labels: small caps label in `muted` (not gold, see contrast);
- body: `text-sm`;
- table text: 0.9rem (`.table-amaris`).

---

## 3. Spacing & layout

- Spacing scale: Tailwind's default 4px scale (`p-1` = 4px … `p-10` = 40px). The site uses `gap-1.5`–`gap-10`, `p-5`/`p-6`/`p-8`/`p-10`, `py-16`/`py-24` for sections.
- Container: `.container-x` → max-width 1320px, padding 1rem (2rem from 768px).
- Breakpoints: Tailwind defaults (`sm` 640, `md` 768, `lg` 1024, `xl` 1280). The storefront switches to the desktop nav at `lg`.
- Current admin shell (`src/app/admin/(panel)/layout.tsx`): sidebar 220px from `md`; content padding `p-5 md:p-10`, `space-y-6`.
- Forms: `space-y-4` between fields, label hint `mb-1` / `mb-1.5`.
- Admin background: plain ivory. The damask wallpaper is switched off for any page containing `.admin-area` (`globals.css`, `body:has(.admin-area)::before`).

---

## 4. Shape & depth

| Item | Value | Where |
|---|---|---|
| Radius: controls, buttons, chips, popovers, badges | **3px** (`rounded-[3px]`) | `.btn-*`, `.chip`, form base, AccountMenu, badges |
| Radius: product photos | **6px** (`rounded-[6px]`) | `ProductCard.tsx` |
| Radius: round icon buttons | `rounded-full` | footer social icons |
| Border | 1px `sand` (80% opacity on the header) | cards, inputs, tables, header |
| Shadow: popover | `0 24px 48px -24px rgba(43,42,44,0.35)` | `AccountMenu.tsx` |
| Shadow: sticky bar when scrolled | `0 10px 30px -18px rgba(43,42,44,0.35)` | `HeaderShell.tsx` |
| Shadow: cards on hover | `0 20px 40px -20px` / `0 24px 40px -24px rgba(43,42,44,0.25)` | home cards |
| Shadow: drawer | `shadow-xl` | `MobileMenu.tsx` |
| Hover | colour change to `maroon` / `maroon-dark`; rows `hover:bg-cream`; images `scale-[1.04]` over 700ms | menus, buttons, cards |
| Focus | inputs: `border-maroon` + 3px ring of maroon at 12% (`globals.css`). **Buttons and links have no custom focus style** (browser default). | form base |
| Disabled | `opacity: 0.5`, `cursor: not-allowed` | `button:disabled` |

---

## 5. Components already on the site

| Component | File | Notes for the admin |
|---|---|---|
| Buttons: `.btn-primary`, `.btn-outline`, `.btn-light` | `src/app/globals.css` | Reuse. No small size or danger variant (§9). |
| Form controls (input, select, textarea, checkbox/radio accent) | `globals.css` `@layer base` | Reuse as-is; stronger border in admin (§9). |
| Labelled field + error/success message | `src/app/(shop)/(auth)/AuthForm.tsx` | Pattern for admin fields: label `text-xs text-muted`, error `text-sm text-sale` with `role="alert"`. |
| Card | `.card` (globals) · `AuthCard` in `AuthForm.tsx` | White, sand border. |
| Chips (size picker, filters) | `.chip`, `.chip-active` (globals) | Filter pills, segmented filters. |
| Table | `.table-amaris` / `.admin-area table` (globals) | Base for DataTable. |
| Status badge | `src/components/account/OrderStatusLabel.tsx` | Tones per status; reuse for orders. |
| Product badges (Sale, New) | `src/components/product/ProductCard.tsx` | 10px uppercase, 3px radius. |
| Popover / dropdown | `src/components/layout/AccountMenu.tsx` | Closes on outside click / Esc; pattern for the admin profile menu. |
| Drawer + overlay | `src/components/layout/MobileMenu.tsx` | Portal, `bg-ink/40` overlay, `inert` when closed, body scroll lock, 300ms slide. Pattern for the mobile sidebar. |
| Accordion | `MobileMenu.tsx` (grid-rows transition) | Sidebar groups. |
| Tabs (segmented) | `src/components/product/SizingPicker.tsx` | `role="tablist"`, ink border, active = ink background. |
| Native dialog | `src/components/product/SizeChart.tsx` | Unstyled; base for Modal/ConfirmDialog. |
| Select (auto width) | `src/components/product/SortSelect.tsx` | Filter dropdowns. |
| Loading line | `src/components/layout/NavProgress.tsx` | Rose-gold top line on navigation; reuse in the admin top bar. |
| Inline feedback | `src/components/ui/CopyButton.tsx` | "Copied" with `aria-live`. |
| Page header | `src/components/layout/PageHeader.tsx` | Storefront banner; not for admin. |
| Logo | `src/components/layout/Logo.tsx` | `light` variant for dark backgrounds. |
| Pagination | `src/components/admin/Pagination.tsx` (admin, Phase 0) | Unstyled; restyle with tokens. |
| Image uploader | `src/components/admin/ImageUploader.tsx` (admin, Phase 0) | Unstyled; restyle. |

**Not on the site** (to be built for the admin in the same style): toasts, skeleton loaders, empty states, error states (`loading.tsx` / `error.tsx` don't exist anywhere), styled modal / confirm dialog, sidebar, top bar, stat card, data table with sorting / selection, file drop zone.

**Icons:** `lucide-react` only, line icons with `strokeWidth` 1.25–1.6 (mostly 1.4–1.5), sizes 13–24px. The admin uses the same, at 16–20px, stroke 1.5.

---

## 6. Motion

- No animation library for UI: **framer-motion** is only used in the home hero (`HeroEditorial.tsx`). The admin won't use it.
- Durations: 150–200ms (inputs, popovers), 300ms (drawer, accordion, icons), 500–700ms (header, image hovers).
- Easing: mostly `ease-out` and `cubic-bezier(0.22, 1, 0.36, 1)` (soft ease-out); the hero uses `cubic-bezier(0.77, 0, 0.18, 1)`.
- Scroll reveals, word reveals and parallax respect `prefers-reduced-motion` (`globals.css`).
- **Admin rule:** 150–300ms colour, opacity and transform transitions only, with the soft ease-out. No scroll reveals, and nothing that delays data. Reduced motion is respected.

---

## 7. Logo & brand assets

- Logo files: `public/Assets/logo-dark.png` and `logo-light.png`, served from Cloudinary (`amaris/site/logo-dark`, `amaris/site/logo-light`) through `cloudImage()` in `src/lib/images.ts`. Component: `src/components/layout/Logo.tsx`.
- **Favicon:** `src/app/favicon.ico` is 25,931 bytes, the size of the default Next.js icon. It looks like **no brand favicon has been added yet** (not an admin task; noted as a gap).
- Damask wallpaper: Cloudinary `amaris/site/damask-white` (off in the admin).

---

## 8. The admin dashboard: how it uses all of this

### Layout
```
┌──────────────┬──────────────────────────────────────────────┐
│ [logo-light] │ Page title (display)     [search]  [● admin] │ ← top bar: ivory/95 + blur, sand border,
│              ├──────────────────────────────────────────────┤   NavProgress line, sticky
│ Overview     │                                              │
│ Orders       │   content on ivory, cards in white           │
│ Production   │                                              │
│ Products     │                                              │
│ …            │                                              │
│ View store ↗ │                                              │
└──────────────┴──────────────────────────────────────────────┘
  sidebar: maroon-dark (like the footer), 240px, from lg (1024px)
```
- **Sidebar:** `bg-maroon-dark`, light logo at the top (`Logo light`), links in small caps label style in `ivory/75`. Hover and active go to white; the active item has a `gold-light` left bar and a `bg-white/10` row. Groups (Catalogue, Marketing) are accordions using the MobileMenu pattern.
- **Top bar:** same look as the site header (`bg-ivory/95 backdrop-blur`, `border-sand/80`). It holds the page title (`font-display text-2xl`), a global search (input with a lucide `Search` icon), and a profile menu (AccountMenu pattern with the admin email and Sign out).
- **Below `lg`:** the sidebar becomes a drawer (MobileMenu pattern: hamburger in the top bar, overlay, focus kept inside, Esc closes).
- **Content:** `max-w-[1320px]`, `p-4 md:p-8`, `space-y-6`.

### Components to build (in `src/components/admin/`, all from tokens)
| Component | Look |
|---|---|
| `Button` sizes | `.btn-primary` / `.btn-outline` plus new `.btn-sm` and `.btn-danger` (§9) |
| `Field` | label (`text-xs text-muted`) + control + hint + error (`text-sale`, `aria-describedby`) |
| `Card` / `Panel` | `.card` + `rounded-[3px]` (`rounded-ui`) + header in `font-display text-2xl` |
| `StatCard` | card; label in small caps muted; value `font-display text-4xl`; change vs last period in success / sale |
| `DataTable` | `.table-amaris` in a card. Sortable headers (`aria-sort`), row hover `bg-cream/60`, selectable rows (checkbox accent maroon), sticky header. **Below `md`: each row becomes a stacked card.** |
| `FilterBar` | search input + `SortSelect`-style selects + `.chip` toggles |
| `StatusBadge` | the `OrderStatusLabel` tones, extended for product / payment / production / review statuses |
| `Toaster` | bottom-right (bottom-centre on mobile). White card with a 3px left bar in success / sale / warning, popover shadow, `role="status"` / `aria-live="polite"`, auto-hide after 5s, close button. |
| `Modal` / `ConfirmDialog` | native `<dialog>` (focus trap, Esc), ivory panel, popover shadow, `bg-ink/40` backdrop; destructive confirm uses `.btn-danger` |
| `Skeleton` | `bg-cream animate-pulse rounded-ui`; one per page shape (table rows, stat cards, form) in each `loading.tsx` |
| `EmptyState` | centred lucide icon in gold (large, allowed), `font-display text-2xl` title, muted text, `.btn-outline` action |
| `ErrorState` | same layout, `sale` icon, "Try again" (`reset()`), used by `error.tsx` |
| `ImageUploader` | drop zone with dashed `sand-strong` border on `cream`, thumbnails at 6px radius (like product cards), drag or up/down to reorder, "Main" badge |
| `Pagination` | `.chip` page buttons + previous / next |
| `Tabs` | `SizingPicker` tablist style |

### Accessibility rules
- Every control has a visible `<label>`. Errors are linked with `aria-describedby` and announced with `role="alert"`.
- **Focus:** a visible `:focus-visible` outline on every link, button and control in the admin: 2px `maroon`, 2px offset (`globals.css`, scoped to `.admin-area`).
- Keyboard: sidebar, drawer, menus, dialogs, table selection and reordering all work without a mouse. Esc closes overlays, and focus returns to the trigger.
- Colour is never the only signal: badges have text, and sort direction has an icon and `aria-sort`.
- Small text uses `ink` or `muted` only, never `gold`.
- Touch targets are at least 40×40px on mobile.

---

## 9. Token additions — **need your OK**

These go into the same file the site uses (`src/app/globals.css`). They're all **new names**, so nothing on the storefront changes.

```css
@theme {
  /* status colour the site doesn't have yet: low stock, awaiting payment, due soon */
  --color-warning: #8a5a00;        /* 5.9:1 on white */
  --color-warning-light: #fbf3e0;
  /* border for form controls in the admin: 3.6:1 on white (sand is 1.35:1) */
  --color-sand-strong: #968474;
  /* names for values the site already repeats by hand */
  --radius-ui: 3px;                /* rounded-ui  = today's rounded-[3px] */
  --radius-media: 6px;             /* rounded-media = product photos */
  --shadow-pop: 0 24px 48px -24px rgb(43 42 44 / 0.35);   /* popovers, dialogs, toasts */
  --shadow-bar: 0 10px 30px -18px rgb(43 42 44 / 0.35);   /* sticky bars */
  --ease-soft: cubic-bezier(0.22, 1, 0.36, 1);
}
@layer components {
  .btn-sm { padding: 0.55rem 1rem; font-size: 0.72rem; letter-spacing: 0.14em; }
  .btn-danger { background: var(--color-sale); color: #fff; }   /* + same base as .btn-primary */
  .admin-area :focus-visible { outline: 2px solid var(--color-maroon); outline-offset: 2px; }
  .admin-area input…, select, textarea { border-color: var(--color-sand-strong); }
}
```
The existing `.admin-area` rules in `globals.css` (fieldset, submit button, nav links) get replaced by the components above as each page is rebuilt.

## 10. Things noticed that aren't admin tasks
- No brand favicon yet (§7).
- The storefront's `.eyebrow` uses gold for small text, at 3.4:1 contrast (below AA). This is worth fixing in the storefront design later.
- Storefront input borders have the same 1.35:1 issue. The admin fixes it for itself only, because the storefront design is yours.

## 11. Premium pass (2026-11-25, from the reference dashboard the client liked)

Taken from the reference, adapted to Amaris data and kept in the site style (3px corners, maroon/gold, Cormorant):

| Pattern | Where | Notes |
|---|---|---|
| Collapsible sidebar (icons only, 76px) | `AdminFrame.tsx` | Toggle beside the logo; remembered per browser (localStorage, optional). Labels become tooltips + screen-reader text. |
| Count badge in the sidebar | Orders = paid orders waiting to dispatch | gold-light pill; a dot when collapsed. |
| Search with keyboard shortcut | top bar | `/` focuses search; `<kbd>` hint inside the field. |
| Profile with name | top bar | name + "Amaris Boutique", email in the menu. |
| List toolbar | `products/ProductToolbar.tsx` | view toggle (list / grid), search (applies after a pause), category, show, sort, **Filters** button revealing stock / shown-in / stitching, active-filter count, Clear filters. State in the URL. |
| Sortable headers | `DataTable` `sort` prop | arrow icons, `aria-sort`. |
| Product cell | products list | 48×64 photo (6px radius) + title without the code + "SC 11113 · Category". |
| Stock bar | `products/StockBar.tsx` | green in stock, amber low (≤ 3), red sold out; sizes listed underneath; "Made to order" for custom / pre-order. |
| Instant switches | `Switch.tsx` (`InstantSwitch`) | Live and Stitching save on click, roll back on error, toast + activity log. |
| Grid view | products `?view=grid` | photo-first cards (boutique-friendly). |

Skipped from the reference: messages and notifications (no data behind them yet), Integrations / Security pages (not in the plan), pill-shaped controls (site uses 3px corners), row checkboxes (come with bulk actions in Phase 2).

Responsive rule update: **data tables switch to cards below 1024px** (was 768px), because product and order tables have too many columns for tablets. In card mode the first column leads the card without a label.

## 12. Premium redesign (2026-11-25)

Same colours and fonts as the shop; only presentation changed (no data or logic).

| Element | Treatment |
|---|---|
| Background | The shop's damask wallpaper behind the admin at 22% (shop uses 45%); white cards sit on top |
| Sidebar | Burgundy with a faint damask (`.damask-dark`), gold hairline dividers, lotus beside group names, active item = gold bar + gold icon, profile card with "View store" at the bottom |
| Top bar | Translucent ivory with blur, "Amaris ✿ Section" breadcrumb, pill-shaped search with `/` hint |
| Page header | Lotus + small-caps eyebrow, large Cormorant title (2.75rem), one-line description |
| Overview | Burgundy welcome banner (greeting by IST time, date, one-sentence summary, quick actions), stat cards with gold icon circles |
| Cards | 10px corners, soft shadow (`--shadow-card`), lift on hover for links (`--shadow-lift`) |
| Tables | Cream header band, taller rows, no last-row border |
| Figures | `.stat-number`: Jost light with lining, tabular digits |
| Empty states | Icon in a gold-light circle with a soft ring |
| Motion | Page sections fade up in turn (`.admin-enter`); off for reduced motion |
| Login | Split screen: the shop's campaign photo with a quote, sign-in card on ivory |

Shared lotus mark: `src/components/ui/Lotus.tsx` (also used by the shop's announcement bar).
