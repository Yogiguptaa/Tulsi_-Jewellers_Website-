# Tulsi Jewellers — website

Showroom website for **Tulsi Jewellers / तुलसी ज्वेलर्स**, Hansapuri (Itwari), Nagpur.
Bilingual (English / हिंदी), Next.js 16 App Router + TypeScript + Tailwind v4 + Supabase.

Every business fact on the site comes from `src/lib/config.ts`. Nothing is invented: unknown
values stay as `[INSERT …]` placeholders and any section that would print a raw placeholder is
hidden. Home delivery outside Nagpur is **not** offered — the exact wording lives in
`DELIVERY.outsideNagpurNote` and appears wherever delivery is mentioned.

## The storefront experience

- **Day / night theme** — the sun/moon button in the header swaps the whole palette by setting
  `data-theme` on `<html>`; the colours are tokens in `src/app/globals.css`. With no stored choice
  the visitor's device preference is followed, and a manual choice is remembered. A tiny inline
  script applies it before first paint, so there is no ivory flash on a night-mode device.
- **Thirty-second intro film** — `src/components/intro/CinematicIntro.tsx` plays once per browser,
  is always skippable (button or Escape), never plays under `prefers-reduced-motion`, and can be
  replayed from the footer. It is drawn with canvas and CSS, so there is no video file to host and
  no stock footage pretending to be the showroom.
- **The bangle room** — `src/components/content/BangleShowcase.tsx` composes four licensed
  photographs into a single plate on the home page and on `/jewellery/bangles`, each with a
  WhatsApp enquiry for that style. It is design inspiration, never stock or a price.

## Getting started

```bash
npm install
cp .env.example .env.local     # then fill it in (see below)
npm run dev                    # http://localhost:3000
```

## Folder structure

```
src/app/            routes — (site) is the public site, admin/ is the panel, api/ the endpoints
src/components/     layout, catalogue, rates, content, admin, ui
src/lib/            config, content, catalogue, rates, supabase, i18n, admin (all logic)
public/             logo, icons, photos and the media manifest
scripts/            build-time and check scripts
supabase/           schema.sql, migrations/, seed.sql, RLS testing notes
docs/               everything explanatory: deploy, launch, architecture, owner checklist
```

Production checks, in this order:

```bash
npm run check:placeholders   # must print ✓
npm run check:types          # tsc --noEmit
npm run lint                 # eslint src --max-warnings=0
npm run verify               # the three above, in one command
npm run build                # next build
```

## Environment variables

| Variable | Where | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | `.env.local` + host | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `.env.local` + host | Public key |
| `SUPABASE_SERVICE_ROLE_KEY` | `.env.local` + host | **Server only.** Used by the rate cron and the admin rate job |
| `NEXT_PUBLIC_SITE_URL` | `.env.local` + host | Canonical origin, no trailing slash (read at build time) |
| `RATE_PROVIDER` | server | `metalcharts` (default), `metalsdev` or `manual` |
| `RATE_API_KEY` | server | MetalCharts key. Never in client code, never logged |
| `RATE_USD_INR` | server, optional | Pin the USD→INR rate instead of the daily reference |
| `RATE_API_MONTHLY_LIMIT` | server | Calls per month (MetalCharts free = 200). Job stops at 90% |
| `RATE_MAX_JUMP_PCT` | server | Approval threshold, default 5 |
| `CRON_SECRET` | host + GitHub secrets | Long random string. The cron route returns 503 without it |

Keys belong in `.env.local` (git-ignored), the host's environment variables (Vercel → Project
Settings, or Netlify → Site configuration), and GitHub → Settings → Secrets and variables → Actions. Never in the repository, never in chat, never
in a client component.

## Automatic rates (MetalCharts)

The site refreshes **gold 24K / 22K / 20K / 18K and silver 999 automatically, once a day**, with no
manual entry. MetalCharts is the default source; it needs one key.

1. **Get the key** — create an account at <https://metalcharts.org>, copy the API key. The free plan
   allows 200 calls/month; a daily run spends one. The free plan requires a visible link to
   MetalCharts wherever its values are shown — the rates board renders it for you.
2. **Local** — in `.env.local`:

   ```env
   RATE_PROVIDER=metalcharts
   RATE_API_KEY=your_key_here
   RATE_API_MONTHLY_LIMIT=200
   RATE_MAX_JUMP_PCT=5
   CRON_SECRET=some_long_random_string
   ```

3. **Host** — add the same variables (Production + Preview). Vercel Cron sends
   `Authorization: Bearer $CRON_SECRET` automatically; on Netlify the GitHub Action in step 4 is the
   scheduler (see `netlify.toml`).
4. **GitHub** — add repository secrets `SITE_URL` (e.g. `https://tulsijewellersnagpur.com`) and
   `CRON_SECRET` with the same value. `.github/workflows/fetch-rates.yml` calls the endpoint at
   04:00 UTC (09:30 IST) and again at 05:00 UTC as a retry.
