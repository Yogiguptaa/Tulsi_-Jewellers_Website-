-- ---------------------------------------------------------------------------
-- Stage 12 — automatic daily spot rates (metals.dev) + monthly call accounting
--
-- WHAT THIS ADDS
--   1. metal_rates.rate_type — how a number was produced:
--        'benchmark'      a published benchmark (e.g. an IBJA reading)
--        'spot_converted' an international spot price converted to INR for the
--                         Indian purities (24K/22K/20K/18K, silver 999)
--        'manual'         the showroom's own entry
--      The public page uses this (with `provider`) to say plainly that a
--      converted spot price is not the IBJA benchmark.
--   2. rate_api_usage — one row per provider per calendar month (Asia/Kolkata),
--      so the scheduled job can stop before it spends the last 10% of the free
--      plan's 100 calls/month instead of failing silently at the hard cap.
--
-- Safe to re-run. Run it in the Supabase SQL editor, or with `supabase db push`.
-- ---------------------------------------------------------------------------

-- --- 1. rate_type ------------------------------------------------------------

alter table public.metal_rates
  add column if not exists rate_type text not null default 'benchmark';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'metal_rates_rate_type_check'
  ) then
    alter table public.metal_rates
      add constraint metal_rates_rate_type_check
      check (rate_type in ('benchmark', 'spot_converted', 'manual'));
  end if;
end $$;

comment on column public.metal_rates.rate_type is
  'How the value was produced: benchmark = published benchmark; spot_converted = international spot price converted to INR for an Indian purity; manual = the showroom''s own entry.';

-- Existing rows were hand-entered or benchmark reads unless a provider says
-- otherwise; the backfill is derived from the provenance columns already there.
update public.metal_rates
  set rate_type = case
    when provider = 'manual' then 'manual'
    else 'benchmark'
  end
  where rate_type = 'benchmark' and provider = 'manual';

create index if not exists metal_rates_type_idx
  on public.metal_rates (metal, purity, unit, rate_type, observed_at desc);

-- --- 2. rate_api_usage ------------------------------------------------------

create table if not exists public.rate_api_usage (
  id            uuid primary key default gen_random_uuid(),
  -- Provider id as stored on metal_rates.provider (e.g. 'metalsdev').
  provider      text not null,
  -- Calendar month in the showroom's time zone: 'YYYY-MM'.
  month         text not null,
  calls         integer not null default 0 check (calls >= 0),
  -- The configured allowance for that month, recorded so a later change of
  -- RATE_API_MONTHLY_LIMIT does not rewrite history.
  monthly_limit integer,
  last_call_at  timestamptz,
  created_at    timestamptz not null default now(),
  unique (provider, month)
);

comment on table public.rate_api_usage is
  'One row per provider per month (Asia/Kolkata). Written only by the scheduled rate job with the service role; readable by admins.';

alter table public.rate_api_usage enable row level security;

-- Admins may read it on the Rates health card. There is deliberately no anon
-- policy: quota is operational information, not public data.
drop policy if exists "rate_api_usage admin select" on public.rate_api_usage;
create policy "rate_api_usage admin select"
  on public.rate_api_usage for select
  to authenticated
  using (public.is_admin());

drop policy if exists "rate_api_usage admin all" on public.rate_api_usage;
create policy "rate_api_usage admin all"
  on public.rate_api_usage for all
  to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- --- 3. Verify --------------------------------------------------------------
--   select rate_type, provider, count(*) from public.metal_rates group by 1, 2;
--   select provider, month, calls, monthly_limit, last_call_at
--     from public.rate_api_usage order by month desc;
--   set role anon;
--   select count(*) from public.rate_api_usage;   -- 0 (no anon policy)
--   reset role;
-- ---------------------------------------------------------------------------
