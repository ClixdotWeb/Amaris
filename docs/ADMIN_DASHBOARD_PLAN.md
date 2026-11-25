# Amaris Boutique — Admin Dashboard Plan

Status: **Approved 2026-11-25.** Phases 0–2 built (see §10). UI rules: docs/ADMIN_UI_GUIDE.md. Testing: no test frameworks (question B unanswered); each phase is checked with tsc, eslint and a scripted click-through.
Date: 2026-11-25

---

## 0. Decisions (answers from 2026-11-25)

| # | Topic | Decision | Effect on the plan |
|---|---|---|---|
| 1 | Database | **Postgres on Coolify, connected after the dashboard is finished.** | All data access goes through one layer (`src/lib/db/`) with a local development store now and a Postgres implementation later. Security is enforced in server code. See §3.7. |
| — | Hosting | **App also on Coolify** (same server as Postgres). | Rate limiting and background jobs can use a Redis container on the same server. Vercel-only features are avoided. |
| 2 | Images | **Everything on Cloudinary.** | Admin uploads go straight to Cloudinary (signed upload). The Supabase Storage bucket is no longer used for new images. |
| 3 | Catalogue | **Client enters products in the dashboard.** `catalog.json` is not imported. | No import script in Phase 0. Product CSV import is still built (Phase 3) in case it's wanted later. Storefront keeps preview data until real products exist. |
| 4 | Variants | **Stock per size × colour.** | Full variant grid (size × colour) with stock, SKU and optional price per variant. |
| 5 | Sale price | **Sale price + optional start/end dates.** | `sale_price`, `sale_starts_at`, `sale_ends_at` on products (and optional per variant). |
| 6 | Shop by size | **Size filter + "Shop by size" menu.** | Size groups (Women XS–XXL, Kids ages) managed in the dashboard; filter on every listing page. |
| 7 | Order statuses | **Yes:** paid = confirmed, processing = packed, dispatched = shipped, add `returned`. | Labels change, enum gets `returned`. |
| 8 | GST | **Later.** Leave room for it. | Nullable GST fields (rate, HSN, price-includes-GST) on settings, categories and order items; invoice shows the breakup only when filled. |
| 9 | Reviews | **Yes.** | Storefront review form + display, and moderation in the dashboard. |
| 10 | COD | **Yes.** | `payment_method` on orders, COD fee/limits in settings, COD flow at checkout, "collect on delivery" status in admin. |
| 11 | 2FA | **No.** | — |
| 12 | Rate limiting | Asked for the better option → **`rate-limiter-flexible` with Redis on Coolify** (in-memory in development). | No outside account. See §4. |
| 13 | Email templates | **Editable in the admin.** | `email_templates` table + editor with placeholders and preview. |
| 14 | Admin styling | **Basic styling now, matching the website** (same fonts, colours, buttons); fuller design later. | Admin uses the existing Tailwind tokens and classes (`btn-primary`, `chip`, `eyebrow`, maroon/gold/ivory). |
| 16 | Admin users | **One role: `admin`, for the client. No superadmin.** | Every admin account has full access to the dashboard. Admins can add/remove other admin accounts. No role hierarchy or permission matrix; the guard checks "is admin". |
| C | Development database | **No database during the dashboard build. No Supabase project for testing.** | The dashboard is built and tested on a **local development store** (§3.7). The real database (Postgres on Coolify) is connected after the dashboard is finished. |
| D | Storefront switch-over | **Deferred.** | Decide before launch. |
| 17 | Refunds | **Issued from the admin through Razorpay.** | Razorpay Refunds API; COD refunds recorded manually. |
| 18 | Store info | **Editable in settings.** | `config/site.ts` becomes the fallback; values read from settings. |
| 19 | Categories | **Database is the single source** for categories and menu groups. | `navigation.ts` becomes a fallback only. |
| 20 | Build order | **Approved.** | Phase 0 changes (see §10). |
| — | Phase 2 notes (2026-11-25) | Sale price replaces “original price”; product codes; shared codes | Existing items with an original price were converted: price = original, sale_price = what customers paid. `compare_at_price` stays only for the storefront preview data. Product codes must be unique when set or changed; a few catalogue items share a code (e.g. three “SC 5104”) and can still be saved unchanged. Stock per size/colour uses `size ""` for no size and `colour null` for no colour. |
| — | Stitching on/off (requested 2026-11-25) | **Admin can switch the stitching add-on on or off per unstitched product.** | Switch in the product form and in the products list (saves at once, logged), plus a “Stitching on / Fabric only” filter. Uses the existing `products.stitching_available`; the storefront and checkout already respect it. |

---

## 1. Findings (Phase 1)

### 1.1 Tech stack
| Item | Found |
|---|---|
| Framework | Next.js **15.5.29**, **App Router** (`src/app`), React 19.1 |
| Language | TypeScript (strict, `@/*` → `src/*`) |
| Styling | Tailwind CSS v4 (`globals.css` tokens: `ink`, `maroon`, `gold`, `ivory`…). **Per CLAUDE.md the developer owns all visual design; admin pages are plain semantic HTML.** |
| UI libraries | `lucide-react` (icons), `framer-motion` (storefront animation). No component library. |
| State | React state + Context. Cart = `CartProvider` in `localStorage`. No Redux/Zustand/React Query. |
| Validation | `zod` v4 |
| Package manager | npm (`package-lock.json`) |
| Dev note | `npm run dev` uses Turbopack, which currently fails to resolve `next/font/google` on this Windows machine; `npx next dev` (webpack) works. |

### 1.2 Data layer
- **Supabase (Postgres)** via `@supabase/ssr` + `@supabase/supabase-js`. No ORM: queries are written with the Supabase query builder.
- Schema: `supabase/migrations/0001_init.sql`, `0002_product_colours.sql`, `0003_premium.sql`; seed in `supabase/seed.sql`. Types mirrored by hand in `src/types/index.ts`.
- Two clients (`src/lib/supabase/server.ts`): `createClient()` (user session, **RLS applies**) and `createAdminClient()` (service role, **bypasses RLS**, used for orders/payments/tracking).
- **Supabase is not connected yet.** `.env.local` has only Cloudinary keys, so the site runs in **preview mode** (`USE_MOCK`, `src/lib/data/mode.ts`).
- **The real catalogue is a static file**: `src/lib/data/catalog.json` holds **322 products** (181 unstitched suits, 66 ready made, 57 sarees, 12 running material, 5 home linen, 1 co-ord set; 0 frocks/kurtis, 0 kids), turned into `ProductWithRelations` by `src/lib/data/mock.ts`. **None of these are in a database yet.**
- Categories are defined **twice**: `src/config/navigation.ts` (code) and the `categories` table (seed). Slugs must match.
- Settings: one JSON row in `settings` (stitching charge, shipping per item Kerala/India, free-shipping threshold, international rates by country, `cod_enabled`).

