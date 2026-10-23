-- ---------------------------------------------------------------------------
-- TULSI JEWELLERS — STAGE 8 MIGRATION (admin audit log)
--
-- Why this file exists
-- -------------------
-- `supabase/schema.sql` gives `rate_job_logs` an admin SELECT policy only:
-- writes were expected to come from the scheduled cron job, which uses the
-- service-role key and therefore bypasses RLS.
--
-- The /admin panel records manual benchmark entries with the *signed-in admin's
-- own session* (never the service-role key), so that path needs an INSERT policy,
-- otherwise a manual entry would be published without a matching audit row — and
-- the acceptance criterion is that every rate change is logged.
--
-- What this does NOT do: it grants no read access to anything new, no UPDATE and
-- no DELETE. A log entry, once written, cannot be altered or removed from the
-- admin panel, which is the point of an audit trail.
--
-- Additive and idempotent: safe to run against an existing database, safe to run
-- twice.
-- ---------------------------------------------------------------------------

drop policy if exists "rate_job_logs admin insert" on public.rate_job_logs;
create policy "rate_job_logs admin insert"
  on public.rate_job_logs for insert
  to authenticated
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Verify (run these afterwards; each line should report what is described)
-- ---------------------------------------------------------------------------
-- 1. The policy exists exactly once and only covers INSERT:
--    select policyname, cmd, roles from pg_policies
--     where tablename = 'rate_job_logs';
--
-- 2. An admin can log, a signed-out visitor cannot (expect: 1 row / error):
--    insert into public.rate_job_logs (job, status, message)
--    values ('manual-entry', 'success', 'policy check');
--
-- 3. The admin panel's Rates page "Job log" panel shows the row above.
-- ---------------------------------------------------------------------------
