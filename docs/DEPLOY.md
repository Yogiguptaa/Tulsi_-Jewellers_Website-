# DEPLOY.md — putting Tulsi Jewellers online

Written for a first deployment. Follow the order: the database must exist before
the site can show rates, and the site must exist before the cron can run.

You need accounts on **GitHub**, **Vercel**, **Supabase** and **MetalCharts** (all
have a free tier). Keep every key in `.env.local`, Vercel or GitHub secrets — never
in a chat, a screenshot or a committed file.

---

## 0. Before you start

```bash
npm install
npm run check:placeholders   # must print ✓
npm run check:types
npm run lint
npm run verify   # placeholders ✓, tsc --noEmit, eslint src --max-warnings=0
npm run build
```

`npm run verify` is those first three checks in one command; CI and the deploy
guide run it instead of the individual steps.

If `.env.local` does not exist, copy `.env.example` to `.env.local`. It is already
gitignored; confirm with:

```bash
git check-ignore -v .env.local
```

### The repository must contain the whole project

Every host builds from what is **in the repository**, not from your laptop. A
repository that contains only the root files (`package.json`, `next.config.ts`, …)
and no `src/` cannot build — it fails at the first step that needs a file that is
not there. Before connecting a host, confirm the pushed tree:

```bash
git ls-files | grep -c '^src/'          # must be a few hundred, not 0
git ls-files scripts public supabase | head
```

Both lines must list real files. GitHub's *Add files via upload* page silently
drops folders when you drag individual files, so publish with `git push`:

```bash
git add -A
git commit -m "Tulsi Jewellers site"
git push origin main
```

---

## 0b. Deploying to Freebuff Sites (current deployment)

The site is prepared for Cloudflare Workers by OpenNext, so the build is a Worker
bundle, not a Node server. `npm run build` alone is not enough — use the Sites
publish flow, which runs the adapter, validates the bundle and uploads it.

- **Production URL:** <https://site-81b80269f5c845d0bc85bab1d6972b75.freebuff.page>
- **Canonical URL:** `.env.production` sets `NEXT_PUBLIC_SITE_URL` for production
  builds. It is read at *build* time (canonical tags, sitemap, robots, JSON-LD,
  share card), so change it there — or in the host's dashboard — and rebuild
  before attaching a different domain. `next dev` keeps using localhost.
- **Runtime variables:** add the Supabase keys from `.env.example` in
  Sites → Secrets. Without them the site builds and runs, but the rates board
  says “being updated”, the catalogue shows no products and the enquiry form
  asks visitors to call — all honest fallbacks, no invented data.
- **Local disk fallbacks:** `.data/` is development-only. Production builds and
  Workers have no writable disk, so the database is the only store there.
- **Social images:** `src/app/opengraph-image.png` and `apple-icon.png` are
  static files now (the Worker cannot ship the font/WASM binary that `next/og`
  needs). Re-export them if the brand text changes.

After any change: run the checks in section 0, then publish again.

---

## 1. Put the code on GitHub

1. Create an empty **private** repository, e.g. `tulsi-jewellers`.
2. In the project folder:

```bash
git add .
git commit -m "Tulsi Jewellers website"
git branch -M main
git remote add origin https://github.com/<you>/tulsi-jewellers.git
git push -u origin main
```

If `git status` shows `.env.local`, stop — it must never be committed.

---

## 2. Create the Supabase project

1. <https://supabase.com/dashboard> → **New project** (choose the region closest to
   India, e.g. Mumbai/Singapore). Save the database password somewhere safe.
2. **Project Settings → API**: copy
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (server only, never public)
3. **SQL Editor** → run these files, in this order, pasting each one whole:

   1. `supabase/schema.sql`
   2. `supabase/seed.sql`
   3. `supabase/migrations/2026-10-10_stage-2.1_catalogue_and_rate_detail.sql`
   4. `supabase/migrations/2026-10-11_stage-8_admin_audit_log.sql`
   5. `supabase/migrations/2026-10-15_stage-11_rate_provider_governance.sql`
   6. `supabase/migrations/2026-10-17_stage-12_metalsdev_daily_rates.sql`
   7. `supabase/migrations/2026-10-18_stage-13_rate_refresh_lock.sql`