### 1.3 Existing entities
| Entity | Table | Key fields | Relations |
|---|---|---|---|
| Profile (customer/admin) | `profiles` | `id` (= auth user), `full_name`, `phone`, `is_admin` bool, `created_at` | 1–1 `auth.users`. **No email column** (email lives in `auth.users`). |
| Category | `categories` | `slug`, `name`, `product_type` enum, `description`, `sort_order` | 1–N products. No image, no active flag. |
| Product | `products` | `slug`, `name`, `description`, `category_id`, `product_type`, `price`, `compare_at_price`, `sizes text[]`, `stock_qty numeric`, flags `is_preorder/is_new_arrival/is_hot_deal/is_premium/is_active`, `stitching_available`, `stitching_charge`, `min_metres`, `metre_step`, `fabric`, `care_instructions`, `colours jsonb` | N–1 category; 1–N variants, images |
| Variant | `product_variants` | `product_id`, `size`, `stock_qty` | **Size only**, unique (product, size). No colour, SKU or price. |
| Image | `product_images` | `storage_path`, `url`, `alt`, `sort_order` | N–1 product |
| Address | `addresses` | name, phone, line1/2, city, state, pincode, country, `is_default` | N–1 auth user |
| Order | `orders` | `order_number` (`AMR1001…`), `user_id`, email, phone, `shipping_address jsonb`, `status`, `subtotal`, `stitching_total`, `shipping_fee`, `total`, `is_international`, Razorpay ids, `carrier`, `consignment_number`, `dispatched_at`, `policies_accepted_at`, `customer_notes`, `admin_notes` | 1–N order_items |
| Order item | `order_items` | snapshot: `product_name`, `product_type`, `image_url`, `unit_price`, `quantity`, `length_metres`, `size`, `colour`, `stitching`, `stitching_charge`, `sizing jsonb` (size or measurements), `dispatch_type`, `line_total` | N–1 order, product (set null) |
| Settings | `settings` | single row `data jsonb` | — |

**Not present:** Collection (only boolean flags), Coupon, Review, Banner/CMS, Cart (browser only), Stock movement, Activity log, Roles, Refund, Wishlist.

Enums: `product_type` (ready_made, unstitched, custom_made, running_material), `dispatch_type` (in_stock, made_to_order), `order_status` (pending_payment, paid, processing, dispatched, delivered, cancelled, refunded).

### 1.4 Product structure in detail
- **Money:** integer **paise** everywhere (`₹1 = 100`). Admin forms take ₹ and convert (`rupeesToPaise`).
- **Price / sale price:** `price` is the selling price; `compare_at_price` is the struck-through "original" price. There is no separate sale price, sale window or discount %.
- **Sizes:** `products.sizes text[]`. Ready made → per-size stock in `product_variants`. Custom made → list of offered sizes (defaults: `STANDARD_SIZES` XS–3XL or `KIDS_SIZES` 1-2Y…9-10Y in `config/shop.ts`); customer picks a size **or** types measurements (`MEASUREMENT_FIELDS`). Unstitched → optional stitching add-on with the same size/measurement choice.
- **Colours:** `products.colours jsonb` = `[{name, hex, hex2, image_index}]`, purely a picker that points at a photo. **Stock is not tracked per colour, and size × colour variants do not exist.** 244 of 322 catalogue products have colour options.
- **Stock:** `products.stock_qty` (pieces, or **metres** for running material) or per-size `product_variants.stock_qty`. Stock is decremented after payment by SQL function `decrement_stock_for_order`. **Never restored** on cancel/refund.
- **SKU:** none. Product codes (e.g. `SC 11113`) exist only inside names/slugs.
- **Images:** see 1.7.
- **"Shop by size":** does not exist. There is no size filter on listings and no size groups.
- **Collections:** New Arrivals / Hot Deals / Premium are boolean flags with their own pages. The header groups categories in `navigation.ts` (code), not in the DB.
- **Size chart:** a single women's chart hard-coded in `config/shop.ts` (`SIZE_CHART`).

### 1.5 APIs, server actions and route handlers
| Kind | Path / name | What it does | Auth |
|---|---|---|---|
| Route | `POST /api/checkout/create-order` | Re-prices cart on the server, inserts `pending_payment` order + items (service role), creates Razorpay order | logged-in user |
| Route | `POST /api/checkout/verify` | Verifies Razorpay signature, marks paid (idempotent), decrements stock, emails | logged-in owner |
| Route | `POST /api/webhooks/razorpay` | Backup `payment.captured` handler | HMAC signature |
| Route | `GET /auth/callback`, `POST /auth/signout` | Supabase auth flow | — |
| Action | `login`, `signup`, `requestPasswordReset`, `updatePassword` | Supabase Auth | public |
| Action | `saveAddress`, `deleteAddress`, `setDefaultAddress` | customer addresses | user (RLS) |
| Action | `trackOrder` | order number + email lookup (service role) | public |
| Action | `saveProduct`, `deleteImage`, `archiveProduct` | admin product CRUD + upload | `requireAdmin()` |
| Action | `markDispatched`, `updateOrderStatus` | admin orders | `requireAdmin()` |
| Action | `saveSettings` | admin settings | `requireAdmin()` |

### 1.6 Auth
- **Supabase Auth** (email + password, email confirmation, password reset).
- Role = `profiles.is_admin` boolean, set manually with SQL. An RLS function `is_admin()` gates catalogue/order writes, and a policy stops users promoting themselves.
- `middleware.ts` → `updateSession` only checks **logged in** for `/account`, `/checkout`, `/admin`. The admin role is checked in `admin/layout.tsx` and at the top of each admin action (`requireAdmin`). There are no admin API routes yet.
- In preview mode `/admin/*` is rewritten to `/admin-preview`.

### 1.7 Images
- **Storefront (preview):** every picture is served from **Cloudinary** (`src/lib/images.ts`, cloud `slzv1rui`), uploaded by `scripts/upload-to-cloudinary.mjs` from `public/Assets/...`.
- **Admin upload (DB mode):** `saveProduct` uploads files to the **Supabase Storage** bucket `product-images` through a Server Action (body limit raised to 20 MB in `next.config.ts`). No type/size check, no resizing, no reordering, no main-image choice (main = lowest `sort_order`), no thumbnails (`thumb_url` is not a DB column).
- ⇒ **Two image systems.** This needs a decision (Open question 2).

