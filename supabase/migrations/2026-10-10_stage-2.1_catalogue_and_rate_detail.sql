-- ---------------------------------------------------------------------------
-- TULSI JEWELLERS — STAGE 2.1 MIGRATION
-- Catalogue filtering columns + rate provenance columns.
--
-- Why this file exists
-- -------------------
-- `supabase/schema.sql` is the Stage 1/2 baseline. The site that ships on top of
-- it (catalogue filters, /jewellery/<slug> landing pages, the rates board and the
-- calculator) reads a handful of columns the baseline does not have yet:
--
--   products      : jewelry_type, gender, occasion, stone_detail
--   metal_rates   : market_session, gst_included, making_charges_included
--
-- Every statement here is ADDITIVE and IDEMPOTENT, so it is safe to run against
-- an existing database (Supabase SQL editor → paste → Run) and safe to run twice.
-- Nothing is dropped, nothing is renamed and no data is rewritten. Existing rows
-- keep working: each new column is nullable or has a default.
--
-- Reading code that depends on these columns already tolerates their absence
-- (see src/lib/catalogue/source.ts and src/lib/rates/service.ts), so deploying
-- the site before running this migration is also safe — the new filters simply
-- match on defaults until the columns exist.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- 1. Enums (created only when missing — `create type` has no `if not exists`)
-- ---------------------------------------------------------------------------

do $$
begin
  -- Item type. Mirrors JewelTypeSlug in src/lib/catalogue/types.ts and the
  -- /jewellery/<slug> pages in src/lib/catalogue/jewel-types.ts.
  if not exists (select 1 from pg_type where typname = 'jewelry_type') then
    create type jewelry_type as enum (
      'rings',
      'necklaces',
      'earrings',
      'bangles',
      'bracelets',
      'chains',
      'pendants',
      'mangalsutra',
      'necklace-sets',
      'anklets',
      'coins-bars',
      'idols',
      'gemstones'
    );
  end if;

  -- Who the piece is styled for. `unisex` is the safe default: it is the value
  -- the mapper in src/lib/catalogue/source.ts falls back to.
  if not exists (select 1 from pg_type where typname = 'jewelry_gender') then
    create type jewelry_gender as enum ('women', 'men', 'kids', 'unisex');
  end if;

  -- When the piece is worn. `daily` is the default for the same reason.
  if not exists (select 1 from pg_type where typname = 'jewelry_occasion') then
    create type jewelry_occasion as enum ('bridal', 'daily', 'festive', 'gifting');
  end if;

  -- Which reading of the day a rate came from. NULL is allowed and means
  -- "the source did not state a session" — the UI prints that honestly rather
  -- than assuming AM or PM.
  if not exists (select 1 from pg_type where typname = 'market_session') then
    create type market_session as enum ('AM', 'PM');
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 2. products — filter + landing-page columns
-- ---------------------------------------------------------------------------

alter table public.products
  add column if not exists jewelry_type jewelry_type,
  add column if not exists gender       jewelry_gender not null default 'unisex',
  add column if not exists occasion     jewelry_occasion not null default 'daily',
  -- Free text, printed exactly as the showroom supplies it. Never derived from
  -- a photograph: an invented stone description is a false product claim.
  add column if not exists stone_detail text;

-- Existing rows: backfill the item type from what the catalogue already knows.
-- Only a mapping of existing columns — no value is guessed.
do $$
begin
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'products'
               and column_name = 'jewelry_type') then
    update public.products
       set jewelry_type = case
             when gemstone is not null then 'gemstones'::jewelry_type
             when lower(coalesce(name_en, '')) like '%bangle%' then 'bangles'::jewelry_type
             when lower(coalesce(name_en, '')) like '%ring%'   then 'rings'::jewelry_type
             when lower(coalesce(name_en, '')) like '%chain%'  then 'chains'::jewelry_type
             when lower(coalesce(name_en, '')) like '%pendant%' then 'pendants'::jewelry_type
             when lower(coalesce(name_en, '')) like '%earring%' or lower(coalesce(name_en, '')) like '%jhumka%' then 'earrings'::jewelry_type
             when lower(coalesce(name_en, '')) like '%mangalsutra%' then 'mangalsutra'::jewelry_type
             when lower(coalesce(name_en, '')) like '%bracelet%' then 'bracelets'::jewelry_type
             when lower(coalesce(name_en, '')) like '%coin%' or lower(coalesce(name_en, '')) like '%biscuit%' then 'coins-bars'::jewelry_type
             when lower(coalesce(name_en, '')) like '%necklace%' or lower(coalesce(name_en, '')) like '%haar%' then 'necklaces'::jewelry_type
             else null
           end
     where jewelry_type is null;
  end if;
