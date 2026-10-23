-- ---------------------------------------------------------------------------
-- Stage 11 — external rate provider governance
--
-- WHAT THIS ADDS
--   1. metal_rates.approval_status — a value that clears validation but jumps
--      more than the approval threshold against the last published value is
--      stored as 'pending' and is NOT visible to the public until an admin
--      approves it. Values are 'auto' (published automatically), 'pending',
--      'approved' or 'rejected'.
--   2. the reason and size of the jump, and who reviewed it, so the decision is
--      auditable months later.
--   3. a public SELECT policy that can only ever return publishable rows, and
--      the same filter inside the helper views. Defence in depth: the site also
--      filters in src/lib/rates/service.ts.
--
-- WHY: switching RATE_PROVIDER=external means a third party supplies the numbers
-- the shop shows customers. A wrong-looking value must be able to arrive, be
-- stored, and still never reach a customer without a human saying yes.
--
-- Safe to re-run. Run it in the Supabase SQL editor, or with:
--   supabase db push
-- ---------------------------------------------------------------------------

-- --- 1/2. Governance columns ------------------------------------------------

alter table public.metal_rates
  add column if not exists approval_status text not null default 'auto',
  add column if not exists approval_reason text,
  -- How far the value moved from the last published value for the same series.
  -- NULL means there was nothing to compare against (first ever value).
  add column if not exists delta_pct numeric(7, 3),
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewed_by text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'metal_rates_approval_status_check'
  ) then
    alter table public.metal_rates
      add constraint metal_rates_approval_status_check
      check (approval_status in ('auto', 'pending', 'approved', 'rejected'));
  end if;
end $$;

comment on column public.metal_rates.approval_status is
  'auto = validated and published; pending = flagged by the plausibility check, awaiting admin approval; approved/rejected = the human decision. Only auto and approved rows are public.';
comment on column public.metal_rates.approval_reason is
  'Why the value was flagged, in words the shopkeeper can read (e.g. "Up 14.20% against the last published value").';
comment on column public.metal_rates.delta_pct is
  'Change against the last published value for the same series, as a percentage. NULL when there was nothing to compare.';

-- Every pre-existing row was published under the old rules, so 'auto' is the
-- correct backfill and no historical value disappears from the site.
update public.metal_rates set approval_status = 'auto' where approval_status is null;

-- --- 3. Indexes -------------------------------------------------------------

-- The admin approval queue reads exactly this.
create index if not exists metal_rates_pending_idx
  on public.metal_rates (observed_at desc)
  where approval_status = 'pending';

-- --- 4. Public reads: publishable rows only ---------------------------------

drop policy if exists "metal_rates public select" on public.metal_rates;
create policy "metal_rates public select"
  on public.metal_rates for select
  to anon, authenticated
  using (approval_status in ('auto', 'approved'));

-- Admins keep full visibility (is_admin() unchanged since schema.sql).
drop policy if exists "metal_rates admin all" on public.metal_rates;
create policy "metal_rates admin all"
  on public.metal_rates for all
  to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- --- 5. Helper views: same filter, so SQL and the site agree ----------------
-- security_invoker = on keeps the caller's RLS in force; the explicit filter
-- additionally stops an admin-run view from reporting a pending value as "the
-- latest rate", which would make the view disagree with the public page.

create or replace view public.v_latest_rates
with (security_invoker = on) as
with publishable as (
  select r.*
  from public.metal_rates r
  where r.approval_status in ('auto', 'approved')
),
ranked as (
  select
    p.*,
    row_number() over (
      partition by p.metal, p.purity, p.unit
      order by p.observed_at desc, p.fetched_at desc
    ) as rn
  from publishable p
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

create or replace view public.v_rate_history_daily
with (security_invoker = on) as
with daily as (
  select
    (observed_at at time zone 'Asia/Kolkata')::date as rate_date,
    metal,
    purity,
    unit,
    rate,
    observed_at,
    fetched_at
  from public.metal_rates
  where approval_status in ('auto', 'approved')
),
last_of_day as (
  select distinct on (rate_date, metal, purity, unit)
    rate_date, metal, purity, unit, rate
  from daily
  order by rate_date, metal, purity, unit, observed_at desc, fetched_at desc
)
select
  rate_date,
  max(rate) filter (where metal = 'gold'   and purity = '999' and unit = 'INR_PER_10_GRAM') as gold_999_per_10g,
  max(rate) filter (where metal = 'gold'   and purity = '916' and unit = 'INR_PER_10_GRAM') as gold_916_per_10g,
  max(rate) filter (where metal = 'gold'   and purity = '833' and unit = 'INR_PER_10_GRAM') as gold_833_per_10g,
  max(rate) filter (where metal = 'gold'   and purity = '750' and unit = 'INR_PER_10_GRAM') as gold_750_per_10g,
  max(rate) filter (where metal = 'gold'   and purity = '585' and unit = 'INR_PER_10_GRAM') as gold_585_per_10g,
  max(rate) filter (where metal = 'silver' and purity = '999' and unit = 'INR_PER_KG')      as silver_999_per_kg
from last_of_day
group by rate_date;

grant select on public.v_latest_rates, public.v_rate_history_daily to anon, authenticated;

-- --- 6. Verify --------------------------------------------------------------
--   select approval_status, count(*) from public.metal_rates group by 1;
--   select * from public.v_latest_rates;                      -- never 'pending'
--   set role anon;
--   select count(*) from public.metal_rates where approval_status = 'pending'; -- 0
--   reset role;
-- ---------------------------------------------------------------------------
