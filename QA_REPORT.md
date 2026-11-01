# QA_REPORT.md — final polish round (1 Nov 2026)

What was tested, what passed, and what cannot be automated from this machine.
Nothing below is a claim about a surface that was not actually exercised.

---

## 1. The rates failure — cause and fix

**Symptom on the live site:** the board said "Today's rate is being updated", and the
GitHub Action "Fetch gold and silver rates" failed after about three seconds.

**Measured cause (two independent faults, both verified by calling the deployment):**

| Check | Result |
| --- | --- |
| `GET https://tulsijewellerswebsite.vercel.app/api/cron/fetch-rates` | **503** `{"ok":false,"skipped":true,"message":"CRON_SECRET is not configured; the job refuses to run."}` in **1.4 s** — the exact "fails after 3 seconds" |
| `GET https://tulsijewellerswebsite.vercel.app/api/rates/latest` | **200**, `status: "unavailable"`, `isConfigured: false`, every line `rate: null` |
| Local `.env.local` | absent; production Vercel variables could not be inspected from here |

1. **No `CRON_SECRET` in the Vercel production environment.** The route refuses to run
   without it (by design — it is never an open write path), so the workflow's `curl -f`
   failed immediately and reported nothing useful.
2. **No persistent store in production.** Nothing was stored, with or without the cron:
   Supabase keys were never added to Vercel, and the file-backed local store is
   deliberately disabled when `NODE_ENV=production` (a serverless disk cannot keep it).
   So even a successful fetch would have had nowhere to write, and the read path had
   nothing to read.

**Fixes**

- `.github/workflows/fetch-rates.yml` rewritten: `curl` without `--fail` captures the
  HTTP status **and** the response body, then fails with a named cause per status —
  `000` (bad `SITE_URL`), `401/403` (secret mismatch or deployment protection), `404`
  (wrong path), `429` (quota), `503` (secret not set in Vercel), `5xx` (server error,
  body printed). The secret is never printed. Two schedules (04:00 and 05:00 UTC) plus
  `workflow_dispatch`; the endpoint is idempotent, so the second run costs nothing.
- `src/lib/rates/service.ts` gains a **live-feed fallback**: when no database and no
  local store are configured, the configured automatic feed is read at request time and
  rendered through the same snapshot pipeline (same validation of positive numbers,
  INR, purities, timestamps and the "converted to INR" note). It writes nothing, is
  cached for 15 minutes per instance (60 s after a failure) and falls back to the honest
  call/WhatsApp message when the feed itself fails. This is what makes the deployed
  board show today's rate **without any owner action**; adding Supabase + `CRON_SECRET`
  switches the site to the stored, scheduled path.
- `formatDateTime` now prints the zone: `1 Nov 2026, 12:13 pm IST` (it previously dropped
  the zone because `timeZoneName` cannot be combined with `timeStyle`).

**Proof, from a production build with no store configured (`next start`, `NODE_ENV=production`):**

```
/api/rates/latest → status "updated", asOf 2026-11-01T06:43:32Z, isConfigured true
gold-999 ₹1,18,335.38 / 10 g   gold-916 ₹1,08,503.71 / 10 g   gold-833 ₹98,672.04 / 10 g
gold-750 ₹88,840.37 / 10 g     gold-585 ₹69,295.49 / 10 g     silver-999 ₹1,50,358.35 / kg
customerNote: "International market price converted to INR. …"
```

`/rates` rendered the same six values with "1 Nov 2026, 12:13 pm", the source line
"International spot market (converted to INR)", the IST timestamp and
"Making charges vary by design and quality and are finalised at the shop."
No `GST`, no `benchmark`, no ₹0 and no environment text on the page.

---

## 2. The eight issues found on the live site

