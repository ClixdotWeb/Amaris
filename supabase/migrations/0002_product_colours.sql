-- Colour options per product (colour picker on the product page) and the chosen colour on each order line.
-- colours: [{ "name": "Pink", "hex": "#e88aa8", "hex2": null, "image_index": 0 }, ...]
--   hex / hex2 = swatch colour(s); hex2 is the second half for two-tone names like "Black & White".
--   image_index = position of that colour's photo in the product's images (sort_order), or null.
alter table public.products add column if not exists colours jsonb not null default '[]'::jsonb;
alter table public.order_items add column if not exists colour text;