### 1.8 Checkout and payment
- Razorpay (INR). Flow: cart (localStorage) → `/checkout` (login required, address + "verify address/PIN/phone" + policy consent) → `create-order` → Razorpay Checkout → `verify` (+ webhook backup) → `/order/success/[id]`.
- Prices, stitching charge, stock and shipping are recomputed on the server (`lib/checkout.ts`, `lib/pricing.ts`).
- Emails through Resend (plain text; logged to the console without a key): order confirmation (+ copy to `ADMIN_NOTIFY_EMAIL`) and dispatch with the consignment number.
- **COD:** not built (`cod_enabled` exists, form disabled). **Refunds:** not built. **GST breakdown:** invoice shows GSTIN only; tax split is a TODO pending the accountant.
- `pending_payment` orders that are never paid are never cleaned up.

### 1.9 Folder structure (important parts)
```
src/
  app/
    (shop)/            storefront pages (home, shop/[category], product/[slug], cart, checkout, account, policies…)
    admin/             layout (requireAdmin) · page (dashboard) · orders/ · products/ · settings/
    admin-preview/     shown instead of /admin in preview mode
    api/checkout/…     create-order, verify
    api/webhooks/razorpay
    auth/              callback, signout
  components/          layout/, home/, product/, cart/, checkout/, account/, ui/
  config/              site.ts, navigation.ts, shop.ts
  lib/
    supabase/          client, server (RLS + service role), middleware
    data/              products, orders, settings, mock, catalog.json, mode
    auth.ts checkout.ts pricing.ts validation.ts razorpay.ts email.ts images.ts format.ts
  types/index.ts
  middleware.ts
supabase/migrations/   0001_init, 0002_product_colours, 0003_premium
scripts/               upload-to-cloudinary.mjs
```

### 1.10 Gaps and risks
**Blocking**
1. **No database connected; the real catalogue lives in `catalog.json`.** The dashboard is useless until Supabase is set up and the 322 products are imported (with Cloudinary image URLs and colours).
2. **Two image systems** (Cloudinary vs Supabase Storage).

**Correctness bugs in the existing admin** (fix as part of this work)
3. Dashboard "revenue today" counts cancelled and refunded orders (`neq pending_payment` only).
4. Low-stock list ignores per-size variants, so sized products never appear.
5. `saveProduct` deletes all variants and re-inserts them (not atomic; a failure loses stock). It also **never saves `colours`** (no colour UI), so editing an imported product would leave colours untouched but un-editable.
6. `updateOrderStatus` accepts any string as status (no zod) and allows any transition (e.g. delivered → pending_payment). Setting "refunded" does not refund money or restore stock.
7. Stock is never returned on cancel/refund.
8. Admin order list is capped at 100 with no pagination; product list has no pagination.

**Security**
9. Middleware only checks "logged in" for `/admin`; the role check is per page/action. OK today (every action calls `requireAdmin`), but easy to forget on new code → plan a single guard + lint/test.
10. `requireAdmin()` makes 2 auth round-trips per call; fine, but each admin action should also rely on RLS (they use the RLS client: good).
11. No rate limiting on login, signup, password reset or track-order.
12. Uploads: no MIME/size validation; filenames only sanitised.
13. Admin access is a single `is_admin` flag set by hand in SQL; there is no way to add admins from the app.

**Data model limits**
14. No SKU, no size × colour variants, no per-colour stock.
15. Order statuses don't include confirmed/packed/returned.
16. Customer email isn't in `profiles`, so listing customers needs the service role (or a column synced by trigger).
17. Homepage hero, announcement bar and category photos are hard-coded in code.
18. Categories duplicated in code and DB.

---

## 2. What the dashboard needs (Phase 2)

Legend: ✅ EXISTS · 🛠 NEEDS CHANGE · ❌ MISSING

| Area | Data / files | Status | Notes |
|---|---|---|---|
| **Foundation** | Data layer + local development store | ❌ | Decision C: no database while building |
| | Catalogue import (`catalog.json` → DB) | ❌ | New script, idempotent by slug |
| | Admin access (single `admin` role) | ✅/🛠 | Keep `is_admin`; add admin management in the app |
| | Activity log | ❌ | `admin_activity` table |
| | Admin layout (sidebar + topbar) | 🛠 | `admin/layout.tsx` exists, 4 links |
| **Overview** | Revenue today/week/month, order count, AOV | 🛠 | Today only, and counts cancelled |
| | New customers | ❌ | needs `profiles.created_at` (exists) |
| | Low-stock alerts | 🛠 | must include variants |
| | Recent orders, best sellers, sales chart | ❌ | SQL views/RPCs |
| **Products** | List search/filter/sort/pagination | 🛠 | basic list exists |
| | Add / edit | 🛠 | exists; needs colours, SEO, status, tags, SKU |
| | Duplicate | ❌ | |
| | Soft delete | 🛠 | `archiveProduct` sets `is_active=false`; add `status` + `deleted_at` |
| | Variants size × colour with stock, price, SKU | 🛠 | size-only today (Q4) |
| | Multi-image upload, reorder, main image | 🛠 | upload only |
| | Categories / collections / tags | 🛠 | flags only; no tags |
| | Sale price & discount | 🛠 | `compare_at_price` only |
| | Draft / published / archived | ❌ | only `is_active` |
| | SEO fields | ❌ | |
| | Bulk actions, CSV import/export | ❌ | |
| **Inventory** | Stock per variant | ✅/🛠 | size only |
| | Low-stock threshold | ❌ | setting + per-product override |
| | Stock adjustment history | ❌ | `stock_movements` |
| **Categories & collections** | CRUD, reorder, images | 🛠 | table exists, no UI, no image |
| | Shop-by-size groups | ❌ | (Q6) |
| | Collections (New/Hot/Premium + custom) | ❌ | `collections` + join table |
| **Orders** | List + filters (status, date, payment) | 🛠 | status filter only |
| | Detail, status update, tracking no. | ✅/🛠 | needs validated transitions |
| | Invoice download | ✅ | customer invoice page; reuse for admin |
| | Refunds | ❌ | Razorpay refunds API |
| | Notes | ✅ | `admin_notes` (single field) → notes timeline |
| **Customers** | List, profile, order history, total spend | ❌ | |
| | Block / unblock | ❌ | `profiles.is_blocked`, enforced by the login system |
| **Coupons** | % / flat, min order, expiry, limits, scope | ❌ | must hook into `priceCart` |
| **Content** | Banners, hero, featured collections, announcement bar | ❌ | hard-coded today |
| **Reviews** | approve / hide / delete | ❌ | no reviews feature on storefront at all (Q9) |
| **Reports** | by day / product / category / size, CSV | ❌ | |
| **Settings** | Store info | 🛠 | `config/site.ts` (code) |
| | Shipping zones & rates | ✅/🛠 | Kerala / India / per-country exist |
| | Tax / GST | ❌ | (Q8) |
| | Payment settings | 🛠 | COD flag only; keys stay in env |
| | Email templates | ❌ | plain text in code |
| **Admin users & roles** | Invite, change role, remove | ❌ | |
| **Activity log** | who / what / when | ❌ | |

