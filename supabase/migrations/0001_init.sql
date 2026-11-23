-- Amaris Boutique — initial schema
-- Money is integer paise. Run with `supabase db push` or paste into the Supabase SQL editor.

create extension if not exists "pgcrypto";

-- ───────────────────────── Enums ─────────────────────────
create type product_type as enum ('ready_made', 'unstitched', 'custom_made', 'running_material');
create type dispatch_type as enum ('in_stock', 'made_to_order');
create type order_status as enum (
  'pending_payment', 'paid', 'processing', 'dispatched', 'delivered', 'cancelled', 'refunded'
);

-- ───────────────────────── Helpers ─────────────────────────
create or replace function set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

-- ───────────────────────── Profiles ─────────────────────────
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text,
  phone text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

-- Create a profile automatically when a user signs up
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, full_name, phone)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'phone');
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select is_admin from profiles where id = auth.uid()), false);
$$;

-- ───────────────────────── Catalogue ─────────────────────────
create table categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  product_type product_type not null,
  description text,
  sort_order int not null default 0
);

create table products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  category_id uuid not null references categories on delete restrict,
  product_type product_type not null,
  price int not null check (price >= 0),
  compare_at_price int check (compare_at_price is null or compare_at_price >= 0),
  sizes text[] not null default '{}',
  stock_qty numeric(10,2) not null default 0,
  is_preorder boolean not null default false,
  is_new_arrival boolean not null default false,
  is_hot_deal boolean not null default false,
  is_active boolean not null default true,
  stitching_available boolean not null default false,
  stitching_charge int check (stitching_charge is null or stitching_charge >= 0),
  min_metres numeric(6,2),
  metre_step numeric(6,2),
  fabric text,
  care_instructions text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index products_category_idx on products (category_id) where is_active;
create index products_new_idx on products (created_at desc) where is_active and is_new_arrival;
create index products_deal_idx on products (created_at desc) where is_active and is_hot_deal;
create trigger products_updated_at before update on products
  for each row execute function set_updated_at();

-- Per-size stock for ready-made items that come in sizes
create table product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products on delete cascade,
  size text not null,
  stock_qty int not null default 0 check (stock_qty >= 0),
  unique (product_id, size)
);

create table product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products on delete cascade,
  storage_path text not null,
  url text not null,
  alt text,
  sort_order int not null default 0
);
create index product_images_product_idx on product_images (product_id, sort_order);

-- ───────────────────────── Customers ─────────────────────────
create table addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  full_name text not null,
  phone text not null,
  line1 text not null,
  line2 text,
  city text not null,
  state text not null,
  pincode text not null,
  country text not null default 'IN',
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);
create index addresses_user_idx on addresses (user_id);

-- ───────────────────────── Orders ─────────────────────────
create sequence order_number_seq start 1001;

create table orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique default ('AMR' || nextval('order_number_seq')),
  user_id uuid not null references auth.users on delete restrict,
  email text not null,
  phone text not null,
  shipping_address jsonb not null,
  status order_status not null default 'pending_payment',
  subtotal int not null,
  stitching_total int not null default 0,
  shipping_fee int not null default 0,
  total int not null,
  is_international boolean not null default false,
  razorpay_order_id text unique,
  razorpay_payment_id text,
  carrier text,                 -- 'India Post' for domestic, courier name for international
  consignment_number text,
  dispatched_at timestamptz,
  policies_accepted_at timestamptz not null,
  customer_notes text,
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index orders_user_idx on orders (user_id, created_at desc);
create index orders_status_idx on orders (status, created_at desc);
create trigger orders_updated_at before update on orders
  for each row execute function set_updated_at();

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders on delete cascade,
  product_id uuid references products on delete set null,
  product_name text not null,           -- snapshot
  product_type product_type not null,
  image_url text,
  unit_price int not null,              -- per piece or per metre, snapshot
  quantity int not null default 1 check (quantity > 0),
  length_metres numeric(6,2),           -- running material only
  size text,                            -- ready made size
  stitching boolean not null default false,
  stitching_charge int not null default 0,
  sizing jsonb,                         -- { mode: 'standard', size } | { mode: 'custom', measurements, notes }
  dispatch_type dispatch_type not null,
  line_total int not null
);
create index order_items_order_idx on order_items (order_id);