| # | Issue | Status | How it was checked |
| --- | --- | --- | --- |
| 1 | Rates stuck on "being updated", Action failing | Fixed (see §1) | Status codes and JSON above |
| 2 | Empty "New designs arriving" box | Fixed — the whole Featured section is omitted when there are no published products; the Popular Designs strip now takes that place | `/` HTML contains no "New designs arriving"; the strip and six `/designs/*` links render |
| 3 | Two different addresses | Fixed — the home Visit block prints `CONTACT.address`, the single source used by header, footer, Visit, Contact, schema and metadata | `Hansapuri (Itwari)` count on `/` = 0; full address present |
| 4 | Meta description said "today's benchmark rate" | Fixed → "today's gold and silver rate" | `src/app/(site)/page.tsx` + `/` HTML |
| 5 | "Design inspiration, not stock" caption | Replaced with "Popular designs. What is on the counter changes often: message us to see the latest." (EN + HI) | `/` HTML |
| 6 | "Loading…" text and a "Watch the intro" block for a film that does not exist | Fixed — the cinematic intro component, its footer replay button and its strings are removed; the route skeleton no longer prints any loading word | `Loading…` count on `/` = 0 |
| 7 | "Ask about this style" | Renamed "Enquire on WhatsApp" (EN + HI) on every style tile | 6 occurrences on `/` |
| 8 | Internal links must return 200 | Verified — 54 routes and every in-page link on `/` and `/designs` answer 200 | `npm run test:local` (see §3) |

---

## 3. Automated checks run in this round

| Check | Command | Result |
| --- | --- | --- |
| Placeholder guard | `npm run check:placeholders` | ✓ no customer-visible placeholders |
| Copy / phone / licence guard (new) | `npm run check:copy` | ✓ 5,606 strings, 11 design styles, 22 media assets |
| Types | `tsc --noEmit` | ✓ 0 errors |
| Lint | `eslint src --max-warnings=0` | ✓ 0 warnings |
| Production build | `npm run build` | ✓ exit 0, `/designs` and 11 `/designs/*` pages prerendered |
| Live smoke test (new) | `npm run test:local` / `npm run test:live` | ✓ 54 routes 200, 0 failing links, rates API 6/6 values |
| 404 for an unknown style | `GET /designs/not-a-style` | 404 |

New files that make this repeatable: `scripts/check-customer-copy.mjs`,
`scripts/smoke-live.mjs`, `.github/workflows/ci.yml`.

---

## 4. Not automated here — stated as a limitation, not a pass

- **Browser end-to-end tests, axe accessibility scans and Lighthouse** are not in this
  repository (no Playwright, no `@axe-core`, no Lighthouse dependency), and none were
  installed for this round. Those results are **not** claimed. Layout was checked by
  rendering the pages and reading the HTML; no visual screenshot review was done.
- **WhatsApp and phone call behaviour on a real handset** (prefilled message, dialler,
  two numbers) needs a person with a phone.
- **Admin flows against Supabase** — login, role gating, product create/upload, rate
  override, enquiries list — need the Supabase project and a signed-in account. The
  code paths were type-checked and linted, not executed end to end.
- **RLS policies** are written in `supabase/schema.sql` + migrations but were not
  executed against a live database.
- **Vercel Cron / Deployment Protection** settings can only be confirmed in the Vercel
  dashboard.
- **Soft 404s on some dynamic routes**: `/guides/<unknown>`, `/collections/<unknown>`,
  `/jewellery/<unknown>` and `/products/<unknown>` return HTTP 200 with a not-found
  view (a streaming artefact of the route-group `loading.tsx`). The pages show the
  correct "not found" content and are `noindex`; the status code is the gap. New
  `/designs/<unknown>` routes do return 404. Fixing the rest means changing the
  streaming boundary for the whole site, which was out of scope for this round.

---

## 5. Owner actions still needed

1. **Vercel → Settings → Environment Variables (Production and Preview):**
   `CRON_SECRET` (any long random string), then redeploy. This alone turns the failing
   GitHub Action green.
2. **GitHub → Settings → Secrets → Actions:** `CRON_SECRET` with the *same* value, and
   optionally `SITE_URL=https://tulsijewellerswebsite.vercel.app`.
3. **Supabase** (project URL + anon key + service role key in Vercel) to switch rates
   from the live fallback to stored, auditable rows with history, admin override and
   the quota counter. Run the SQL in the order listed in `docs/DEPLOY.md`.
4. Real showroom photographs and the real logo; product uploads in the admin panel.
5. Confirm the address, hours and both phone numbers match the signboard.
