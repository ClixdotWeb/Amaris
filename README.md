# Amaris Boutique: Website

Next.js 15 (App Router) · TypeScript · Tailwind · Supabase · Razorpay · Vercel

- Project brief: [CLAUDE.md](CLAUDE.md)
- Code map, sitemap, data model: [docs/STRUCTURE.md](docs/STRUCTURE.md)

## Preview mode (no database)

Without Supabase keys in `.env.local`, the site runs on sample data from `src/lib/data/mock.ts`:
`npm install && npm run dev`. Browsing, cart and the checkout form all work. Login, payment and admin need the database.
Sample product names are placeholders, and photos are from Unsplash (free licence). Replace both with the client's own before launch.

## Setup

1. `npm install`
2. Create a Supabase project. In the SQL editor run `supabase/migrations/0001_init.sql`, then `supabase/seed.sql`.
3. `cp .env.example .env.local` and fill in the Supabase and Razorpay (test mode) keys.
4. `npm run dev` → http://localhost:3000
5. Sign up on the site, then make yourself admin in the SQL editor:
   ```sql
   update profiles set is_admin = true
   where id = (select id from auth.users where email = 'you@example.com');
   ```
6. Go to `/admin/settings` to set the charges, then `/admin/products/new` to add products.

## Razorpay

- Test with Razorpay test keys and test cards.
- Webhook: `https://<domain>/api/webhooks/razorpay`, event `payment.captured`, secret → `RAZORPAY_WEBHOOK_SECRET`.

## Supabase Auth

- Authentication → URL Configuration: set the Site URL to your domain and add `<domain>/auth/callback` as a redirect URL.