-- ───────────────────────── Settings ─────────────────────────
-- Values the client still has to confirm (stitching charge, shipping, COD). Single row.
create table settings (
  id int primary key default 1 check (id = 1),
  data jsonb not null,
  updated_at timestamptz not null default now()
);

-- ───────────────────────── Row Level Security ─────────────────────────
alter table profiles enable row level security;
alter table categories enable row level security;
alter table products enable row level security;
alter table product_variants enable row level security;
alter table product_images enable row level security;
alter table addresses enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table settings enable row level security;

-- Profiles: own row; admins see all. is_admin can only be changed in the dashboard / by service role.
create policy "profiles self read" on profiles for select using (id = auth.uid() or is_admin());
create policy "profiles self update" on profiles for update using (id = auth.uid())
  with check (id = auth.uid() and is_admin = is_admin()); -- users cannot promote themselves

-- Catalogue: public read (active only), admin write
create policy "categories public read" on categories for select using (true);
create policy "categories admin write" on categories for all using (is_admin()) with check (is_admin());

create policy "products public read" on products for select using (is_active or is_admin());
create policy "products admin write" on products for all using (is_admin()) with check (is_admin());

create policy "variants public read" on product_variants for select using (true);
create policy "variants admin write" on product_variants for all using (is_admin()) with check (is_admin());

create policy "images public read" on product_images for select using (true);
create policy "images admin write" on product_images for all using (is_admin()) with check (is_admin());

-- Addresses: owner only
create policy "addresses owner" on addresses for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Orders: customers read their own. Inserts/updates happen server-side with the service role
-- (prices are recomputed on the server, never trusted from the browser). Admins read/update all.
create policy "orders owner read" on orders for select using (user_id = auth.uid() or is_admin());
create policy "orders admin update" on orders for update using (is_admin()) with check (is_admin());

create policy "order_items owner read" on order_items for select using (
  exists (select 1 from orders o where o.id = order_id and (o.user_id = auth.uid() or is_admin()))
);

create policy "settings public read" on settings for select using (true);
create policy "settings admin write" on settings for update using (is_admin()) with check (is_admin());

-- ───────────────────────── Storage ─────────────────────────
insert into storage.buckets (id, name, public) values ('product-images', 'product-images', true)
  on conflict (id) do nothing;

create policy "product images public read" on storage.objects for select
  using (bucket_id = 'product-images');
create policy "product images admin write" on storage.objects for insert
  with check (bucket_id = 'product-images' and is_admin());
create policy "product images admin delete" on storage.objects for delete
  using (bucket_id = 'product-images' and is_admin());

-- ───────────────────────── Stock ─────────────────────────
-- Called by the server after a payment is verified. Decrements stock for in-stock lines.
create or replace function decrement_stock_for_order(p_order_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare it record;
begin
  for it in select * from order_items where order_id = p_order_id and product_id is not null loop
    if it.product_type = 'running_material' then
      update products set stock_qty = greatest(stock_qty - it.length_metres * it.quantity, 0)
        where id = it.product_id;
    elsif it.size is not null and exists (
      select 1 from product_variants where product_id = it.product_id and size = it.size
    ) then
      update product_variants set stock_qty = greatest(stock_qty - it.quantity, 0)
        where product_id = it.product_id and size = it.size;
    elsif it.dispatch_type = 'in_stock' then
      update products set stock_qty = greatest(stock_qty - it.quantity, 0) where id = it.product_id;
    end if;
  end loop;
end $$;
revoke execute on function decrement_stock_for_order(uuid) from public, anon, authenticated;
