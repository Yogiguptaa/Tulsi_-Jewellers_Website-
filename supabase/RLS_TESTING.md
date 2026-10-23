# RLS test notes — Tulsi Jewellers (Stage 2)

Row Level Security is **enabled on every table** in `schema.sql`.
These checks verify the policies before any UI is built on top of them.

Run them in **Supabase Dashboard → SQL Editor** (as `postgres`) or with the
`supabase` CLI (`supabase db push` then `psql`). JWT-based checks need a
request context, so prefer the **REST test** section at the bottom.

---

## 1. Static checks (SQL Editor)

### 1.1 Every table has RLS enabled

```sql
select c.relname, c.relrowsecurity
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
  and c.relrowsecurity = false;
-- EXPECT: 0 rows. Any row returned = a table missing ENABLE ROW LEVEL SECURITY.
```

### 1.2 Policy inventory

```sql
select tablename, policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
order by tablename, policyname;
-- EXPECT: one public-select (or public-insert) + one admin policy per table.
-- rate_job_logs: admin SELECT only (cron writes use the service role, which
--   bypasses RLS — that is intentional).
-- reviews: NO insert policy for anon/authenticated — fake reviews are
--   structurally impossible from the website.
-- enquiries / scheme_enquiries: INSERT only, WITH CHECK status = 'new';
--   no SELECT/UPDATE/DELETE policy for the public.
```

### 1.3 is_admin() is SECURITY DEFINER (no RLS recursion)

```sql
select prosecdef, proconfig
from pg_proc where proname = 'is_admin';
-- EXPECT: prosecdef = true, search_path pinned to ''.
```

---

## 2. JWT-based checks (Dashboard → Authentication → test user, or REST)

SQL Editor runs as `postgres` and **bypasses RLS**, so `select * from products`
there proves nothing about what the public sees. Use the REST API instead.

### 2.0 Anonymous baseline (no Authorization header beyond the anon key)

```bash
URL="https://YOUR_PROJECT_REF.supabase.co"
ANON="YOUR_ANON_KEY"

# Products: only ACTIVE rows are visible.
curl -s "$URL/rest/v1/products?select=code,status" \
  -H "apikey: $ANON" -H "Authorization: Bearer $ANON"
# EXPECT: only status=active rows (seed data is 'draft' → empty array []).

# Categories: only is_active=true.
curl -s "$URL/rest/v1/categories?select=slug" \
  -H "apikey: $ANON" -H "Authorization: Bearer $ANON"
# EXPECT: the 6 seeded slugs.

# metal_rates: [] while empty — the UI must show the stale/empty message,
# never a fabricated rate (hard business rule).

# reviews: [] always (no approved rows exist, and anon cannot insert).
curl -s "$URL/rest/v1/reviews?select=*" \
  -H "apikey: $ANON" -H "Authorization: Bearer $ANON" | head -c 200
# EXPECT: []

# rate_job_logs / admin-only tables: [] for anon.
curl -s "$URL/rest/v1/rate_job_logs?select=*" \
  -H "apikey: $ANON" -H "Authorization: Bearer $ANON"
# EXPECT: []
```

### 2.1 Anonymous INSERT (public forms must work)

```bash
curl -s -X POST "$URL/rest/v1/enquiries" \
  -H "apikey: $ANON" -H "Authorization: Bearer $ANON" \
  -H "Content-Type: application/json" -H "Prefer: return=minimal" \
  -d '{"kind":"general","name":"RLS Test","phone":"9999999999","message":"policy check"}'
# EXPECT: 201 Created.

# ...but anon cannot READ it back (no select policy):
curl -s "$URL/rest/v1/enquiries?select=*" \
  -H "apikey: $ANON" -H "Authorization: Bearer $ANON"
# EXPECT: []

# ...and cannot set status to anything but 'new':
curl -s -X POST "$URL/rest/v1/enquiries" \
  -H "apikey: $ANON" -H "Authorization: Bearer $ANON" \
  -H "Content-Type: application/json" -H "Prefer: return=minimal" \
  -d '{"name":"X","phone":"9999999999","message":"y","status":"resolved"}'
# EXPECT: 403 (row-level security policy violation).
```

### 2.2 Admin user (Dashboard → add auth user, then promote)

```sql
-- Run as postgres in SQL Editor:
insert into public.admin_users (user_id, email, role)
select id, email, 'owner' from auth.users where email = 'you@example.com'
on conflict (user_id) do nothing;
```

```bash
# Sign in to get a JWT:
TOKEN=$(curl -s "$URL/auth/v1/token?grant_type=password" \
  -H "apikey: $ANON" -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"..."}' \
  | python3 -c "import sys,json;print(json.load(sys.stdin)['access_token'])")

# Admin can see drafts:
curl -s "$URL/rest/v1/products?select=code,status" \
  -H "apikey: $ANON" -H "Authorization: Bearer $TOKEN"
# EXPECT: draft rows now visible.

# Admin can close an enquiry:
curl -s -X PATCH "$URL/rest/v1/enquiries?status=eq.new" \
  -H "apikey: $ANON" -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" -H "Prefer: return=minimal" \
  -d '{"status":"in_progress"}'
# EXPECT: 204.
```

### 2.3 Negative check — a NON-admin authenticated user

Create a second auth user, sign in, repeat 2.2's queries:
`products` must show **active rows only**, `enquiries` PATCH must return
**403/0 rows**. If it succeeds, `is_admin()` or a policy is wrong.

---

## 3. Regression checklist (re-run after any schema.sql edit)

- [ ] 1.1 returns 0 rows (every table RLS-enabled)
- [ ] 1.2 policy inventory matches the table above
- [ ] anon sees only `active` products, `is_active` categories/faqs
- [ ] anon sees zero `reviews`, zero `rate_job_logs`, zero `pricing_rules`
      (unless `is_public = true`)
- [ ] anon INSERT into `enquiries` / `scheme_enquiries` succeeds with
      `status = 'new'`, fails with any other status
- [ ] anon can never SELECT `enquiries` (visitor privacy)
- [ ] admin user sees drafts + all statuses; non-admin user does not
- [ ] service role (cron) can INSERT `metal_rates` and `rate_job_logs`
- [ ] storage: anon can READ `product-images`, only admin can WRITE

## 4. Known intentional design points

1. **No public review submission.** Reviews are entered by the owner from the
   admin panel (Stage 8) with `status = 'approved'` only after verification.
   This is how the "no fake reviews" rule is enforced structurally.
2. **Enquiries are write-only for the public.** Visitors cannot read anyone
   else's contact details; only the admin (or service role) can.
3. **Service role bypasses RLS** — that is Postgres, not a bug. It must only
   ever live in `SUPABASE_SERVICE_ROLE_KEY` on the server.
4. **SQL Editor bypasses RLS** — never trust a SQL Editor SELECT as proof a
   policy works; use the REST tests above.