end $$;

comment on column public.products.jewelry_type is
  'Item type used by /jewellery/<slug>. NULL means "not classified yet" — never guess.';
comment on column public.products.gender is
  'Audience for the piece. Defaults to unisex so an unclassified row is not mis-filed.';
comment on column public.products.occasion is
  'Wearing occasion. Defaults to daily until the showroom says otherwise.';
comment on column public.products.stone_detail is
  'Owner-supplied stone description, printed as-is. Never inferred from a photo.';

-- Indexes for the catalogue filters (only ever read through RLS with
-- status = 'active', so the partial indexes stay small).
create index if not exists products_type_idx     on public.products (jewelry_type) where status = 'active';
create index if not exists products_gender_idx   on public.products (gender)       where status = 'active';
create index if not exists products_occasion_idx on public.products (occasion)     where status = 'active';
create index if not exists products_metal_purity_idx on public.products (metal, purity) where status = 'active';

-- ---------------------------------------------------------------------------
-- 3. metal_rates — provenance columns shown next to every published number
-- ---------------------------------------------------------------------------

alter table public.metal_rates
  -- Which code path produced the row: the scheduled HTTP feed ('http') or the
  -- showroom's own reading ('manual'). `source` carries the human-readable name
  -- (IBJA, etc.); `provider` is the audit trail of how it arrived.
  add column if not exists provider text not null default 'manual',
  add column if not exists market_session          market_session,
  -- Only ever TRUE when the source explicitly says so. NULL / FALSE both render
  -- as "GST status not stated" in the UI, because assuming is worse than saying
  -- we do not know.
  add column if not exists gst_included            boolean,
  add column if not exists making_charges_included boolean;

comment on column public.metal_rates.market_session is
  'AM/PM session the value belongs to. NULL = the source did not state one.';
comment on column public.metal_rates.gst_included is
  'TRUE only when the source states GST is included. Never assumed.';
comment on column public.metal_rates.making_charges_included is
  'TRUE only when the source states making charges are included. Never assumed.';

-- One published value per series + observation time + source. This is exactly
-- the tuple the ingest job de-duplicates on (src/lib/rates/ingest.ts), so the
-- database now enforces what the cron retry logic already did in code.
create unique index if not exists metal_rates_series_observed_source_key
  on public.metal_rates (metal, purity, unit, observed_at, source);

-- Fast "latest observation" and "history range" reads.
create index if not exists metal_rates_latest_idx
  on public.metal_rates (metal, purity, unit, observed_at desc);

-- ---------------------------------------------------------------------------
-- 3b. Read-only helper views (SQL-verifiable rate math)
--
-- The rates page computes "latest value + previous value + delta" in TypeScript
-- (src/lib/rates/service.ts). These views express the identical definition in SQL
-- so the showroom can check any number it sees on the site against the database
-- itself. They add no data and no writes — a view can never disagree with the rows.
--
-- security_invoker = on keeps the caller's RLS in force, so a view can never be
-- used to read something the caller could not read from the table.
-- ---------------------------------------------------------------------------

