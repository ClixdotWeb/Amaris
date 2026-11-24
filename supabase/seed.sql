-- Categories (slugs must match src/config/navigation.ts)
insert into categories (slug, name, product_type, sort_order) values
  ('unstitched-salwar-suits', 'Unstitched – Salwar Suits', 'unstitched', 1),
  ('co-ord-sets', 'Co-ord Sets', 'ready_made', 2),
  ('frocks-kurtis', 'Frocks & Kurtis – Custom Made', 'custom_made', 3),
  ('ready-made', 'Ready Made', 'ready_made', 4),
  ('saree', 'Saree', 'ready_made', 5),
  ('home-linen', 'Home Linen', 'ready_made', 6),
  ('running-material', 'Running Material', 'running_material', 7),
  ('kids-dresses', 'Kids Dresses – Custom Made', 'custom_made', 8)
on conflict (slug) do nothing;

-- Placeholder settings until the client confirms (brief §9). Paise: 50000 = ₹500.
insert into settings (id, data) values (1, '{
  "default_stitching_charge": 50000,
  "stitching_charge_by_category": {},
  "shipping_kerala_per_item": 6000,
  "shipping_india_per_item": 9000,
  "free_shipping_above": 299900,
  "international_rates": {},
  "cod_enabled": false
}'::jsonb)
on conflict (id) do nothing;

-- Make yourself admin after signing up once:
-- update profiles set is_admin = true where id = (select id from auth.users where email = 'you@example.com');