4. **Authentication → Users → Add user**: create your own admin login (email +
   password). Then promote it by running the commented SQL at the end of
   `supabase/seed.sql` with your email.
5. **Storage → New bucket**: `product-images`, public read, write restricted to
   admins (the policies are in `schema.sql`).
6. Verify the public site cannot read private tables — the checklist in
   `supabase/RLS_TESTING.md` lists the exact queries.

---

## 3. Rates — nothing to buy (optional MetalCharts key)

Rates work with no signup at all. With `RATE_PROVIDER` unset, the site reads a
free international spot quote, converts it to rupees with a daily FX reference,
and stores 24K, 22K, 20K, 18K, 14K and silver 999 — one real value per purity,
refreshed once a day.

```bash
npm run dev
npm run rates:fetch          # one real fetch; prints every stored row in ₹
```

Check your own counter against it. The converted international price is lower
than an Indian jeweller's quote because duty, local premium and taxes sit on
top. When you know your gap, set it once:

```bash
# .env.local  (and Vercel) — example only, use your own number
RATE_INDIAN_MARKET_PCT=11
```

Every value then moves by that percentage and the rates page prints it as an
adjustment set by the showroom, beside the standing "Indian market rates can
differ" note. Leave it at 0 if you would rather the board show the raw converted
price.

Optional: a MetalCharts key gives you their licensed feed instead
(<https://metalcharts.org>, free plan, 200 calls/month, attribution required and
already printed). Then set `RATE_PROVIDER=metalcharts` and `RATE_API_KEY=…` and
run `node scripts/check-rate-provider.mjs`.

While developing (`npm run dev`) and without Supabase, values are kept in
`.data/rates.json` (git-ignored) so a laptop still works. That file is ignored by
production builds and by Cloudflare Workers, which have no writable disk — a
deployed site uses Supabase's `metal_rates`, and without it the board says the
rate is being updated rather than showing yesterday's number. The first page view after a six-hour gap refreshes once by
itself, with a lock and the monthly quota guard; the daily cron is the normal
path. No cron is needed for the site to work.

---

## 4. Deploy on Vercel

1. <https://vercel.com/new> → import the GitHub repository. Framework preset:
   **Next.js**. Leave the build command at the default (`npm run build`); it runs
   the Next.js CLI directly, so it needs nothing but `node_modules`. The extra
   fake-data/type/lint guard is `npm run verify`, run locally or in CI.
2. **Environment Variables** — add these for Production (repeat for Preview if you
   want preview links to work):

| Name | Value |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | from Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | from Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | from Supabase (server only) |
| `NEXT_PUBLIC_SITE_URL` | `https://your-domain` (no trailing slash) |
| `RATE_PROVIDER` | `metalcharts` |
| `RATE_API_KEY` | from MetalCharts |
| `RATE_API_MONTHLY_LIMIT` | `200` |
| `RATE_MAX_JUMP_PCT` | `5` |
| `CRON_SECRET` | a long random string (e.g. `openssl rand -hex 32`) |

3. **Deploy**. Open the deployment URL; `/`, `/rates`, `/collections` must render.
4. Vercel → **Settings → Cron Jobs**: `vercel.json` already registers
   `/api/cron/fetch-rates` at `0 4 * * *` (09:30 IST). On the Hobby plan this runs
   once a day to the hour; the GitHub workflow is the retry.
   `vercel.json` is strict JSON and Vercel rejects unknown keys (including any
   `comment`), so keep the explanations in this file and never add notes there.

### GitHub Action (backup cron)

GitHub → **Settings → Secrets and variables → Actions** → add:

- `SITE_URL` — the deployment URL, no trailing slash
- `CRON_SECRET` — exactly the same value as in Vercel

`.github/workflows/fetch-rates.yml` then calls the route daily. The route answers
**503 without `CRON_SECRET`**, so it is never an open write path. If the workflow
ever fails in a few seconds, that 503 is the reason: the secret was never added
here or in Vercel. The workflow now prints the status and the route's own message
so the fix is named in the log.

