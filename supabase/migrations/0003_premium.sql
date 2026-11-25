-- "Premium" collection: a flag on products (like New Arrivals / Hot Deals), shown at /premium.
alter table public.products add column if not exists is_premium boolean not null default false;
create index if not exists products_premium_idx on public.products (created_at desc) where is_active and is_premium;
