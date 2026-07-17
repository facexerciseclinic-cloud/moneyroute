-- ROOTMAN MONEY ROUTE — Migration 0005: Route Kit product
-- Second one-time product. Uses the existing products/orders/entitlements
-- plumbing from 0003. Apply via `node scripts/db-migrate.mjs`.

insert into public.products (slug, name, product_type, price, currency, entitlement_key, metadata)
values (
  'route_kit',
  'Route Kit',
  'one_time',
  59000,
  'thb',
  'route_kit',
  '{"launch_price": true}'::jsonb
)
on conflict (slug) do nothing;