**Before Supabase exists:** the board does not go blank. With no database and no
local store, `/rates` reads the configured automatic feed at request time and
renders the same snapshot (same validation, same "converted to INR" note,
15-minute server cache, 60-second retry after a failure). It writes nothing, so
history, admin override and the monthly quota counter need Supabase as described
above; the customer-facing board works either way.

---

## 4b. Deploy on Netlify

The same repository deploys to Netlify with no code changes. `netlify.toml`
sets the build (`npm run build`), the publish directory (`.next`), Node 22 and the
security headers for static assets.

1. <https://app.netlify.com/start> → **Import an existing project** → GitHub →
   pick the repository. Netlify detects Next.js and installs its OpenNext-based
   runtime automatically; leave the build settings as they come from
   `netlify.toml`.
2. **Site configuration → Environment variables**: add the same names as the
   Vercel table above. `NEXT_PUBLIC_SITE_URL` matters before the *first* build —
   it is baked into canonical tags, the sitemap and the share card.
3. **Deploy site**. Check `/`, `/rates`, `/collections` and `/admin`.
4. **Scheduled rate refresh:** Netlify has no `vercel.json` cron. Use the GitHub
   Action below (`SITE_URL` + `CRON_SECRET`), which calls
   `/api/cron/fetch-rates` on any host. The lazy refresh on the first page view
   also still applies.
5. The Netlify adapter is deliberately **not** pinned in `package.json`; Netlify
   recommends letting it update on each build so it keeps pace with Next 16.

---

## 5. Domain and search

1. Vercel → **Settings → Domains** → add the domain, point DNS as shown, wait for
   SSL **Valid**.
2. Set `NEXT_PUBLIC_SITE_URL` to the final origin and **redeploy** — canonical
   tags, Open Graph, the sitemap and the shared rate card read it at build time.
3. Google Search Console → verify → submit `https://your-domain/sitemap.xml`.
4. Create/claim the Google Business Profile using
   [docs/GOOGLE_BUSINESS_PROFILE.md](docs/GOOGLE_BUSINESS_PROFILE.md).
5. Generate the real QR code:

```bash
npm run qr -- https://your-domain
```

`public/qr/site.svg` is replaced; print it for the counter and bills.

---

## 6. First-run checks on the live site

- [ ] `/rates` shows a real INR value, its source, date and IST time, and the
  making-charges line. If it says *"Today's rate is being updated"*, open
  `/admin/rates` → **Rates health** and read the message.
- [ ] **Admin → Rates → Run now** returns `inserted: 6` the first time and
  "already stored" the second (no second API call).
- [ ] A wrong key leaves the previous value visible with its own date.
- [ ] WhatsApp and Call buttons open the right apps with the right numbers
  (`8766693614` / `7558220117`).
- [ ] One real enquiry from `/contact` appears in **Admin → Enquiries**.
- [ ] `/visit-us` map, directions, and distance (allow and deny location).
- [ ] `curl -sI https://your-domain | grep -iE 'x-frame|referrer|content-security|strict-transport'`.
- [ ] Console has no errors on `/`, `/rates`, `/products/…` and `/admin`.

---

## 7. When something goes wrong

| Symptom | First thing to check |
| --- | --- |
| Rates say "being updated" | Vercel env has `RATE_API_KEY`; Supabase migrations 12–13 ran; **Admin → Rates → Health** |
| Admin login loops | Your user exists in `auth.users` **and** the promotion SQL ran; `admin_users` has the row |
| Enquiries not saved | `SUPABASE_SERVICE_ROLE_KEY` set in Vercel; `enquiries` table exists |
| Images not loading | Files exist under `public/media/`; run `npm run media:manifest`; redeploy |
| Build fails on placeholders | `npm run check:placeholders` names the file and line |
| Cron returns 401/503 | `CRON_SECRET` must match in Vercel, GitHub and the request |

Never "fix" a key error by putting a value into a component or a public variable.
`NEXT_PUBLIC_*` is visible to every visitor.
