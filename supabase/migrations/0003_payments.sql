-- ROOTMAN MONEY ROUTE — Migration 0003: payments
-- Tables: products, orders, entitlements
-- Apply via `node scripts/db-migrate.mjs`.
-- Payment provider is abstracted (adapter) — orders store provider + external id.

-- ─────────────────────────────────────────────────────────────
-- products (catalog; seeded below)
-- price is stored in the smallest currency unit (satang for THB).
-- ─────────────────────────────────────────────────────────────
create table if not exists public.products (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique,
  name            text not null,
  product_type    text not null default 'one_time'
                    check (product_type in ('one_time', 'subscription')),
  price           integer not null,
  currency        text not null default 'thb',
  active          boolean not null default true,
  entitlement_key text not null,
  metadata        jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
-- orders
-- ─────────────────────────────────────────────────────────────
create table if not exists public.orders (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users (id) on delete cascade,
  product_id          uuid references public.products (id) on delete set null,
  payment_provider    text not null default 'stripe',
  external_payment_id text,
  status              text not null default 'pending'
                        check (status in ('pending', 'paid', 'failed', 'refunded')),
  subtotal            integer not null default 0,
  discount            integer not null default 0,
  total               integer not null default 0,
  currency            text not null default 'thb',
  metadata            jsonb not null default '{}'::jsonb,
  created_at          timestamptz not null default now(),
  paid_at             timestamptz,
  refunded_at         timestamptz
);

create index if not exists idx_orders_user
  on public.orders (user_id);
create index if not exists idx_orders_external
  on public.orders (external_payment_id);

-- ─────────────────────────────────────────────────────────────
-- entitlements (what a user is allowed to access)
-- ─────────────────────────────────────────────────────────────
create table if not exists public.entitlements (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  entitlement_key text not null,
  source_order_id uuid references public.orders (id) on delete set null,
  status          text not null default 'active'
                    check (status in ('active', 'revoked', 'expired')),
  starts_at       timestamptz not null default now(),
  expires_at      timestamptz,
  created_at      timestamptz not null default now()
);

create index if not exists idx_entitlements_user_key
  on public.entitlements (user_id, entitlement_key);

-- ─────────────────────────────────────────────────────────────
-- Row Level Security
-- Server code uses the service role key (bypasses RLS) for writes.
-- Products are publicly readable; users read their own orders/entitlements.
-- ─────────────────────────────────────────────────────────────
alter table public.products     enable row level security;
alter table public.orders       enable row level security;
alter table public.entitlements enable row level security;

create policy "products_select_all"
  on public.products for select
  using (active = true);

create policy "orders_select_own"
  on public.orders for select
  using (auth.uid() = user_id);

create policy "entitlements_select_own"
  on public.entitlements for select
  using (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- Seed: Income Blueprint (full deterministic report)
-- price 390.00 THB = 39000 satang. Launch price.
-- ─────────────────────────────────────────────────────────────
insert into public.products (slug, name, product_type, price, currency, entitlement_key, metadata)
values (
  'income_blueprint',
  'Income Blueprint',
  'one_time',
  39000,
  'thb',
  'income_blueprint',
  '{"launch_price": true}'::jsonb
)
on conflict (slug) do nothing;
