-- ============================================================================
-- Stage 13 — rate refresh lock
--
-- /api/rates/latest can trigger ONE server-side refresh when the stored rate is
-- missing or older than six hours. This table makes that safe: a page view takes
-- a short lock before calling the provider, so ten simultaneous visitors still
-- produce one API call, not ten.
--
-- The lock is a compare-and-swap on `locked_until`: a writer may only replace the
-- value it just read. It expires by itself after five minutes, so a crashed
-- request can never block the daily schedule.
--
-- Access: service role only. No policies are created, and anon/authenticated are
-- revoked, so no browser can read or hold a lock.
-- ============================================================================

create table if not exists public.rate_refresh_locks (
  provider     text primary key,
  locked_until timestamptz not null default to_timestamp(0),
  locked_at    timestamptz,
  note         text
);

comment on table public.rate_refresh_locks is
  'Short-lived locks so only one lazy rate refresh runs at a time. Service role only.';

alter table public.rate_refresh_locks enable row level security;

revoke all on public.rate_refresh_locks from anon, authenticated;
grant all on public.rate_refresh_locks to service_role;
