# Amaris Boutique — Code Structure

All pages are **unstyled semantic HTML**. Design is applied on top: add classes to the
existing markup, or replace the JSX, without touching the logic in `lib/`, `config/` or `api/`.

## Sitemap

```
STOREFRONT  (src/app/(shop)/ — shares Header + Footer)
/                              Home: hero, categories, New Arrivals, Hot Deals, stitching promo, trust strip
/new-arrivals                  Products flagged is_new_arrival
/hot-deals                     Products flagged is_hot_deal
/shop/[category]               8 categories (slugs in src/config/navigation.ts)
/product/[slug]                Gallery + type-specific purchase options + dispatch note
/search?q=                     Name search
/cart                          Cart with stitching + measurements per line
/checkout                      Address → verify checkbox → summary → policy consent → Razorpay   (login required)
/order/success/[orderId]       Confirmation
/login /signup /forgot-password /reset-password
/account                       Overview
/account/orders                Order history
/account/orders/[id]           Detail + India Post tracking
/account/orders/[id]/invoice   Printable tax invoice with GSTIN
/account/addresses             Saved addresses
/track-order                   Look up by order number + email → consignment no. → India Post link
/contact                       Phone, WhatsApp, email, Instagram, address, map
/policies/return-refund | shipping | privacy | terms

ADMIN  (src/app/admin/ — own layout, is_admin required)
/admin                         Dashboard: orders to dispatch, today's sales, low stock
/admin/orders[?status=]        Order list + status filter
/admin/orders/[id]             Detail, enter consignment no. → mark dispatched → email customer
/admin/products                Product list + search/filter
/admin/products/new            Add product (fields change by category type)
/admin/products/[id]           Edit, images, per-size stock, hide
/admin/settings                Stitching charge, domestic/international shipping

API
POST /api/checkout/create-order   Re-prices cart on server → pending order → Razorpay order
POST /api/checkout/verify         Verifies Razorpay signature → paid → stock decrement → email
POST /api/webhooks/razorpay       Backup for payment.captured (idempotent)
GET  /auth/callback               Email confirm / password reset
POST /auth/signout
```

## Folders

```
src/
  app/                 Routes (above)
  components/
    layout/            Header, Footer
    product/           ProductCard, ProductGrid, ProductListing, ProductGallery, SortSelect,
                       AddToCartForm (switches on product type), SizingPicker (size OR measurements),
                       SizingSummary, DispatchNote
    cart/              CartProvider (localStorage), CartLineItem, CartCount
    checkout/          CheckoutForm (Razorpay), AddressFields
    account/           OrderDetail, OrderStatusLabel, TrackingInfo, PrintButton
    PolicyPage.tsx
  config/
    site.ts            Business details (address, GSTIN, phones, emails, Instagram, hours)
    navigation.ts      Categories + main/footer nav
    shop.ts            Dispatch/delivery text, sizes, MEASUREMENT_FIELDS, notes
  lib/
    supabase/          client (browser), server (RLS + service-role), middleware (session + route guard)
    data/              products, orders, settings queries
    auth.ts            getUser / requireUser / requireAdmin
    pricing.ts         lineTotal, dispatchTypeFor, stitchingChargeFor, shippingFeeFor (shared client+server)
    checkout.ts        priceCart(): server-side re-pricing + validation per product type
    validation.ts      zod schemas (cart line, sizing, address, checkout)
    razorpay.ts        SDK + signature verification
    email.ts           Order confirmation + dispatch emails (Resend; logs if no key)
    format.ts          formatINR, dates, slugify
  types/index.ts       Domain types
  middleware.ts
supabase/
  migrations/0001_init.sql   Tables, enums, RLS, storage bucket, stock function
  seed.sql                   Categories + placeholder settings
```

## Data model

```
categories ─< products ─< product_images
                       ─< product_variants (size, stock)       ← ready-made with sizes
auth.users ─ profiles (is_admin)
           ─< addresses
           ─< orders ─< order_items (snapshot: price, size, length_metres,
                                     stitching, stitching_charge, sizing{standard|custom measurements},
                                     dispatch_type)
settings (single row JSON: stitching charge, shipping fees, international rates, COD)
```

Money is **integer paise** everywhere (₹1 = 100). Admin forms take ₹ and convert.

## Product-type rules (`lib/pricing.ts`, `lib/checkout.ts`, `AddToCartForm.tsx`)

| Type | Options | Dispatch |
|---|---|---|
| ready_made | size (if sizes set) + qty | 48 h (45–60 d if pre-order) |
| unstitched | qty + optional stitching → size or measurements | 48 h; **45–60 d if stitched** |
| custom_made | size or measurements + qty | always 45–60 d |
| running_material | metres (min + step per product) | 48 h |

## Where to put design

- Brand tokens: `src/app/globals.css` (`@theme { ... }`)
- Fonts: `src/app/layout.tsx` (next/font)
- Logo: `src/components/layout/Header.tsx`
- `<img>` tags can become `next/image` (add the Supabase host to `images.remotePatterns` in `next.config.ts`)
- State hooks for styling: `data-status` on order status, `data-dispatch` on dispatch notes, `aria-pressed` on gallery thumbs

## Open items (waiting on the client)

Search for `TODO` in the code. Main ones:
- Policy wording from the Excel file → `src/app/(shop)/policies/*`
- Measurement fields + kids sizes + size chart → `src/config/shop.ts`
- Stitching charge, shipping fees, international rates → `/admin/settings`
- GST tax breakup on invoice (inclusive? HSN? CGST/SGST vs IGST) → invoice page
- Google Maps embed URL → `src/config/site.ts`
- India Post tracking URL check → `src/config/shop.ts`
- COD (not built)