**Additions specific to this store (recommended):**
- **Made-to-order production queue** — custom-made and stitched items dispatch in 45–60 days. Admin needs a list of order lines with `made_to_order` + their measurements, a due date (paid + 60 days) and a "stitching status" (not started / cutting / stitching / ready). This is the boutique's biggest operational risk.
- **Measurement sheet print** per order line (tailor's job card).
- **Dispatch workflow for India Post** — bulk "ready to dispatch" list with addresses, printable shipping labels, consignment number entry, email on dispatch (exists, extend to bulk).
- **Abandoned `pending_payment` orders** — list and auto-expire after 24 h so they don't distort reports.
- **Running material in metres** — reports and stock must handle decimals.
- **Colour photo link** — colours point to an image index; reordering images must update `image_index`.
- **Global admin search** (order number, customer phone/email, product code).

---

## 3. Database changes

**Nothing in this section is run during the dashboard build** (decision C). It is the **target Postgres schema**. While building, the same shapes live in TypeScript types (`src/types/`) and in the local development store (§3.7). When the Coolify database is connected, this becomes the real migrations (recommended: Drizzle schema + generated migrations). `auth.users` below means the users table of the new login system.

Existing columns are kept so the storefront keeps working; new columns have defaults.

### 3.1 Admin access and audit
```sql
alter table profiles
  add column email text,                      -- copy of the login email (customer list/search)
  add column is_blocked boolean not null default false,
  add column last_seen_at timestamptz;
-- admin access stays the existing boolean profiles.is_admin (decision 16: one admin role, no superadmin)
create index profiles_admin_idx on profiles (id) where is_admin;
create index profiles_email_idx on profiles (lower(email));

create table admin_activity (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users on delete set null,
  action text not null,            -- 'product.update', 'order.status', 'refund.create' …
  entity_type text not null,
  entity_id text,
  summary text,
  diff jsonb,                      -- {field: [old, new]}
  ip inet,
  created_at timestamptz not null default now()
);
create index admin_activity_entity_idx on admin_activity (entity_type, entity_id, created_at desc);
create index admin_activity_actor_idx on admin_activity (actor_id, created_at desc);
```
Activity rows are insert-only (no edit or delete from the app).

### 3.2 Catalogue (`0005_catalogue.sql`)
```sql
create type product_status as enum ('draft', 'published', 'archived');
alter table products
  add column status product_status not null default 'published',
  add column deleted_at timestamptz,
  add column sku text unique,                 -- product code e.g. 'SC-11113'
  add column tags text[] not null default '{}',
  add column meta_title text,
  add column meta_description text,
  add column low_stock_threshold int,         -- null = global setting
  add column sale_price int, add column sale_starts_at timestamptz, add column sale_ends_at timestamptz,  -- decision 5
  add column hsn_code text, add column gst_rate numeric(4,2);   -- decision 8: empty until GST is set up
-- keep is_active in sync: is_active = (status = 'published' and deleted_at is null)  (trigger), so storefront code is untouched
create index products_status_idx on products (status, created_at desc);
create index products_tags_idx on products using gin (tags);
create index products_name_trgm on products using gin (name gin_trgm_ops);  -- admin search (pg_trgm)

-- Variants: extend, don't replace
alter table product_variants
  add column colour text,                     -- null = any/no colour
  add column sku text unique,
  add column price int,                       -- null = product price
  add column is_active boolean not null default true;
-- replace unique (product_id, size) with unique nulls not distinct (product_id, size, colour)

alter table product_images
  add column thumb_url text,
  add column is_main boolean not null default false,
  add column colour text;                     -- optional link to a colour
create unique index product_images_one_main on product_images (product_id) where is_main;

alter table categories
  add column image_url text, add column is_active boolean not null default true,
  add column parent_id uuid references categories, add column meta_title text, add column meta_description text;

create table collections (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null, name text not null, description text, image_url text,
  kind text not null default 'manual',        -- 'manual' | 'flag' (new_arrival/hot_deal/premium mapped)
  is_active boolean not null default true, sort_order int not null default 0
);
create table collection_products (collection_id uuid references collections on delete cascade,
  product_id uuid references products on delete cascade, sort_order int default 0, primary key (collection_id, product_id));

create table size_groups (                    -- "shop by size" (Q6)
  id uuid primary key default gen_random_uuid(), name text not null,   -- 'Women', 'Kids'
  sizes text[] not null, size_chart jsonb, sort_order int default 0);

create table stock_movements (
  id bigint generated always as identity primary key,
  product_id uuid not null references products on delete cascade,
  variant_id uuid references product_variants on delete set null,
  delta numeric(10,2) not null,               -- metres allowed for running material
  reason text not null,                       -- 'sale','cancel','refund','adjust','import','return'
  order_id uuid references orders on delete set null,
  note text, actor_id uuid references auth.users, created_at timestamptz default now());
create index stock_movements_product_idx on stock_movements (product_id, created_at desc);
```
- `decrement_stock_for_order` is updated to also write `stock_movements` and match `(size, colour)`.
- New `restore_stock_for_order(order_id)` for cancel/refund.
- New RPC `save_product_variants(product_id, variants jsonb)` that upserts in one transaction (fixes bug 5).
- The New Arrivals / Hot Deals / Premium flags stay as columns (storefront depends on them); collections are added beside them.

### 3.3 Orders (`0006_orders.sql`)
```sql
-- decision 7: keep paid/processing/dispatched (shown as Confirmed/Packed/Shipped), add 'returned'
alter type order_status add value 'returned' after 'delivered';
alter table orders
  add column payment_method text not null default 'razorpay', -- 'razorpay' | 'cod'  (decision 10)
  add column cod_fee int not null default 0,
  add column cod_collected_at timestamptz,
  add column tax_total int, add column tax_breakup jsonb,     -- decision 8: filled once GST is set up
  add column cancelled_at timestamptz, add column delivered_at timestamptz,
  add column coupon_code text, add column discount_total int not null default 0;
alter table order_items add column variant_id uuid references product_variants on delete set null,
  add column production_status text,          -- made-to-order queue: not_started/cutting/stitching/ready
  add column due_date date;

create table order_events (                   -- status timeline + notes
  id bigint generated always as identity primary key,
  order_id uuid not null references orders on delete cascade,
  type text not null,                         -- 'status','note','refund','email'
  from_status order_status, to_status order_status, note text,
  actor_id uuid references auth.users, created_at timestamptz default now());

create table refunds (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders, amount int not null check (amount > 0),
  reason text, razorpay_refund_id text unique, status text not null default 'pending',
  restock boolean not null default false, actor_id uuid references auth.users, created_at timestamptz default now());
create index orders_created_idx on orders (created_at desc);
create index orders_payment_idx on orders (razorpay_payment_id);
```
Allowed transitions live in one TS map (`lib/admin/orderStatus.ts`) and are re-checked in SQL by the update RPC.

### 3.4 Marketing & content (`0007_marketing.sql`)
```sql
create table coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,                  -- stored upper-case
  type text not null check (type in ('percent','flat')),
  value int not null,                         -- percent (1–100) or paise
  min_order int not null default 0, max_discount int,
  starts_at timestamptz, ends_at timestamptz,
  usage_limit int, per_customer_limit int, used_count int not null default 0,
  applies_to text not null default 'all',     -- 'all' | 'products' | 'categories'
  product_ids uuid[] not null default '{}', category_ids uuid[] not null default '{}',
  applies_to_stitching boolean not null default false,
  is_active boolean not null default true, created_at timestamptz default now());
create table coupon_redemptions (coupon_id uuid references coupons, order_id uuid references orders,
  user_id uuid, amount int, created_at timestamptz default now(), primary key (coupon_id, order_id));

create table banners (
  id uuid primary key default gen_random_uuid(),
  placement text not null,                    -- 'hero','strip','category'
  title text, subtitle text, cta_label text, href text,
  image_url text not null, mobile_image_url text, video_url text,
  starts_at timestamptz, ends_at timestamptz, is_active boolean default true, sort_order int default 0);
-- announcement bar messages + featured collections stored in settings.data (content section)

create table email_templates (                -- decision 13
  key text primary key,                       -- 'order_confirmation','dispatch','refund','cod_confirmation','admin_new_order'
  subject text not null, body_html text not null, body_text text not null,
  updated_by uuid references auth.users, updated_at timestamptz default now());
-- placeholders: {{order_number}}, {{customer_name}}, {{items}}, {{total}}, {{consignment_number}}, {{tracking_url}} …
-- seeded with today's plain-text emails so nothing changes until the client edits them

create table reviews (                        -- decision 9
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products on delete cascade,
  user_id uuid references auth.users, order_item_id uuid references order_items,
  rating int not null check (rating between 1 and 5), title text, body text,
  status text not null default 'pending',     -- pending/approved/hidden
  created_at timestamptz default now());
```

### 3.5 Reporting
SQL views / RPCs (security definer, admin-only): `admin_sales_daily(from, to)`, `admin_sales_by_product`, `admin_sales_by_category`, `admin_sales_by_size`, `admin_kpis(from, to)`, `admin_low_stock()`. Paid statuses only (`paid … delivered`); refunds subtracted. Times in **IST** (`Asia/Kolkata`).

### 3.6 Migration approach (when the Coolify database is connected)
1. Every change is additive; defaults keep old rows valid. No existing column is dropped.
2. A trigger keeps `is_active` in sync with `status`/`deleted_at`, so storefront queries keep working.
3. Run on a staging database first, then production. Each migration has a rollback note.
4. Enum additions (`alter type … add value`) go in their own migration.
5. Data from the development store is **not** moved to production (it's test data). The client enters real products in the live dashboard (decision 3).

### 3.7 Building without a database (decisions 1 and C)
The dashboard is built and tested with **no database and no Supabase project**. Then Postgres on Coolify is connected.

- **One data layer: `src/lib/db/`.** Pages, server actions and route handlers never query a database directly. They call typed functions such as `db.products.list(filters)`, `db.products.save(input)`, `db.orders.updateStatus(id, to)`, `db.reports.salesByDay(range)`. The folder has:
  - `types.ts`: the interface every backend must implement;
  - `dev/`: the **local development store** (used now);
  - `postgres/`: written when the Coolify database is connected (recommended: Drizzle ORM).
  A single env var `DATA_BACKEND=dev|postgres` picks the backend.
- **Local development store.** A JSON file at `.data/dev-store.json` (git-ignored), loaded into memory and written back after every change, so data survives restarts. It's seeded on first run from `catalog.json` (the 322 sample products, categories, colours, sizes) plus generated sample customers and orders (all statuses, COD and Razorpay, made-to-order lines with measurements), so every dashboard page has realistic data. `npm run dev:reset` re-seeds it. It refuses to start when `NODE_ENV=production`.
- **Same rules in both backends.** Business rules (allowed status changes, stock restore on cancel, coupon checks, prices in paise) live in `src/lib/admin/` and `src/lib/pricing.ts`, not inside the backend, so they behave the same after the move.
- **Login while building.** `src/lib/auth.ts` is the only place that knows the login system. In the dev backend, admin login uses `DEV_ADMIN_EMAIL` / `DEV_ADMIN_PASSWORD` from `.env.local` and a signed, http-only session cookie. Real customer accounts and the real admin login come with the Coolify move (recommended: Better Auth: email/password, banning, sessions in Postgres).
- **Storefront.** It keeps using preview data exactly as today. Whether and when it reads from the dashboard's data is decided later (decision D).
- **Outside services while building:**
  - Cloudinary: real uploads to a separate folder `amaris/dev/` (keys already in `.env.local`), so the image uploader is tested for real.
  - Razorpay refunds: simulated in the dev backend (stored as `status: simulated`); the real API call is wired with test keys at the move.
  - Emails: printed to the server log (current behaviour without a Resend key), plus an "email preview" page in the dashboard.
- **Rate limiter and jobs behind interfaces** (`src/lib/admin/rateLimit.ts`, `src/lib/jobs.ts`): in-memory now, Redis on Coolify later.
- The move itself gets its own plan when you say the dashboard is done.

---

## 4. Auth & security

- **Login:** same login page at `/login?next=/admin` (no separate admin login). No 2FA (decision 11).
- **Roles (decision 16):** a single `admin` role for the client, with access to the whole dashboard. Customers have no admin access. An admin can add or remove other admin accounts, but can't remove the last admin.
- **Two layers, both server-side:**
  1. `middleware.ts`: `/admin/*` and `/api/admin/*` require a valid session that belongs to an admin; anyone else is redirected to login (pages) or gets 401/403 (API).
  2. Every admin page, server action and route handler starts with `requireAdmin()` from `src/lib/admin/guard.ts` (throws 403 / redirects). A test checks that every file under `src/app/admin/**/actions.ts` and `src/app/api/admin/**` calls it. The check never relies on the UI hiding a button.
  On Postgres, database permissions are an extra safety net, but the app does not depend on them.
- **Blocked customers:** `profiles.is_blocked`; login, checkout and reviews reject blocked users (enforced fully once the real login system exists).
- **Validation:** one zod schema per action in `src/lib/admin/schemas.ts`; never `Object.fromEntries(form)` straight into a query. IDs validated as UUID. Money accepted in ₹ and converted once.
- **Rate limiting (decision 12):** login, signup, password reset, track-order, coupon checks, reviews and all admin mutations. **Recommended: `rate-limiter-flexible`** with a **Redis container on Coolify** in production and its in-memory store in development. Why: no outside account or bill, Redis runs next to the app on the same server, and the same library can fall back to Postgres if Redis is ever down. (Upstash only makes sense on Vercel, which we are not using.)
- **Uploads (decision 2):** browser uploads straight to **Cloudinary** with a short-lived **signature from our server** (`/api/admin/uploads/sign`, guarded). The signature fixes the folder (`amaris/products/<product-id>/`), allowed formats (jpg, png, webp, avif), max size 10 MB and max 15 per product; random public IDs. The server then verifies the returned asset (folder, format, size) before saving it to the product. Deleting an image deletes it from Cloudinary too.
- **CSRF:** Server Actions are POST-only with Next's origin check; admin route handlers check `Origin`.
- **Audit:** every mutation writes `admin_activity` (inside the same action, after success).
- **Secrets:** Razorpay secret, database credentials, `DEV_ADMIN_PASSWORD` and Cloudinary secret stay server-only (`server-only` import).
- **Headers:** `noindex` on `/admin`, `Cache-Control: no-store` on admin responses.

---

## 5. Route / page map

| Route | Purpose | Access |
|---|---|---|
| `/admin` | Overview: KPIs (today / 7 d / 30 d), sales chart, recent orders, low stock, best sellers, production due soon | admin |
| `/admin/orders` | List: status, date range, payment, made-to-order, search; pagination; bulk mark packed/dispatched; CSV export | admin |
| `/admin/orders/[id]` | Detail, timeline, status change, consignment no., notes, invoice, refund, measurements, print job card | admin |
| `/admin/orders/[id]/invoice` | Admin view of the tax invoice (reuses customer invoice component) | admin |
| `/admin/orders/dispatch` | Ready-to-dispatch list + printable India Post labels + bulk consignment entry | admin |
| `/admin/production` | Made-to-order queue (custom + stitched lines), due dates, production status | admin |
| `/admin/products` | List: search, category, status, flags, stock; sort; pagination; bulk price/stock/status/flags; CSV import/export | admin |
| `/admin/products/new` | Create (fields by product type) | admin |
| `/admin/products/[id]` | Edit: basics, pricing, variants grid, images, colours, SEO, flags/collections, stock history | admin |
| `/admin/inventory` | All stock rows (product × variant), inline adjust with reason, low-stock filter | admin |
| `/admin/inventory/history` | Stock movements log | admin |
| `/admin/categories` | CRUD, reorder, image, SEO | admin |
| `/admin/collections` | CRUD, add/remove/reorder products; flag collections (New/Hot/Premium) | admin |
| `/admin/sizes` | Size groups + size charts (shop by size) | admin |
| `/admin/customers` | List: search, spend, orders, joined, blocked | admin |
| `/admin/customers/[id]` | Profile, addresses, orders, total spend, block/unblock, notes | admin |
| `/admin/coupons` · `/new` · `/[id]` | Coupon CRUD + usage | admin |
| `/admin/content` | Hero slides, banners, announcement bar, featured collections on home | admin |
| `/admin/reviews` | Moderate (if Q9) | admin |
| `/admin/reports` | Sales by day / product / category / size; date range; CSV | admin |
| `/admin/settings` | Store info, shipping (Kerala/India/international), stitching charges (incl. per category), GST, COD, low-stock threshold, email templates | admin |
| `/admin/users` | Admin accounts: add, remove (not the last admin) | admin |
| `/admin/activity` | Activity log, filter by user/entity/date | admin |

---

## 6. API / server actions

Server Actions are used for forms (existing pattern). Route handlers under `/api/admin/*` only where a URL is needed (CSV download, uploads, charts data).

| Type | Name / path | Input (zod) | Output | Access |
|---|---|---|---|---|
| Action | `products.save` | product fields, variants[], colours[], SEO, tags, collections | `{ok, id}` / `{error}` | admin |
| Action | `products.duplicate` | `{id}` | new id (status draft, slug `-copy`) | admin |
| Action | `products.setStatus` | `{ids[], status}` | count | admin |
| Action | `products.softDelete` / `restore` | `{ids[]}` | count | admin |
| Action | `products.bulkUpdate` | `{ids[], price? (set/±%), stock?, flags?, category?}` | count | admin |
| Route | `POST /api/admin/products/import` | CSV file (dry-run flag) | report rows ok/errors | admin |
| Route | `GET /api/admin/products/export` | filters | CSV | admin |
| Route | `POST /api/admin/uploads/sign` | `{productId, count}` | signed Cloudinary params | admin |
| Action | `images.attach` / `reorder` / `setMain` / `delete` | ids, order[] | ok | admin |
| Action | `inventory.adjust` | `{productId, variantId?, delta, reason, note}` | new qty | admin |
| Action | `categories.save` / `reorder` / `delete` | fields / ids[] | ok | admin |
| Action | `collections.save` / `setProducts` | fields / productIds[] | ok | admin |
| Action | `sizes.save` | group, sizes[], chart | ok | admin |
| Action | `orders.updateStatus` | `{id, to, note?}` (transition checked) | ok | admin |
| Action | `orders.markDispatched` (existing, extend to bulk) | `{ids[], consignment per id, carrier}` | ok + emails | admin |
| Action | `orders.addNote` | `{id, note}` | ok | admin |
| Action | `orders.refund` | `{id, amount, reason, restock}` | refund row (Razorpay `payments.refund`) | admin |
| Action | `orders.cancel` | `{id, reason, restock, refund}` | ok | admin |
| Action | `production.update` | `{itemId, status, dueDate?}` | ok | admin |
| Route | `GET /api/admin/orders/export` | filters | CSV | admin |
| Action | `customers.block` / `unblock` | `{id, reason}` | ok | admin |
| Action | `customers.addNote` | `{id, note}` | ok | admin |
| Action | `coupons.save` / `toggle` / `delete` | coupon fields | ok | admin |
| Action | `content.saveBanner` / `reorder` / `saveAnnouncement` / `saveFeatured` | fields | ok | admin |
| Action | `reviews.setStatus` / `delete` | `{ids[], status}` | ok | admin |
| Route | `GET /api/admin/reports/[report]` | `{from, to, groupBy}`, `?format=csv` | JSON or CSV | admin |
| Action | `settings.save` (existing, split by section) | section schema | ok | admin |
| Action | `users.add` / `remove` | `{email}` | ok | admin (cannot remove the last admin) |
| Server fn | `getDashboardKpis(range)` | range | KPIs | admin |

Storefront change for coupons: `priceCart()` gets an optional `couponCode`, validated and applied on the server; `create-order` stores `coupon_code` + `discount_total` and writes `coupon_redemptions` after payment.

---

## 7. Folder & file structure

**New**
```
src/app/admin/
  (dashboard)/page.tsx                      overview (replaces admin/page.tsx content)
  orders/dispatch/page.tsx
  orders/[id]/invoice/page.tsx
  production/page.tsx  production/actions.ts
  inventory/page.tsx  inventory/history/page.tsx  inventory/actions.ts
  categories/page.tsx  categories/actions.ts
  collections/page.tsx  collections/[id]/page.tsx  collections/actions.ts
  sizes/page.tsx  sizes/actions.ts
  customers/page.tsx  customers/[id]/page.tsx  customers/actions.ts
  coupons/page.tsx  coupons/new/page.tsx  coupons/[id]/page.tsx  coupons/actions.ts
  content/page.tsx  content/actions.ts
  reviews/page.tsx  reviews/actions.ts                       (if Q9)
  reports/page.tsx
  users/page.tsx  users/actions.ts
  activity/page.tsx
  loading.tsx  error.tsx  not-found.tsx
src/app/api/admin/
  products/import/route.ts  products/export/route.ts
  orders/export/route.ts  uploads/sign/route.ts  reports/[report]/route.ts
src/components/admin/
  AdminShell.tsx Sidebar.tsx Topbar.tsx GlobalSearch.tsx
  DataTable.tsx Pagination.tsx FilterBar.tsx BulkActionBar.tsx
  StatusBadge.tsx KpiCard.tsx SalesChart.tsx
  ImageUploader.tsx (multi, reorder, main) VariantGrid.tsx ColourEditor.tsx
  ConfirmDialog.tsx Modal.tsx Toaster.tsx EmptyState.tsx
  MoneyInput.tsx DateRangePicker.tsx OrderTimeline.tsx JobCard.tsx ShippingLabel.tsx
src/lib/admin/
  guard.ts            requireAdmin() for pages, actions and routes
  schemas.ts          zod per action
  activity.ts         logActivity()
  orderStatus.ts      allowed transitions
  reports.ts          KPI + report queries
  csv.ts              parse / stringify
  rateLimit.ts
  uploads.ts          validation + signing
src/lib/data/coupons.ts  src/lib/data/content.ts
src/lib/db/           types.ts (backend interface) · index.ts (picks backend) · dev/ (local store + seed) · postgres/ (later)
.data/dev-store.json  (git-ignored, created on first run)
scripts/seed-dev-store.mjs   (npm run dev:reset)
```

**Modified**
| File | Change |
|---|---|
| `src/middleware.ts` | admin session check for `/admin/*` and `/api/admin/*` (dev backend: signed cookie) |
| `src/lib/auth.ts` | login provider switch (dev admin login now; real login at the move) |
| `src/app/admin/layout.tsx` | new shell |
| `src/app/admin/**` existing pages/actions | queries moved into `src/lib/db/` |
| `.gitignore`, `package.json` | ignore `.data/`; add `dev:reset` script |
| `src/app/admin/page.tsx` | full overview |
| `src/app/admin/products/*` | list + form extended (variants grid, colours, images, SEO, status) |
| `src/app/admin/orders/*` | filters, pagination, timeline, transitions, refunds |
| `src/app/admin/settings/*` | sections: store, shipping, stitching by category, GST, COD, low stock, emails |
| `src/types/index.ts` | new types |
| `src/lib/data/products.ts` | `status`/`deleted_at` aware; size filter (shop by size) |
| `src/lib/checkout.ts`, `api/checkout/create-order` | coupon support; reject blocked users |
| `src/lib/email.ts` | templates from settings (if Q13) |
| `src/components/layout/AnnouncementBar.tsx`, `app/(shop)/page.tsx` | read content from DB with the current hard-coded values as fallback |
| `docs/STRUCTURE.md`, `README.md` | document new routes and setup |

Storefront files are only changed in Phases 6–8, each behind a fallback to today's behaviour.

---

## 8. UI plan

> Decision 14: **basic styling now that matches the website**, full design later. The admin reuses the storefront's Tailwind tokens and classes (fonts, maroon/gold/ivory palette, `btn-primary`, `chip`, `eyebrow`, form styles in `globals.css`) instead of a new look, so the later redesign is a restyle, not a rewrite.

- **Layout:** `AdminShell` = sidebar (sections: Overview, Orders, Production, Products, Inventory, Catalogue ▸ Categories/Collections/Sizes, Customers, Marketing ▸ Coupons/Content/Reviews, Reports, Settings, Users, Activity) + topbar (global search, "View store", user menu). On mobile the sidebar becomes a drawer (`<dialog>`), tables become stacked cards.
- **DataTable:** server-driven (URL search params for search, filter, sort, page, so pages are shareable and work without JS), row selection for bulk actions, column definitions per page, sticky header, CSV export button.
- **Forms:** native forms + Server Actions + `useActionState` (existing pattern), field-level zod errors, `MoneyInput` (₹ ↔ paise), unsaved-changes warning.
- **ImageUploader:** drag-and-drop + file picker, client-side preview, direct signed upload with progress, reorder (drag, plus up/down buttons for keyboard/mobile), "main image" radio, alt text, link to colour.
- **VariantGrid:** sizes × colours matrix → stock / price / SKU per cell; "fill column" helpers.
- **StatusBadge:** one component for order, product, payment, production, review status.
- **Charts:** sales line chart (day), bar charts for top products/categories/sizes.
- **Modals / confirm:** native `<dialog>`; destructive actions need a typed confirmation for bulk deletes and refunds.
- **Toasts:** lightweight in-house `Toaster` (context + `aria-live`).
- **States:** `loading.tsx` skeletons per route, `EmptyState` with the next action ("Add your first product"), `error.tsx` with retry; optimistic updates only for toggles.
- **Accessibility:** labelled controls, keyboard reorder, focus management in dialogs, `aria-sort` on tables.
- **Print:** invoice, job card (measurements), shipping labels via print CSS.

---

## 9. Libraries to add (minimal)

| Library | Why | Alternative if we want zero deps |
|---|---|---|
| `recharts` | Sales and report charts | hand-made SVG charts (more work) |
| `papaparse` | Robust CSV import/export (quotes, Excel files) | small custom CSV writer for export only |
| `@dnd-kit/core` + `@dnd-kit/sortable` | Accessible drag-reorder for images, categories, banners | up/down buttons only |
| `rate-limiter-flexible` (+ `ioredis` in production) | Rate limiting with Redis on Coolify, in-memory in dev (decision 12) | Postgres-table limiter |
| `cloudinary` (server SDK) | Signed uploads, deletes, verifying uploaded assets (decision 2) | hand-signed REST calls (already done in `scripts/upload-to-cloudinary.mjs`) |
| `vitest`, `@playwright/test` (dev only) | Tests (see §11; open question B) | manual checklist only |

Reused: `zod`, `lucide-react`, Razorpay SDK (refunds), Tailwind. **Not adding now:** UI kits, state managers, React Query. Drizzle ORM and Better Auth are planned for the Coolify move, not for the dashboard build.

---

## 10. Build order (each phase shippable)

| # | Phase | Contents | Depends on |
|---|---|---|---|
| 0 | **Foundation** | `src/lib/db/` data layer with the local development store (§3.7), seeded with sample data; dev admin login; move existing admin queries into the layer; Cloudinary signed uploads replace Supabase Storage; fix existing admin bugs 3–8 | — |
| 1 | **Auth, roles, shell** | 0004 migration, guard + permissions, middleware role check, rate limit on auth, AdminShell/sidebar/topbar, activity log helper, `/admin/users`, `/admin/activity` | 0 |
| 2 | **Products** | 0005 migration, list (DataTable, filters, pagination), full form (variants grid, colours, images uploader, SEO, status, tags), duplicate, soft delete, bulk actions | 1 |
| 3 | **Inventory & catalogue** | stock movements, adjust, history, low-stock threshold; categories, collections, size groups; CSV import/export | 2 |
| 4 | **Orders** | 0006 migration, filters/pagination, timeline, transitions, notes, dispatch page + labels, bulk dispatch, admin invoice, cancel + restock, Razorpay refunds, pending-payment expiry | 1 |
| 5 | **Production queue** | made-to-order lines, due dates, statuses, job card print | 4 |
| 6 | **Overview & reports** | 0008 reporting RPCs, KPIs, charts, best sellers, reports page, CSV | 4 |
| 7 | **Customers** | list, profile, spend, block/unblock (+ checkout check) | 4 |
| 8 | **Coupons & COD** | 0007 coupons part, admin CRUD, `priceCart` + checkout support; COD at checkout, COD fee/limits, collect-on-delivery in admin | 4 |
| 9 | **Content & shop by size** | banners/hero/announcement/featured; size filter + "Shop by size" menu; storefront reads with fallback | 3 |
| 10 | **Settings & emails** | sections (store info, shipping, stitching by category, COD, low stock), GST fields (empty for now), editable email templates | 4 |
| 11 | **Reviews** | storefront review form + display, moderation | 4 |
| — | **Later: move to Coolify Postgres** | separate plan once you say the dashboard is done | all |

---

## 11. Testing checklist

No test framework exists yet. Proposal (open question B): **Vitest** for pure logic (pricing, status changes, coupons, CSV, dev store) and **Playwright** for click-through admin flows against the local development store. Without approval, each phase is checked with `tsc`, `eslint` and the manual checklist below.

| Phase | Checks |
|---|---|
| 0 | Dev store seeds on first run and survives a restart; `dev:reset` re-seeds; refuses to start in production; existing admin pages work on the dev store; Cloudinary signed upload lands in `amaris/dev/`; storefront unchanged |
| 1 | Logged-out user and customer get redirect/403 on every `/admin/*` page **and** every admin action/route (call them directly); last admin can't be removed; login rate limit triggers; activity rows written |
| 2 | Create each product type; variants save atomically (simulate failure); duplicate creates a draft; soft-deleted products vanish from storefront and search but old orders still link; image reorder updates colour `image_index`; upload rejects non-images / >10 MB; bulk price ±% rounds to paise |
| 3 | Adjust writes a movement and changes stock; low-stock includes variants and metres; CSV export → import round trip makes no changes; category reorder reflects in storefront nav |
| 4 | Only allowed transitions succeed; cancel restores stock once; refund recorded (simulated in dev, Razorpay test mode after the move); partial refund; dispatch email contains consignment no.; filters + pagination; pending orders expire |
| 5 | Every made-to-order line appears with measurements; due date = paid + 60 days; job card prints |
| 6 | KPIs match SQL by hand for a fixed dataset; cancelled/refunded excluded; IST day boundaries; CSV matches screen |
| 7 | Spend excludes refunds; blocked flag stored and shown (login/checkout blocking verified after the move) |
| 8 | % and flat; min order; expiry; usage + per-customer limits under concurrent use; server ignores client-sent discount; stitching excluded unless allowed |
| 9 | Banner schedule respected in preview; storefront falls back to defaults when no content is set |
| 10 | Settings changes reflect in cart/checkout totals; GST split on invoice (Kerala CGST+SGST vs IGST) |
| All | Storefront smoke test (home, category, product, cart, checkout) after every phase; mobile layout of admin tables; `tsc` + `eslint` clean |

---

## 12. Open questions

Answered: 1–20 and A, C, D (see §0; D is deferred). Still open:

- **B. Testing tools.** OK to add Vitest (logic tests) and Playwright (click-through tests of the admin) as development-only tools? Without them, each phase is checked with `tsc`, `eslint` and the manual checklist in §11.
