-- ============================================================================
-- TULSI JEWELLERS — Supabase schema (Stage 2)
-- ----------------------------------------------------------------------------
-- How to apply:
--   1. Supabase Dashboard → SQL Editor → New query → paste this file → Run.
--   2. Paste and run `seed.sql` afterwards.
--   3. Create an auth user (Dashboard → Authentication → Users → Add user),
--      then promote it (see the commented block at the bottom of seed.sql).
--
-- Notes:
--   * Idempotent: safe to re-run (IF NOT EXISTS / DROP policy IF EXISTS).
--   * RLS is ENABLED on every table; there is deliberately NO `FORCE`,
--     so the `postgres` role (SQL Editor) still sees all rows. To see RLS
--     effects run the tests in `RLS_TESTING.md`.
--   * Hard business rules encoded here:
--       - metal_rates.rate must be > 0   (no ₹0 / fake rate cards)
--       - products.price_inr must be NULL or > 0
--       - products.status defaults to 'draft'  (nothing goes public by accident)
--       - reviews has NO public insert policy  (no fake reviews, ever)
--       - no business info lives in the DB — that is `src/lib/config.ts` only
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Extensions
-- ----------------------------------------------------------------------------
-- trigram index powers the Stage-4 catalogue search (name_en / name_hi).
create extension if not exists pg_trgm with schema extensions;

-- ----------------------------------------------------------------------------
-- Enums
-- ----------------------------------------------------------------------------
do $$ begin
  create type product_status as enum ('draft', 'active', 'archived');
exception when duplicate_object then null; end $$;

do $$ begin
  create type metal_kind as enum ('gold', 'silver', 'fashion', 'gemstone');
exception when duplicate_object then null; end $$;