5. **Run the migrations** —
   `supabase/migrations/2026-10-17_stage-12_metalsdev_daily_rates.sql` (adds `metal_rates.rate_type`
   and `rate_api_usage`) and
   `supabase/migrations/2026-10-18_stage-13_rate_refresh_lock.sql` (the lazy-refresh lock). Until the
   first is run, usage is not tracked; until the second is run, lazy refresh is skipped and only the
   schedule fetches.
6. **Test locally**:

   ```bash
   curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3210/api/cron/fetch-rates
   ```

   Expect JSON with `provider`, `inserted`, `pending`, `usage`. A second call the same day answers
   `skipped: true` — that is the idempotency check, not a failure. Without `CRON_SECRET` the route
   answers **503** and does nothing.

7. **Rates without waiting for a cron** — `/api/rates/latest` refreshes once by itself when the
   stored value is missing or older than six hours (one DB lock, quota-guarded, at most once a
   minute). So a fresh install shows real values on the first page view. To see why a rate is not
   showing: `curl http://localhost:3210/api/dev/rates-status` (development only; 404 in production).
   It lists which env names are set, the last job message and the age of the newest row, never key
   values.

### What the customers see

- Values are **converted international spot prices**, labelled
  *“Source: MetalCharts international spot price converted to INR. Indian market rates can differ due
  to duty, taxes and local premiums. Please confirm today's rate at the store.”* — never presented as
  the IBJA benchmark, and never called “Live” (the feed is polled once a day, so the badge reads
  *Latest available rate*).
- Source, date, time (IST), unit, purity and session are always printed next to the number, with
  *“Making charges vary by design and quality, finalised at the shop when you choose your piece.”*
- If a run fails, the last verified value stays on the site **with its own date**, and the admin panel
  names the failure. A value that jumps more than `RATE_MAX_JUMP_PCT` is stored as `pending` and kept
  off the site until an admin approves it on **Admin → Rates**.
- Older than 36 hours the page adds: *“Rates not refreshed recently, please confirm at the store.”*
- No value is ever invented: with nothing recorded the board shows a labelled “Rate unavailable”.

### Diamonds

Not automated, deliberately: diamond pricing has no public daily rate and trade lists are licensed.
The rates page carries a Diamonds card that sends the customer to the counter or WhatsApp for a quote.

### Adding another provider

One file plus one registry line: copy `src/lib/rates/providers/metalsDev.ts`, change the endpoint,
the mapping and `sourceName`, and register it in `src/lib/rates/providers.ts`. Validation, storage,
approvals, the cron route and every screen stay unchanged.

## Supabase

Run, in order, in the Supabase SQL editor:

1. `supabase/schema.sql`
2. `supabase/seed.sql`
3. `supabase/migrations/2026-10-10_stage-2.1_catalogue_and_rate_detail.sql`
4. `supabase/migrations/2026-10-11_stage-8_admin_audit_log.sql`
5. `supabase/migrations/2026-10-15_stage-11_rate_provider_governance.sql`
6. `supabase/migrations/2026-10-17_stage-12_metalsdev_daily_rates.sql`
7. `supabase/migrations/2026-10-18_stage-13_rate_refresh_lock.sql`

Then promote your auth user with the commented SQL at the end of `seed.sql`, and walk
`supabase/RLS_TESTING.md`. Every migration is additive and safe to re-run.

## Deploying

Any Next.js host works. Three are configured:

- **Vercel** — import the repo, framework preset Next.js, `vercel.json` registers the daily cron.
  Free tier is enough.
- **Netlify** — import the repo; `netlify.toml` supplies the build, publish directory, Node 22 and
  security headers, and Netlify installs its Next.js runtime automatically. There is no platform
  cron there, so the GitHub Action does the daily refresh.
- **Freebuff Sites** — the current public deployment, built as a Cloudflare Worker through
  OpenNext (see `docs/DEPLOY.md`).

Set every environment variable for Production first — `NEXT_PUBLIC_SITE_URL` is read at build time.
After the first deploy, run `/api/cron/fetch-rates` once from **Admin → Rates → Run now** and check
the *Feed status* card.

## Docs

| File | Contents |
| --- | --- |
| `CONTEXT.md` | build log: what exists, decisions, stage status |
| `docs/DEPLOY.md` | step-by-step deploy to Vercel, Netlify, Freebuff Sites, plus the domain |
| `docs/LAUNCH_CHECKLIST.md` | the launch sequence, in order |
| `docs/ARCHITECTURE.md` | sitemap, design system, data model, security, SEO |
| `docs/RATE_PROVIDER.md` | provider setup, cost, licence terms to confirm before going live |
| `docs/OWNER_CHECKLIST.md` | every business fact, image and account the owner must supply |
| `docs/PHOTO_GUIDE.md` | replacing the licensed photographs with the showroom's own |
| `docs/MEDIA_GUIDE.md` | manifest, sizes and credits for every image the site ships |
