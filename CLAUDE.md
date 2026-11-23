# Amaris Boutique — E-commerce Website (Project Brief)

This file is the project brief for Claude Code. Read it before every task.

> **Design ownership:** the visual design (layout, colours, fonts, styling) is done by the developer.
> Pages and components are intentionally unstyled semantic HTML. Do not add styling unless asked.
> See `docs/STRUCTURE.md` for the code map.

## 1. Client
- **Business:** Amaris Boutique (sister brands: Marias Bridal Works, Marias Tailors)
- **Address:** Pamplaniyil Arcade, Ground Floor, beside Marias Beauty Parlour, Paika–Pinnakinadu Road, Paika Central Junction, Kerala
- **GSTIN:** 32AUNPJ2752K1ZH (show on invoices / footer)
- **Phone / WhatsApp:** +91 8547572576, +91 8089893300
- **Email:** amarisbymarias@gmail.com, amarisboutique@zohomail.in
- **Instagram:** @amaris_boutique_paika, @marias_bridal_works, @mariastailors_paika
- **Working hours:** Mon–Sat, 10:00 AM – 5:00 PM IST
- **Footer line:** Amaris Boutique © 2026 All Rights Reserved
- Do NOT put the bank account / IFSC on the website. Payments go through a payment gateway.

## 2. Tech stack
- Next.js (App Router) + TypeScript + Tailwind CSS
- Database + auth + image storage: Supabase (Postgres)
- Payments: Razorpay (India + international cards)
- Hosting: Vercel
- Currency: INR (₹)

## 3. Navigation / categories
1. Home
2. New Arrivals
3. Unstitched – Salwar Suits
4. Co-ord Sets
5. Frocks & Kurtis – Custom Made
6. Ready Made
7. Saree
8. Home Linen
9. Running Material (fabric sold by the metre)
10. Kids Dresses – Custom Made
11. Hot Deals

"New Arrivals" and "Hot Deals" are filters (flags on products), not separate product types.

## 4. Product types (important for the data model)
| Type | Categories | What the customer chooses |
|---|---|---|
| Ready made | Ready Made, Co-ord Sets, Saree, Home Linen | Size (where relevant), quantity |
| Unstitched | Unstitched Salwar Suits | Quantity + **optional stitching add-on** |
| Custom made | Frocks & Kurtis, Kids Dresses | Standard size OR manual measurements |
| Running material | Running Material | Length in metres |

### Stitching add-on (unstitched suits)
On the product page show: **"Do you want this stitched professionally?"**
- No → buy as unstitched fabric.
- Yes → adds a stitching charge, then the customer either **selects a size** (S, M, L, XL…) or **enters measurements manually** (bust, waist, hip, shoulder, length, sleeve length, etc.).
- The measurements are saved with that order item.
- Show the note: items are stitched strictly to the given measurements; alterations cost extra.

## 5. Pages
- Home, category pages, product page, cart, checkout, order success
- Login / signup, My Account (orders, addresses)
- Track Order → link to the India Post tracking portal with the consignment number
- Policy pages: Return & Refund, Shipping, Privacy, Terms of Service
- Contact page (phone, WhatsApp, email, map, Instagram)
- Admin panel: add/edit products, images, prices, stock, view orders, enter India Post consignment number, mark dispatched

## 6. Shipping rules
- In-stock items: dispatched within 48 hours
- Pre-order / custom-made: dispatched in 45–60 days (show this on product + checkout)
- Delivery after dispatch: Kerala 5 working days, rest of India 8 working days, international varies
- Domestic delivery: India Post only
- International: courier, rates at checkout, customer pays customs/import duties
- Dispatch email includes the India Post consignment number
- Checkout must ask the customer to verify address, PIN code and phone

## 7. Policy pages content
Use the exact wording the client provided (in the original Excel `WEBSITE_DESIGN_AMARIS.xlsx`, Sheet1). Summary:

**Return & Refund**
- All sales final. Replacement only for damaged, wrong product or wrong size. Refund only if replacement is out of stock.
- Report within 24 hours of delivery with a continuous, unedited unboxing video showing: all sides of the sealed package incl. label, full opening, the damage/wrong item in clear light. No video = no complaint.
- Not covered: damage from washing/misuse/wear, slight colour differences from lighting/screens, minor loose threads or stitching variations, change of mind.
- Exchange: case by case within 3 days, unused, original condition, equal or higher value, no price-difference refunds, customer pays all courier and re-order charges.
- Return shipping: no pickup; customer self-ships after approval; shipping non-refundable.
- Wash & care: not responsible for fading, shrinkage or fabric damage after washing or wear.
- Unauthorized sellers: not liable for purchases from fake accounts or third parties misusing their images/videos.
- Saree policy: minor thread variations, slubs, knots and slight colour differences are normal. Valid defects only: tears, wrong saree length, missing blouse piece (if included).
- Partial order: if one item fails QC before dispatch, refund or replace that item only; cancelling the whole order not allowed.
- Measurement & stitching: stitched to customer measurements; not responsible for fit issues from wrong measurements; alterations cost extra stitching + shipping.
- Cancellation: orders are final after payment; no cancellation after confirmation or dispatch.
- Contact: +91 8547572576, amarisbymarias@gmail.com, Mon–Sat 10 AM–5 PM IST.
- Final note: placing an order means agreeing to all terms.

**Shipping, Privacy, Terms of Service:** full text in the Excel file. Terms: governed by Indian law, courts in Kerala.

## 8. Checkout requirements
- Customer must tick "I agree to the Terms, Return & Refund and Shipping policies" before paying.
- Show dispatch time (48 h vs 45–60 days) per item.
- Show stitching add-on price and measurements in cart and order summary.
- Order confirmation email + invoice with GSTIN.

## 9. Still needed from the client
- Logo, brand colours, fonts
- Product photos, names, prices, sizes, stock
- Stitching charge (per item / per category)
- Size chart and the list of measurement fields they want
- Domestic shipping charges (flat? free above an amount?)
- International shipping rates / countries
- Payment gateway account (Razorpay KYC) and domain name
- COD allowed or not