do $$ begin
  create type metal_purity as enum ('24K', '22K', '20K', '18K', '14K', '925', 'other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type availability_state as enum ('on_enquiry', 'in_stock', 'sold_out');
exception when duplicate_object then null; end $$;

do $$ begin
  create type rate_metal as enum ('gold', 'silver');
exception when duplicate_object then null; end $$;

do $$ begin
  create type rate_unit as enum ('INR_PER_10_GRAM', 'INR_PER_KG');
exception when duplicate_object then null; end $$;

do $$ begin
  create type enquiry_kind as enum ('product', 'general');
exception when duplicate_object then null; end $$;

do $$ begin
  create type enquiry_status as enum ('new', 'in_progress', 'resolved', 'closed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type review_status as enum ('pending', 'approved', 'rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type job_status as enum ('success', 'error', 'skipped');
exception when duplicate_object then null; end $$;

do $$ begin
  create type admin_role as enum ('owner', 'staff');
exception when duplicate_object then null; end $$;

-- ----------------------------------------------------------------------------
-- Helper: updated_at trigger
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- TABLE: admin_users  (who may use /admin; is_admin() reads this)
-- ----------------------------------------------------------------------------
create table if not exists public.admin_users (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  email       text not null,
  role        admin_role not null default 'staff',
  created_at  timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- Helper: is_admin() — SECURITY DEFINER so policies that read admin_users
-- do not recurse through admin_users' own RLS policy.
-- Granted to anon too: with no session auth.uid() is NULL → returns false.
-- (Must be created AFTER admin_users — SQL function bodies are validated
-- against the catalog at creation time.)
-- ----------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = (select auth.uid())
  );
$$;

revoke execute on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated, service_role;

-- ----------------------------------------------------------------------------
-- TABLE: categories  (the six product lines from config COLLECTIONS)
-- ----------------------------------------------------------------------------
create table if not exists public.categories (
  id             uuid primary key default gen_random_uuid(),
  slug           text not null unique,
  name_en        text not null,
  name_hi        text not null,
  description_en text,
  description_hi text,
  sort_order     integer not null default 0,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- TABLE: products
--   status 'draft' by default → never publicly visible until an admin
--   explicitly activates it. price_inr NULL + is_price_on_request = true
--   means "price on request" — never renders as ₹0.
-- ----------------------------------------------------------------------------
create table if not exists public.products (
  id                 uuid primary key default gen_random_uuid(),
  code               text not null unique,          -- stable code used by the wishlist
  slug               text not null unique,
  category_id        uuid not null references public.categories (id) on delete restrict,
  name_en            text not null,
  name_hi            text not null,
  description_en     text,
  description_hi     text,
  metal              metal_kind,
  purity             metal_purity,
  gemstone           text,                            -- gemstone slug, gems category only
  weight_grams       numeric(12, 3) check (weight_grams is null or weight_grams > 0),
  price_inr          numeric(12, 2) check (price_inr is null or price_inr > 0),
  is_price_on_request boolean not null default true,
  availability       availability_state not null default 'on_enquiry',
  status             product_status not null default 'draft',
  is_featured        boolean not null default false,
  sort_order         integer not null default 0,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- TABLE: product_images
-- ----------------------------------------------------------------------------
create table if not exists public.product_images (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products (id) on delete cascade,
  url         text not null,
  alt_en      text not null default '',
  alt_hi      text not null default '',
  position    integer not null default 0,
  is_primary  boolean not null default false,
  created_at  timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- TABLE: metal_rates  (Stage 5 writes; starts EMPTY — no fake rates ever)
-- ----------------------------------------------------------------------------
create table if not exists public.metal_rates (
  id          uuid primary key default gen_random_uuid(),
  metal       rate_metal not null,
  purity      text not null,               -- fineness: '999', '916', '833', '750', '585'
  unit        rate_unit not null,
  rate        numeric(12, 2) not null check (rate > 0),
  source      text not null,               -- which provider this value came from
  observed_at timestamptz not null,        -- when the rate was observed (drives staleness)
  fetched_at  timestamptz not null default now(),
  created_at  timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- TABLE: pricing_rules  (GST / making-charge style config for the admin panel.
--         is_public = false keeps a rule admin-only until the owner opts in.)
-- ----------------------------------------------------------------------------
create table if not exists public.pricing_rules (
  id          uuid primary key default gen_random_uuid(),
  rule_key    text not null unique,
  label_en    text not null,
  label_hi    text,
  value       numeric(12, 4) not null,
  unit        text not null,               -- e.g. 'percent', 'INR_PER_GRAM'
  is_active   boolean not null default true,
  is_public   boolean not null default false,
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- TABLE: enquiries  (product + general contact forms; public may INSERT only)
-- ----------------------------------------------------------------------------
create table if not exists public.enquiries (
  id          uuid primary key default gen_random_uuid(),
  kind        enquiry_kind not null default 'general',
  product_id  uuid references public.products (id) on delete set null,
  name        text not null check (char_length(name) between 2 and 120),
  phone       text not null check (char_length(phone) between 7 and 20),
  email       text check (email is null or char_length(email) between 5 and 254),
  message     text not null check (char_length(message) between 1 and 4000),
  status      enquiry_status not null default 'new',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- TABLE: scheme_enquiries  (Gold Saving Scheme — enquiry/visit based, no payment)
-- ----------------------------------------------------------------------------
create table if not exists public.scheme_enquiries (
  id              uuid primary key default gen_random_uuid(),
  name            text not null check (char_length(name) between 2 and 120),
  phone           text not null check (char_length(phone) between 7 and 20),
  email           text check (email is null or char_length(email) between 5 and 254),
  monthly_amount  numeric(12, 2) check (monthly_amount is null or monthly_amount > 0),
  message         text check (message is null or char_length(message) <= 4000),
  status          enquiry_status not null default 'new',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- TABLE: announcements  (factual copy only; public sees only live rows)
-- ----------------------------------------------------------------------------
create table if not exists public.announcements (
  id          uuid primary key default gen_random_uuid(),
  message_en  text not null,
  message_hi  text not null,
  is_active   boolean not null default false,
  starts_at   timestamptz,
  ends_at     timestamptz,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  check (ends_at is null or starts_at is null or ends_at > starts_at)
);

-- ----------------------------------------------------------------------------
-- TABLE: faqs  (bilingual; answers must only state verified facts)
-- ----------------------------------------------------------------------------
create table if not exists public.faqs (
  id            uuid primary key default gen_random_uuid(),
  question_en   text not null,
  question_hi   text not null,
  answer_en     text not null,
  answer_hi     text not null,
  category      text,
  sort_order    integer not null default 0,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- TABLE: reviews  (EMPTY by design — no seed data, no public insert policy.
--         Rows may only be created by the service role / admin dashboard and
--         only from genuine customer feedback the owner has approved.)
-- ----------------------------------------------------------------------------
create table if not exists public.reviews (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid references public.products (id) on delete set null,
  author_name text not null,
  rating      integer not null check (rating between 1 and 5),
  comment     text check (comment is null or char_length(comment) <= 2000),
  status      review_status not null default 'pending',
  source      text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- TABLE: site_settings  (key/value; only is_public rows are readable by anon)
-- ----------------------------------------------------------------------------
create table if not exists public.site_settings (
  key         text primary key,
  value       jsonb not null,
  description text,
  is_public   boolean not null default false,
  updated_at  timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- TABLE: rate_job_logs  (Stage 5 cron observability; admin-only read)
-- ----------------------------------------------------------------------------
create table if not exists public.rate_job_logs (
  id            uuid primary key default gen_random_uuid(),
  job           text not null,
  status        job_status not null,
  message       text,
  rows_affected integer,
  duration_ms   integer,
  created_at    timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- updated_at triggers
-- ----------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'categories', 'products', 'pricing_rules', 'enquiries', 'scheme_enquiries',
    'announcements', 'faqs', 'reviews', 'site_settings'
  ] loop
    execute format('drop trigger if exists set_updated_at on public.%I', t);
    execute format(
      'create trigger set_updated_at before update on public.%I
         for each row execute function public.set_updated_at()', t);
  end loop;
end $$;

-- ----------------------------------------------------------------------------
-- Indexes
-- ----------------------------------------------------------------------------
create index if not exists categories_sort_idx      on public.categories (sort_order);
create index if not exists products_category_idx    on public.products (category_id);
create index if not exists products_status_idx      on public.products (status);
create index if not exists products_featured_idx    on public.products (is_featured) where status = 'active';
create index if not exists products_name_en_trgm    on public.products using gin (name_en gin_trgm_ops);
create index if not exists products_name_hi_trgm    on public.products using gin (name_hi gin_trgm_ops);
create index if not exists product_images_pos_idx   on public.product_images (product_id, position);
create index if not exists metal_rates_latest_idx   on public.metal_rates (metal, purity, observed_at desc);
create index if not exists metal_rates_seen_idx     on public.metal_rates (observed_at desc);
create index if not exists enquiries_status_idx     on public.enquiries (status, created_at desc);
create index if not exists enquiries_created_idx    on public.enquiries (created_at desc);
create index if not exists scheme_status_idx        on public.scheme_enquiries (status, created_at desc);
create index if not exists announcements_live_idx   on public.announcements (is_active, starts_at, ends_at);
create index if not exists faqs_active_sort_idx     on public.faqs (is_active, sort_order);
create index if not exists reviews_status_idx       on public.reviews (status, created_at desc);
create index if not exists rate_job_logs_created    on public.rate_job_logs (created_at desc);

-- ----------------------------------------------------------------------------
-- Storage: public bucket for product images (Stage 8 admin upload)
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- ----------------------------------------------------------------------------
-- GRANTS
-- Supabase already ships permissive default privileges; these make them
-- explicit. Table-level grants are the coarse gate — RLS decides row access.
-- anon gets INSERT only on the two enquiry tables (public forms).
-- ----------------------------------------------------------------------------
grant usage on schema public to anon, authenticated, service_role;
grant select on all tables in schema public to anon, authenticated;
grant insert, update, delete on all tables in schema public to authenticated, service_role;
grant insert on public.enquiries, public.scheme_enquiries to anon;
alter default privileges in schema public
  grant select on tables to anon, authenticated;
alter default privileges in schema public
  grant insert, update, delete on tables to authenticated, service_role;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
alter table public.admin_users     enable row level security;
alter table public.categories      enable row level security;
alter table public.products        enable row level security;
alter table public.product_images  enable row level security;
alter table public.metal_rates     enable row level security;
alter table public.pricing_rules   enable row level security;
alter table public.enquiries       enable row level security;
alter table public.scheme_enquiries enable row level security;
alter table public.announcements   enable row level security;
alter table public.faqs            enable row level security;
alter table public.reviews         enable row level security;
alter table public.site_settings   enable row level security;
alter table public.rate_job_logs   enable row level security;

-- --- admin_users: self-read + admin-read; writes via service role only ------
drop policy if exists "admin_users self or admin select" on public.admin_users;
create policy "admin_users self or admin select"
  on public.admin_users for select
  to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());

drop policy if exists "admin_users admin write" on public.admin_users;
create policy "admin_users admin write"
  on public.admin_users for all
  to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- --- categories: public sees active; admin manages --------------------------
drop policy if exists "categories public select" on public.categories;
create policy "categories public select"
  on public.categories for select
  to anon, authenticated
  using (is_active = true);

drop policy if exists "categories admin all" on public.categories;
create policy "categories admin all"
  on public.categories for all
  to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- --- products: public sees active only; admin sees & manages all ------------
drop policy if exists "products public select" on public.products;
create policy "products public select"
  on public.products for select
  to anon, authenticated
  using (status = 'active');

drop policy if exists "products admin all" on public.products;
create policy "products admin all"
  on public.products for all
  to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- --- product_images: public sees images of active products ------------------
drop policy if exists "product_images public select" on public.product_images;
create policy "product_images public select"
  on public.product_images for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.products p
      where p.id = product_id and p.status = 'active'
    )
  );

drop policy if exists "product_images admin all" on public.product_images;
create policy "product_images admin all"
  on public.product_images for all
  to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- --- metal_rates: public read (rates are public info); admin/service write --
drop policy if exists "metal_rates public select" on public.metal_rates;
create policy "metal_rates public select"
  on public.metal_rates for select
  to anon, authenticated
  using (true);

drop policy if exists "metal_rates admin all" on public.metal_rates;
create policy "metal_rates admin all"
  on public.metal_rates for all
  to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- --- pricing_rules: is_public rows readable by everyone; rest admin-only ----
drop policy if exists "pricing_rules public select" on public.pricing_rules;
create policy "pricing_rules public select"
  on public.pricing_rules for select
  to anon, authenticated
  using (is_public = true);

drop policy if exists "pricing_rules admin all" on public.pricing_rules;
create policy "pricing_rules admin all"
  on public.pricing_rules for all
  to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- --- enquiries: anon/authenticated INSERT only; nobody reads but admin -------
--   (no select policy for anon/authenticated → form spam cannot read back
--    other visitors' details; no update/delete policy → immutable to public)
drop policy if exists "enquiries public insert" on public.enquiries;
create policy "enquiries public insert"
  on public.enquiries for insert
  to anon, authenticated
  with check (status = 'new');

drop policy if exists "enquiries admin all" on public.enquiries;
create policy "enquiries admin all"
  on public.enquiries for all
  to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- --- scheme_enquiries: same shape as enquiries ------------------------------
drop policy if exists "scheme_enquiries public insert" on public.scheme_enquiries;
create policy "scheme_enquiries public insert"
  on public.scheme_enquiries for insert
  to anon, authenticated
  with check (status = 'new');

drop policy if exists "scheme_enquiries admin all" on public.scheme_enquiries;
create policy "scheme_enquiries admin all"
  on public.scheme_enquiries for all
  to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- --- announcements: public sees only currently-live rows --------------------
drop policy if exists "announcements public select" on public.announcements;
create policy "announcements public select"
  on public.announcements for select
  to anon, authenticated
  using (
    is_active = true
    and (starts_at is null or starts_at <= now())
    and (ends_at is null or ends_at >= now())
  );

drop policy if exists "announcements admin all" on public.announcements;
create policy "announcements admin all"
  on public.announcements for all
  to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- --- faqs: public sees active; admin manages -------------------------------
drop policy if exists "faqs public select" on public.faqs;
create policy "faqs public select"
  on public.faqs for select
  to anon, authenticated
  using (is_active = true);

drop policy if exists "faqs admin all" on public.faqs;
create policy "faqs admin all"
  on public.faqs for all
  to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- --- reviews: public reads APPROVED only. No public insert policy exists →
--   fake reviews are structurally impossible from the website. ---------------
drop policy if exists "reviews public select" on public.reviews;
create policy "reviews public select"
  on public.reviews for select
  to anon, authenticated
  using (status = 'approved');

drop policy if exists "reviews admin all" on public.reviews;
create policy "reviews admin all"
  on public.reviews for all
  to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- --- site_settings: is_public rows only; rest admin-only --------------------
drop policy if exists "site_settings public select" on public.site_settings;
create policy "site_settings public select"
  on public.site_settings for select
  to anon, authenticated
  using (is_public = true);

drop policy if exists "site_settings admin all" on public.site_settings;
create policy "site_settings admin all"
  on public.site_settings for all
  to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- --- rate_job_logs: admin read; writes come from the cron service role ------
drop policy if exists "rate_job_logs admin select" on public.rate_job_logs;
create policy "rate_job_logs admin select"
  on public.rate_job_logs for select
  to authenticated
  using (public.is_admin());

-- --- storage: public bucket read, admin-only write -------------------------
drop policy if exists "product-images public read" on storage.objects;
create policy "product-images public read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'product-images');

drop policy if exists "product-images admin insert" on storage.objects;
create policy "product-images admin insert"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "product-images admin update" on storage.objects;
create policy "product-images admin update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'product-images' and public.is_admin())
  with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "product-images admin delete" on storage.objects;
create policy "product-images admin delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'product-images' and public.is_admin());

-- ============================================================================
-- END OF SCHEMA. Now run seed.sql.
-- ============================================================================