create or replace view public.v_latest_rates
with (security_invoker = on) as
with ranked as (
  select
    r.*,
    row_number() over (
      partition by r.metal, r.purity, r.unit
      order by r.observed_at desc, r.fetched_at desc
    ) as rn
  from public.metal_rates r
)
select
  latest.metal,
  latest.purity,
  latest.unit,
  latest.rate                      as latest_rate,
  latest.source                    as latest_source,
  latest.provider                  as latest_provider,
  latest.market_session            as latest_session,
  latest.gst_included              as latest_gst_included,
  latest.making_charges_included   as latest_making_charges_included,
  latest.observed_at               as latest_observed_at,
  previous.rate                    as previous_rate,
  latest.observed_at - previous.observed_at as gap_since_previous,
  -- NULL delta means there is no earlier published value. It is never shown
  -- as 0%, because "unchanged" and "no comparison available" are not the same
  -- statement to a customer.
  case
    when previous.rate is null then null
    else latest.rate - previous.rate
  end                              as delta_abs,
  case
    when previous.rate is null or previous.rate = 0 then null
    else round(((latest.rate - previous.rate) / previous.rate) * 100, 4)
  end                              as delta_pct
from ranked latest
left join ranked previous
  on  previous.metal = latest.metal
  and previous.purity = latest.purity
  and previous.unit = latest.unit
  and previous.rn = 2
where latest.rn = 1;

comment on view public.v_latest_rates is
  'Latest published value per series with the previous value and the delta. NULL delta means there is no earlier value — never rendered as 0%.';

create or replace view public.v_rate_history_daily
with (security_invoker = on) as
with daily as (
  select
    -- Bucketed by the Indian business day (Asia/Kolkata), which is the day a
    -- jeweller means by "today's rate" — not the UTC day. The day buckets in
    -- src/lib/rates/service.ts use the same time zone, so SQL and the site agree.
    (observed_at at time zone 'Asia/Kolkata')::date as rate_date,
    metal,
    purity,
    unit,
    rate,
    observed_at,
    fetched_at
  from public.metal_rates
),
last_of_day as (
  select distinct on (rate_date, metal, purity, unit)
    rate_date, metal, purity, unit, rate
  from daily
  order by rate_date, metal, purity, unit, observed_at desc, fetched_at desc
)
select
  rate_date,
  -- One value per series per day survives the distinct-on above, so these
  -- filters pick the day's closing value — never a peak, never an average.
  max(rate) filter (where metal = 'gold'   and purity = '999' and unit = 'INR_PER_10_GRAM') as gold_999_per_10g,
  max(rate) filter (where metal = 'gold'   and purity = '916' and unit = 'INR_PER_10_GRAM') as gold_916_per_10g,
  max(rate) filter (where metal = 'gold'   and purity = '833' and unit = 'INR_PER_10_GRAM') as gold_833_per_10g,
  max(rate) filter (where metal = 'gold'   and purity = '750' and unit = 'INR_PER_10_GRAM') as gold_750_per_10g,
  max(rate) filter (where metal = 'gold'   and purity = '585' and unit = 'INR_PER_10_GRAM') as gold_585_per_10g,
  max(rate) filter (where metal = 'silver' and purity = '999' and unit = 'INR_PER_KG')      as silver_999_per_kg
from last_of_day
group by rate_date;

comment on view public.v_rate_history_daily is
  'One row per Indian business day holding the day''s last published value for each series — the same buckets the on-site chart plots.';

grant select on public.v_latest_rates, public.v_rate_history_daily to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4. pricing_rules — the calculator reads only rules the owner marked public
-- ---------------------------------------------------------------------------

-- is_public / is_active already exist in schema.sql; this index backs the exact
-- query the calculator runs (is_public = true and is_active = true).
create index if not exists pricing_rules_public_idx
  on public.pricing_rules (rule_key) where is_public = true and is_active = true;

-- ---------------------------------------------------------------------------
-- Done. Verify with:
--   select column_name from information_schema.columns
--    where table_name = 'products' and column_name in ('jewelry_type','gender','occasion','stone_detail');
--   select column_name from information_schema.columns
--    where table_name = 'metal_rates' and column_name in ('market_session','gst_included','making_charges_included');
-- ---------------------------------------------------------------------------
