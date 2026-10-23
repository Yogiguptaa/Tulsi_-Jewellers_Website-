# CONTEXT.md — Tulsi Jewellers build log

Single source of truth for resuming this build in a fresh session.
Read this file first, then the stage list at the bottom.

---

## 0a. Final prompt phases — status (2026-10-19)

Each phase of the final build prompt, with what is finished and what is blocked on the
owner (credentials, domain, real photos).

### PHASE 1 — rates in INR ✅ (real fetch verified: 6 INR rows stored)

- [x] MetalCharts provider with real endpoints, USD/toz → INR, grams, 999/916/833/750/**585**, silver 999/kg.
- [x] One `metal_rates` row per series, append-only, idempotent, `rate_type='spot_converted'`.
- [x] Daily cron (`vercel.json` 04:00 UTC = 09:30 IST) + GitHub Actions retry, `CRON_SECRET` enforced (503 without it).
- [x] Lazy refresh (6 h, DB lock, monthly quota, in-process cooldown) so rates work without any cron.
- [x] Validation: > 0, INR, expected unit/purity, timestamp, `RATE_MAX_JUMP_PCT` hold-for-approval, manual override, optional local adjustment %.
- [x] Customer surfaces read only stored verified rows; cached `/api/rates/latest`; source + date + IST time + "updated X ago"; "Live" only for intraday mappers.
- [x] No data: "Today's rate is being updated. Please call or WhatsApp us for the current rate." + Call/WhatsApp buttons. Older than 36 h: last value, its date, "Please confirm today's rate at the store."
- [x] Calculator is metal value only ("Estimated metal value"), no GST/making inputs.
- [x] Admin: Rates health, Fetch rates now, history, manual entry, storage/quota readout.
- [x] Diamonds card (carat/cut/colour/clarity/certification → ask for a quote).
- [x] `.env.example` + README document where each key goes.
- [x] A real fetch printing stored rows: `npm run rates:fetch` → 24K ₹1,26,606 / 22K ₹1,16,087 / 20K ₹1,05,568 / 18K ₹95,050 / 14K ₹74,139 per 10 g and silver ₹1,78,555/kg on 20 Oct 2026.
- [x] Key-less automatic feed (`providers/spot.ts`, api.gold-api.com + daily FX) is the default when `RATE_API_KEY` is absent, so rates exist on a machine with no `.env.local`; MetalCharts is still used whenever its key is present.
- [x] File-backed local rate store (`.data/rates.json`, git-ignored) with the same validation, dedupe, plausibility hold and quota counter, used until Supabase is configured; boot-time + 6 h lazy refresh; `npm run rates:fetch` for one real run.
- [x] `RATE_INDIAN_MARKET_PCT` (default 0, printed on the rates page when set) states the shop's own gap to the local market rather than inventing it.
- [x] A fresh manual entry leads its series for 36 h; change is measured day-over-day, not between two fetches minutes apart.

### PHASE 2 — realistic look ✅ (media sync pipeline built; stock download blocked on keys)

- [x] All demo/sample inventory, labels and copy removed; no `[INSERT …]`, no invented reviews.
- [x] `scripts/sync-media.ts`: Pexels + Pixabay search/download, WebP ≤1600 px, small video renditions, manifest + credits; skips cleanly when keys are absent.
- [x] `public/media/manifest.json` is the only source components read; `/image-credits` and the footer are generated from it.
- [x] Hero/video support (`HeroMedia`): poster photo when no video, paused for reduced motion.
- [x] `next/image` with sizes, blur placeholders, fixed dimensions; videos muted/loop/playsInline/metadata.
- [x] Design-inspiration strip (rings, necklaces, bangles, earrings, chains, pendants, mangalsutra, anklets, diamonds), each linking to its category and a WhatsApp style enquiry — never a price or stock claim.
- [x] Empty category: "Visit our showroom or WhatsApp us to see our latest designs."
- [x] Product media model (multi-photo + one video) and enquiry → admin list; **bulk upload with client-side compression is still not built** (needs a live Storage bucket).
- [x] Copy: warm, owner-voiced, confirmed facts only; motion disabled under `prefers-reduced-motion`; PWA manifest and generated icons.
- [ ] Downloading Pexels/Pixabay assets — **blocked**: `PEXELS_API_KEY` / `PIXABAY_API_KEY` not supplied.

### PHASE 3 — location, SEO, trust ✅

- [x] Address, street-accurate coordinates and keyless Maps link in config; map hides if the address is a placeholder.
- [x] Visit page: on-demand map embed, address, hours, Call/WhatsApp, Get Directions, optional "use my location" distance (client-side, never stored), open-now indicator from `HOURS_SCHEDULE`.
- [x] Metadata, canonicals, Open Graph image, sitemap, robots, `JewelryStore` JSON-LD from real config only.
- [x] `docs/GOOGLE_BUSINESS_PROFILE.md`; QR generator `scripts/generate-qr.mjs` + `public/qr/site.svg`.

### PHASE 4 — QA and security ✅ (with the documented limitations)

- [x] `check:placeholders`, typecheck, eslint and `next build` exit 0, no warnings.
- [x] Mobile 390 px and desktop checked in the running production build; no console errors on the public routes.
- [x] RLS policies and security headers written; anonymous write paths and admin protection verified in code.
- [ ] Live RLS execution and Lighthouse on a deployed URL need Supabase/domain — listed in `docs/LAUNCH_CHECKLIST.md`.

### PHASE 5 — deploy ✅ (guide written, deployment not performed)

- [x] `docs/DEPLOY.md` (GitHub → Supabase SQL order → env vars → Vercel → cron → domain → QR → first-run checks).
- [x] `docs/LAUNCH_CHECKLIST.md` lists every fact, account and asset the owner must supply.

---

## 0. Project facts

- **Business**: Tulsi Jewellers / तुलसी ज्वेलर्स, jewellery showroom in Hansapuri, Nagpur.
- **Stack**: Next.js 16 (App Router, Cache Components) + TypeScript + Tailwind CSS v4,
  Supabase (stages 2+), Framer Motion, Lucide, Zod. Deploy target: Vercel free tiers.
- **Languages**: English (default) + Hindi, toggle in header, persisted in
  `localStorage` key `tulsi_lang`, `<html lang>` updated by `LanguageProvider`.
- **Commands** (the Windows path contains spaces, so `npx`/`.bin` shims mis-resolve —
  call node directly):
  - typecheck: `node ./node_modules/typescript/lib/tsc.js --noEmit`
  - lint: `node node_modules/eslint/bin/eslint.js src`
  - build: `node node_modules/next/dist/bin/next build`
  - dev: `node node_modules/next/dist/bin/next dev`
  - start: `node node_modules/next/dist/bin/next start -p 3210`

---

## 1. Hard business rules (never violate)

1. Never invent business info. Unknown values stay as `[INSERT ...]` placeholders in
   **`src/lib/config.ts`** only; everything reads from there.
2. Never invent address, email, hours, GST, established year, awards, hallmark/BIS
   claims, certifying lab names, reviews, prices, stock or scheme terms.
3. **Home delivery outside Nagpur is NOT offered.** Exact mandated text lives in
   `DELIVERY.outsideNagpurNote` and must appear wherever delivery is relevant
   (footer, product pages, FAQ, delivery page). Never rephrase it, never promise
   delivery *within* Nagpur either (`insideNagpurNote` is a placeholder).
4. No fake/random rates, no ₹0 rate cards, never show an unavailable item as available.
5. No lorem ipsum — use `[INSERT ...]`.
6. Online payments are NOT built; the Gold Saving Scheme is enquiry/visit based.

---

## 1b. Final pass (2026-10-17) — priority order

| Part | Scope | Status |
| ---- | ----- | ------ |
| 1 | Automatic daily rates (metals.dev spot feed, quota, schedule, idempotency) | ✅ **DONE** |
| 2 | Visual polish | ✅ **DONE** |
| 3 | Useful modern features | ✅ **DONE** (gaps listed at the end) |
| 4 | Trust, SEO, security, launch | ✅ **DONE** |

**All four parts complete (2026-10-17). Next action: work `docs/LAUNCH_CHECKLIST.md` §1
(business facts) and §3 (Supabase), then §4 (first rate run).**

### Part 1 — what was built

- `src/lib/rates/providers/metalsDev.ts` — one request per run
  (`GET /v1/latest?currency=INR&unit=g`), derives 24K/22K/20K/18K (999/916/833/750 ÷
  999) and silver 999 per kg, marks every row `rate_type = 'spot_converted'`,
  retries network/5xx three times with backoff, never retries 4xx/429, refuses a
  non-INR currency, a missing timestamp or an unknown unit. Customer wording is the
  mandated "Source: metals.dev international spot price converted to INR …" line.
- Env: `RATE_PROVIDER=metalsdev`, `METALS_DEV_API_KEY`, `RATE_API_MONTHLY_LIMIT=100`,
  `RATE_MAX_JUMP_PCT=5`. Key is server-only and never logged or returned.
- `src/lib/rates/usage.ts` — monthly accounting in `rate_api_usage`, job stops at
  90% of the allowance; `src/lib/rates/run.ts` — the single job runner used by both
  the cron route and the admin "Run now"; idempotent (skips the provider call when
  today's rows already exist).
- `/api/cron/fetch-rates` — 401 without the secret, 503 without `CRON_SECRET`.
- `vercel.json` `0 4 * * *` (09:30 IST) + `.github/workflows/fetch-rates.yml`
  (04:00 and 05:00 UTC, the second run exits because the data exists).
- Display: "Latest available rate" (never "Live") for converted spot values, the
  mandated source sentence on the rates board and under the homepage ticker, source
  + relative age in the ticker, per-gram equivalent in the calculator, and the 36 h
  "Rates not refreshed recently, please confirm at the store" notice.
- Admin: *Feed status* gains next-run, calls used this month and a **Run now**
  button; diamonds are deliberately **not** automated — the rates page carries a
  Diamonds card with WhatsApp/Call and no invented price.
- Migration `supabase/migrations/2026-10-17_stage-12_metalsdev_daily_rates.sql`
  (`rate_type`, `rate_api_usage`). Ingest falls back to a rate_type-less insert if
  it has not been run, so manual entry never breaks.

### Part 2 — what was built

- Hero: brand mark + तुलसी ज्वेलर्स wordmark (Hindi first), calmer type scale, and a
  fourth CTA (Visit Us) beside Explore / Rates / WhatsApp.
- `CatalogueBrowser`: on phones the filter panel is now a **bottom sheet** over a
  dimmed backdrop with a handle and a "Show N items" button; from `lg` up it is the
  inline grid it always was.
- `ProductCard`: hover **quick view** dialog (image, purity, weight, availability,
  price, DEMO note) with Escape/backdrop close and `autoFocus`.
- `src/app/(site)/loading.tsx` (branded loading screen), `src/app/icon.svg`
  (monogram favicon). Dark mode deliberately not added: the ivory/maroon palette is
  the brand and a dark theme has to be designed, not inverted.

### Part 3 — what was built

- **Command palette** (`/` or ⌘K/Ctrl+K) with grouped results, keyboard navigation
  and recent searches in `localStorage`; the index comes from
  `/api/search-index`, which carries labels and hrefs only — never a price.
- **Open now** indicator on `/visit-us`, computed in Asia/Kolkata from
  `HOURS_SCHEDULE`, and hidden entirely while the hours are a placeholder.
- **Rate sharing**: `/rates/share` renders a branded PNG (ImageResponse) with each
  line's source, date, IST time, unit and purity — 404 with an explanation when no
  verified rate exists — plus a WhatsApp text share built from the same rows.
- **Wishlist**: WhatsApp share of the saved list and a compare table for 2–3 pieces
  (purity, weight, availability, price — all from the catalogue entry).
- **Scheme calculator**: monthly × instalments = total only; the benefit line reads
  "Benefit details available at the store".
- **PWA manifest + generated apple-touch icon** (add-to-home-screen). No service
  worker, so nothing is cached offline and no stale rate can be served.

### Part 4 — what was built

- `npm run check:placeholders` — reports documented placeholders and **fails** on a
  customer-visible one; wired into `npm run build`. Verified both ways (injected a
  visible placeholder → exit 1; removed it → exit 0).
- Security headers in `next.config.ts` (`nosniff`, `Referrer-Policy`, `X-Frame-Options`,
  a CSP limited to `frame-ancestors`/`base-uri`/`object-src`/`form-action`,
  `Permissions-Policy`, HSTS) and `poweredByHeader: false`. A full `script-src`
  policy needs nonces and is deliberately not guessed at.
- `src/app/opengraph-image.tsx` — branded default share card.
- `docs/LAUNCH_CHECKLIST.md` — the ordered launch sequence, including the RLS checks that
  were never run here and the deliberate gaps.

### Still not done (deliberate, listed in LAUNCH_CHECKLIST.md §9)

Offline service worker · book-a-showroom-visit (`visit_requests`) · rate-alert
signup (`alerts`) · Marathi · dark mode · GA4/Pixel · the diamond admin price guide.

---

## 2. Stage status

| Stage | Description | Status |
| ----- | ----------- | ------ |
| 1 | Scaffold, design tokens, i18n, `lib/config.ts`, layout, header/footer/mobile bar, CONTEXT.md | ✅ **DONE** |
| 2 | `schema.sql`, `seed.sql`, Supabase clients, RLS notes | ✅ **DONE** |
| 2.1 | Rate provenance columns + product filter columns + `v_latest_rates`/`v_rate_history_daily` — `supabase/migrations/2026-10-10_stage-2.1_catalogue_and_rate_detail.sql` (additive, idempotent) | ✅ **DONE** |
| 3 | Home page (all sections, rate ticker with empty state) | ✅ **DONE** |
| 4 | Collections, catalogue, filters, search, product detail, wishlist | ✅ **DONE** |
| 5 | Rate system (providers, cron, rates page, charts, calculator) | ✅ **DONE** |
| 6 | Scheme page, Gems page, enquiry/scheme forms, contact | ✅ **DONE** |
| 7 | Visit Us (map embed, geolocation distance, directions) | ✅ **DONE** |
| 8 | Admin dashboard (all modules) | ✅ **DONE** |
| 9 | Content/policy/guide pages, SEO, JSON-LD, sitemap, robots | ✅ **DONE** (analytics not wired) |
| 10 | A11y/security/perf audit, mobile QA, README, final checklist | ⬜ **next** |

**Next action: Stage 10 (audit + README).**

> Stage 2.1 deliberately ships only what the running site reads or writes: the
> product filter columns, the rate provenance columns, the two helper views and
> the indexes behind those queries. The wider 2.1 list in `docs/ARCHITECTURE.md`
> §H1 (`rate_provider_status`, `wishlists`, `rate_alerts`, tsvector search) is
> **not** created yet — no code path uses it, and adding unused tables would be
> schema the site cannot honestly describe.

### Design documents (read these before building anything)

| File | Contents |
| ---- | -------- |
| `docs/ARCHITECTURE.md` | vision, 35-route sitemap, stack, design system, feature map (P0/P1/P2), rate-provider strategy, location/geolocation strategy, DB design incl. the Stage 2.1 migration table, security plan, SEO/analytics plan, acceptance criteria |
| `docs/PROMPT_CHAIN_1_18.md` | phases 1–18, one copy-paste prompt each, with testing/acceptance/errors per phase |
| `docs/PROMPT_CHAIN_19_36.md` | phases 19–36 + the Final QA checklist + handoff summary |
| `docs/OWNER_CHECKLIST.md` | every business fact, image and account the owner must supply, with priority labels |

Stage mapping note: the 10 build stages in this file are the *implementation* order;
the 36 prompts in `docs/PROMPT_CHAIN_*.md` are the *specification* order. Stage 3 here is
Phase 6 there, Stage 4 = Phases 7–11 + 19–21, Stage 5 = Phases 12–16, Stage 6 =
Phases 21–26, Stage 7 = Phases 18–20, Stage 8 = Phase 17, Stage 9 = Phases 24, 26–29,
Stage 10 = Phases 30–36.

### Rate-provider reality (do not fake this)

IBJA publishes AM + PM benchmark rates **on business days only** (no Sat/Sun, no
government holidays) and **excluding GST**; it has no unrestricted public API. Plan:
provider abstraction with a **manual IBJA-entry provider as the default** (free, fully
functional, honestly labelled), an optional external feed switched on with
`RATE_PROVIDER=external` + `RATE_API_URL` + `RATE_API_KEY`, and never any browser-side
fetch or scraping. Full detail: §F of `docs/ARCHITECTURE.md`, and
`docs/RATE_PROVIDER.md` for setup, cost and the licence terms to confirm before going
live.

Stage 11 (external provider governance): the provider-specific mapping lives in exactly
one file, `src/lib/rates/mappers/<provider>.ts` (currently `metals-dev.ts`, the IBJA/MCX
authority feed), chosen from `RATE_API_URL`'s host. A value is stored as `pending` and
kept off the site when it moves more than `RATE_MAX_JUMP_PCT` (default 6%) against the
last published value for the same series; the admin panel approves or rejects it.
"Live" is only ever claimed by a mapper that declares `publication: "intraday"`.

**Provider decision (2026-10-18): MetalCharts is the default**, implemented in
`src/lib/rates/providers/metalCharts.ts` (one spot call, USD/toz → INR via the daily
Frankfurter reference or `RATE_USD_INR`, deriving 999/916/833/750/585 and silver 999).
`metalsDev` remains a swappable provider (`RATE_PROVIDER=metalsdev`), and `manual` is the
fallback. `metals-dev.ts` under `mappers/` is the older governance mapper and is not the
default path. Both providers refuse a payload with no timestamp, an unknown unit or a
non-positive number. MetalCharts free plan: 1,000 calls/month, commercial use stated as
allowed, visible attribution required (printed by the rates board).

Stage 2 caveat: the Supabase **project does not exist yet** (no credentials).
All Supabase clients return `null` when unconfigured — pages must render
honest empty states until `.env.local` is filled from `.env.example`.

---

## 3. Stage 1 — what was built

### File map

```
src/
  app/
    layout.tsx          Root layout: fonts (Playfair/Inter/Tiro Devanagari/Noto Sans
                        Devanagari), metadata, skip-link, providers, global chrome
    page.tsx            TEMPORARY hero (4 CTAs) — replaced entirely in Stage 3
    not-found.tsx       Custom 404 (bilingual)
    error.tsx           Route error boundary with retry
    global-error.tsx    Root error boundary (own <html>)
    globals.css         Design tokens (@theme), base styles, ornament, light-sweep,
                        reduced-motion kill-switch, Devanagari tracking fix
  lib/
    config.ts           ★ SINGLE SOURCE OF TRUTH for all business data + placeholders
    i18n/en.ts          English dictionary (defines canonical key set)
    i18n/hi.ts          Hindi dictionary (key parity enforced by TypeScript)
    i18n/index.ts       getDictionary / translate with `{var}` interpolation
    storage.ts          SSR-safe localStorage hooks (useSyncExternalStore)
    wishlist.ts         localStorage wishlist (array of product codes) + subscribe
    year.ts             `"use cache"` copyright-year helper (Cache Components forbids
                        raw `new Date()` during prerender)
  components/
    providers/LanguageProvider.tsx   lang state + `t()` (persisted, sets <html lang>)
    providers/ToastProvider.tsx      lightweight toast (used from Stage 4)
    layout/Header.tsx      sticky header, Collections mega-menu, search drawer,
                           wishlist badge, EN/हिं toggle, mobile drawer
    layout/AnnouncementBar.tsx  dismissible bar (DB announcements wire up in Stage 8)
    layout/Footer.tsx      NAP from config, quick links, policies, guides, and the
                           mandatory outside-Nagpur delivery notice
    layout/MobileBottomBar.tsx Home / Collections / Rates / WhatsApp / Visit
    layout/RateChip.tsx    sticky "View Rates" chip (mobile only)
    layout/WhatsAppFab.tsx floating WhatsApp button (desktop only)
    ui/Button.tsx, Badge.tsx, SectionHeading.tsx, Skeleton.tsx
public/
  logo.svg               TEMPORARY "Tj" emblem (swap SITE.logoSrc to /logo.png later)
```

### Decisions

- **Tailwind v4 (CSS-first)**: tokens are in `globals.css` `@theme` block
  (`--color-maroon`, `--color-gold`, …) → utilities `bg-maroon`, `text-gold-600`.
- **No `new Date()` in client components or during prerender** (Cache Components
  throws). Copyright year goes through `getCopyrightYear()` (`"use cache"`).
- **No `setState` inside `useEffect`** (react-hooks v6 lint error). Use
  `useStoredValue` / `useSyncExternalStore`, or the guarded render-time adjustment
  pattern (see `Header` pathname sync).
- **`position: fixed` inside `<header>`** is trapped by the header's
  `backdrop-filter` (it becomes a containing block) → mobile drawer is rendered as a
  sibling of `<header>`, `z-[45]` (header `z-50`, bottom bar `z-40`).
- **Lucide no longer ships brand icons** (Instagram/Facebook) → inline SVGs in `Footer`.
- **i18n key typing**: `Dictionary = { [K in keyof typeof en]: string }` so `hi.ts`
  must implement every key but may translate the value.
- **Phones**: all three real numbers are shown with `tel:` links. Which one is
  *primary* and which is *WhatsApp* is still `[CONFIRM WHICH]` — `whatsappHref()`
  currently falls back to the first number and must be revisited once confirmed.
- **Announcement bar** shows factual brand copy only (no invented promotions) until
  the `announcements` table exists (Stage 8).

### Verified in Stage 1

- `tsc --noEmit` ✅ · `eslint src` ✅ · `next build` ✅ (static route `/` + `/_not-found`)
- EN/हिं toggle switches full UI, persists, sets `document.documentElement.lang` ✅
- Mobile drawer, bottom bar, rate chip, WhatsApp FAB, 404, footer delivery notice ✅
- Console shows 404 *prefetch* requests for routes that don't exist yet
  (`/collections`, `/rates`, `/about`, …) — they disappear as later stages add them.

---

## 3b. Stage 2 — what was built (Supabase)

### Files

```
supabase/
  schema.sql          13 tables, 11 enums, indexes, updated_at triggers,
                      is_admin() (SECURITY DEFINER), storage bucket
                      'product-images', FULL RLS policy set — idempotent
  seed.sql            6 categories (from config COLLECTIONS), 6 factual FAQs
                      (exact delivery/disclaimer wording), 1 evergreen
                      announcement, 6 [PLACEHOLDER] DRAFT products.
                      metal_rates + reviews + enquiries seeded EMPTY.
                      Ends with commented admin-promotion SQL.
  RLS_TESTING.md      static SQL checks, anon/admin REST curl tests,
                      regression checklist, design rationale
src/lib/supabase/
  env.ts              isSupabaseConfigured() + public-var accessors only
                      (service-role key deliberately NOT here)
  types.ts            hand-written Database types mirroring schema.sql
                      (update in same commit as any schema change)
  client.ts           getSupabaseBrowserClient() — singleton, null if no env
  server.ts           getSupabaseServerClient() — per-request, await cookies();
                      must sit behind <Suspense> if called from a page
  admin.ts            getSupabaseAdminClient() — service role, server-only,
                      throws in browser during dev
.env.example          NEXT_PUBLIC_SUPABASE_URL / ANON_KEY,
                      SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SITE_URL
```

### Decisions

- **Everything returns `null` when env is missing** — no throws — so the site
  builds and shows honest empty states before a Supabase project exists.
- **`status='draft'` default on products** + RLS public policy `status='active'`
  → nothing can leak to the public before an admin activates it.
- **No public insert on `reviews`** → fake reviews are structurally impossible;
  owner adds verified reviews via admin (Stage 8) with status 'approved'.
- **enquiries/scheme_enquiries are INSERT-only** for anon (`WITH CHECK
  status='new'`): visitors can't read each other's details, can't spoof status.
- **`is_admin()` is SECURITY DEFINER with `search_path=''`** so admin policies
  don't recurse through `admin_users`' own RLS.
- **Storage policies** on `product-images` bucket: public read, admin-only write.
- **server.ts sits outside pages for now** — Stage 5/8 call it from Route
  Handlers; if a page uses it later it must be inside <Suspense> (Cache
  Components forbids raw cookies() in the static shell).

### Verified in Stage 2

- `tsc --noEmit` ✅ · `eslint src` ✅ · `next build` ✅
- SQL not yet executed (no Supabase project) — run schema.sql → seed.sql →
  RLS_TESTING.md checklist once credentials exist.

---

## 3c. Stages 2.1–9 — the public site (what was built)

### Routes (all built, all with per-page metadata)

```
/                          home: hero, today's rate, collections, featured, scheme,
                           trust, reviews, delivery, FAQ preview, guides, visit block
/collections               all six collections + "browse by type" chips
/collections/[slug]        6 pages, generated from config.COLLECTIONS
/jewellery/[slug]          13 type/gender/occasion landing pages (JEWEL_TYPES)
/products/[slug]           product detail (gallery, spec table, enquiry, related)
/gems                      ratna collection + stone chips + honesty notice
/rates                     rate board (source/date/time/session/GST/delta), history
                           summary, calculator teaser, mandatory disclaimer
/rates/history             chart + table built only from recorded rows, 90 days
/rates/calculator          metal-value estimate; extra components only when published
/wishlist                  localStorage wishlist (noIndex)
/gold-saving-scheme        scheme steps, terms-pending notice, enquiry form
/about                     AboutView (owner-input notices where text is pending)
/visit-us                  keyless map (loads on demand), phone, opt-in distance
/contact                   phones + enquiry form
/faq                       grouped FAQ + FAQPage JSON-LD
/guides, /guides/[slug]    5 informational guides
/delivery-information      policy
/returns-exchanges         policy
/privacy-policy            policy (describes what the code actually does)
/terms                     policy
/image-credits             Wikimedia attribution for the demo photography (noIndex)
/sitemap.xml, /robots.txt  generated (sitemap excludes noIndex routes)
/api/rates/latest          JSON snapshot for the homepage ticker
/api/enquiries             POST enquiry (Zod + honeypot + per-IP rate limit)
/api/cron/fetch-rates      scheduled ingest (Bearer CRON_SECRET)
```

### Data layer

```
src/lib/catalogue/
  types.ts        Product / filters / sort options (mirrors the DB enums)
  demo.ts         32 labelled DEMO fixtures (isDemo: true) — used when no DB
  source.ts       getCatalogue/getProductBySlug/getProductsBySlug… `"use cache"`,
                  tag `catalogue`; falls back to the baseline select when the
                  2.1 columns are absent, and never throws into the page
  select.ts       search/filter/sort/related/facets (pure, shared server+client)
  images.ts, image-credits.ts, jewel-types.ts
src/lib/rates/
  types.ts, format.ts (₹ formatting, deltas, IST-aware labels)
  providers.ts    manual (default) + external feed behind RATE_PROVIDER/RATE_API_URL/
                  RATE_API_KEY; resolves the mapper, never substitutes a provider
  mappers/        types.ts + index.ts (host registry) + one file per provider
                  (metals-dev.ts = IBJA/MCX authority feed)
  ingest.ts       validation (currency/unit/purity/time/band) → plausibility flag →
                  dedupe → insert (auto | pending) → rate_job_logs → revalidateTag
  service.ts      getRatesSnapshot / getRateHistory (IST day buckets) /
                  getPublicPricingRules — `"use cache"`, tag `rates` / `pricing`
  calculator.ts   metal value + only-published extras; never invents a %
src/lib/content/  faq.ts, guides.ts, policies.ts, trust.ts, reviews.ts, about.ts
src/lib/seo.ts    buildMetadata + JSON-LD builders (no invented ratings/hours)
src/lib/clock.ts  shared useSyncExternalStore clock for "2 h ago" labels
```

### Decisions worth remembering

- **`export const dynamic = "force-dynamic"` is illegal** with `cacheComponents: true`
  — the build fails. Route handlers already run at request time; the three API
  routes carry a comment explaining this instead of the removed config.
- **`revalidateTag(tag)` is deprecated**: it now needs a profile. The cron ingest
  uses `revalidateTag("rates", { expire: 0 })` so a newly recorded rate is visible
  on the next request rather than an hour later.
- **`setState` in an effect is a lint error** in this repo (react-hooks v6). Relative
  timestamps therefore use `src/lib/clock.ts` via `useSyncExternalStore`.
- **Structured data only carries confirmed facts**: no `aggregateRating`, no
  `streetAddress`/`openingHours` until the owner supplies them, and `offers` only
  when a real price exists. "Price on Enquiry" is not a price.
- **DEMO imagery** is freely licensed Wikimedia photography, credited on
  `/image-credits`; every demo product card carries a DEMO badge.

### Stage 8 extra migration

`supabase/migrations/2026-10-11_stage-8_admin_audit_log.sql` — grants an allowlisted
admin INSERT on `rate_job_logs`. `schema.sql` only allows writes from the service role,
and the panel deliberately records manual rate entries with the admin's *own session*, so
without this policy a published rate would have no audit row. Additive, idempotent, no new
read/UPDATE/DELETE access.

---

## 3d. Stage 8 — the admin panel (`/admin`)

```
src/proxy.ts                     Next 16 Proxy (was middleware): refreshes the Supabase
                                 session and optimistically redirects signed-out visitors.
                                 Explicitly NOT the security boundary.
src/lib/admin/
  auth.ts                        DAL: getAdminGate() / requireAdmin() / isOwner(). The ONE
                                 place that decides whether admin data may be read. React
                                 `cache`-wrapped, so a layout + page share one round-trip.
  actions.ts                     every mutation, each one: re-check gate → Zod validate →
                                 write with the caller's session (RLS applies) → revalidate.
                                 `owner`-only deletes and pricing rules. Plus rateHealth().
  schema.ts                      Zod schemas + FormData helpers matching the DB constraints.
  result.ts                      AdminActionResult + explainDbError() (translates Supabase
                                 error text, never leaks a stack trace).
src/components/admin/
  AdminForms.tsx                 ActionForm / SubmitButton / InlineAction / Field / panels.
  AdminNav.tsx, AdminIdentity.tsx, LoginForm.tsx, ImageField.tsx
src/app/admin/
  (dashboard)/layout.tsx         admin chrome (noindex); the gate is checked per page.
  (dashboard)/page.tsx           overview: today's rates (same cached snapshot the public
                                 site uses), counts, provider health, featured list.
  (dashboard)/rates|products|products/[ref]|categories|enquiries|announcements|faqs|
              reviews|pricing-rules/page.tsx
  login/page.tsx                 sign in — or the exact setup steps when Supabase is
                                 unconfigured, and a clear 403 when signed in but not on
                                 the allowlist.
src/lib/content/public-content.ts  getActiveAnnouncement / getPublicReviews / getFaqItems —
                                 `use cache` reads of admin-managed rows the public site
                                 now really uses.
```

### Decisions

- **Route groups replace the old client `usePathname()` chrome check.** Public routes moved
  into `src/app/(site)/` (URLs unchanged) with `(site)/layout.tsx` → `SiteFrame`; `/admin`
  and `/api` sit outside it. The previous root-layout approach used a client hook in the
  static shell, which made **every** route a blocking prerender. Root `layout.tsx` now holds
  only fonts, metadata and the two providers; `not-found.tsx` is a Server Component that
  wraps the 404 body in `SiteFrame`; `error.tsx` uses the client-only `ChromeShell` (no
  hook, no server data) so it always renders.
- **Dynamic APIs stay inside `<Suspense>`**: admin pages call `requireAdmin()`, and the
  product editor / login page receive `params` / `searchParams` as a *promise* and await it
  inside the boundary (else Cache Components fails the build). `AdminNav` uses
  `usePathname()`, so it sits in its own boundary.
- **Server Actions, not route handlers, for admin writes** (the brief said route handlers).
  Same guarantees: the gate is re-checked on the server for every mutation, Zod validates,
  and non-admins get a neutral failure with no data. Writes use the *caller's* session so
  `is_admin()` RLS applies — the service-role key is never used by the panel (it is only
  read, never executed, by `rateHealth()` to report whether the optional cron path is
  configured).
- **Products are replaced wholesale on save**, images included: the textarea is the source
  of truth, so a deleted line really disappears. `price_inr` is nulled when “Price on
  request” is ticked — a confirmed price and “on request” can never both be true.
- **Collections cannot be cascaded away**: deleting a collection with products is refused
  with the count, so no product silently vanishes.
- **Announcements / reviews / FAQs are wired end-to-end.** Approved reviews replace the
  sample carousel; the first active FAQ row switches `/faq` (and its JSON-LD) to the
  database. Empty tables fall back to the reviewed code content rather than showing nothing.
- **No analytics, no export, no bulk personal-data download** — deliberately absent.

### Verified for Stage 8

- `tsc --noEmit` ✅ · `eslint .` ✅ (0 problems) · `next build` ✅ — 93 pages, `/admin/*` present.
- Dev server on :3210 — `/` 200, `/faq` 200, `/admin/login` renders the setup screen (no
  public footer), `/admin` emits a redirect to `/admin/login` and leaks no table data.
- **Not verified:** any database-backed behaviour (there is still no Supabase project or
  `.env.local` on this machine), so sign-in, CRUD, RLS and storage upload are untested
  against a live database. Run `supabase/schema.sql` → `seed.sql` → both migrations, then
  walk §10 of `docs/OWNER_CHECKLIST.md`.

---

### Verified (Stages 3–9)

- `tsc --noEmit` ✅ · `eslint .` ✅ (0 problems) · `next build` ✅ — 82 pages
  generated, `/api/*` dynamic, `/sitemap.xml` + `/robots.txt` present.
- Migration SQL: parsed statement-by-statement (DDL + both view bodies syntax-checked).
  **Not executed against a live Postgres** — Docker was unavailable on this machine;
  run it in the Supabase SQL editor and check with the queries at the end of the file.

---

## 4. Outstanding placeholders (owner must supply)

| Placeholder | Where |
| ----------- | ----- |
| `[INSERT FULL ADDRESS]` | `CONTACT.address` |
| `[CONFIRM WHICH]` primary phone | `CONTACT.primaryPhone` |
| `[CONFIRM WHICH]` WhatsApp number | `CONTACT.whatsappPhone` |
| `[INSERT]` email | `CONTACT.email` |
| `[INSERT]` opening hours | `CONTACT.hours` |
| `[INSERT]` latitude / longitude | `CONTACT.latitude/longitude` |
| `[INSERT]` Google Maps link | `CONTACT.googleMapsLink` |
| `[INSERT]` Instagram / Facebook | `CONTACT.instagram/facebook` |
| `[INSERT, optional]` GST number | `CONTACT.gstNumber` |
| `[INSERT]` established year | `CONTACT.establishedYear` |
| `[INSERT ACTUAL BUSINESS STORY]` | `CONTACT.aboutStory` |
| `[INSERT SCHEME TERMS]` | `SCHEME.terms` |
| `[INSERT DETAILED BENEFITS, IF APPROVED]` | `SCHEME.benefitNote` |
| `[INSERT DELIVERY POLICY WITHIN NAGPUR]` | `DELIVERY.insideNagpurNote` |
| `public/logo.png` file (currently `logo.svg` fallback) | `SITE.logoSrc` |
| Certifying lab name for "प्रमाणिक रत्न" | Stage 6 (Gems page) — do NOT name a lab until supplied |
| `NEXT_PUBLIC_SITE_URL` | `.env` (SEO canonical/OG in Stage 9) |

Machine-readable copy of this list: `PENDING_CONFIRMATIONS` in `src/lib/config.ts`.

---

## 5. Known gaps / reminders for later stages

- Stage 2: ✅ done — remaining: owner creates Supabase project, fills
  `.env.local` from `.env.example`, runs `schema.sql` + `seed.sql`, then walks
  `supabase/RLS_TESTING.md`, and promotes their auth user via the SQL at the
  bottom of seed.sql.
- Stage 3: replace `src/app/page.tsx` hero with the full home page; rate ticker must
  render an honest **empty state** until rates exist (never fake numbers).
- Stage 4: header search already routes to `/collections?q=…`; wishlist badge already
  reads `lib/wishlist.ts`.
- Stage 8: ✅ done — `AnnouncementBar` reads the `announcements` table, approved reviews
  replace the sample carousel, and the first active FAQ row takes over `/faq`. Remaining:
  owner creates the Supabase project, promotes an admin, and runs both migrations.
- Stage 9: `SITE.baseUrl` drives canonical/OG; add `robots.txt`, `sitemap.xml`.
- Stage 10: replace the README with setup/Supabase/Vercel/cron documentation.

---

## 6. Pass of 2026-10-18 — contacts, rates not showing, GST → making charges, demo removal

### Why no rate was showing (the actual cause, in order)

1. **There is no `.env.local` at all** (`ls -a` shows only `.env.example`): no
   `NEXT_PUBLIC_SUPABASE_URL`, no anon key, no service-role key, no
   `RATE_API_KEY`, no `CRON_SECRET`. `/api/dev/rates-status` (development only)
   reports every one of them as false.
2. Because Supabase is unconfigured, `publicSupabase()` returns `null`, so the
   rates service cannot read `metal_rates` at all — there is not "a row missing",
   there is no way to ask. Check 1 of the original list therefore cannot be
   answered from this machine.
3. `/api/rates/latest` correctly answers `status: "unavailable"`,
   `isConfigured: false`. It is not a mapper mismatch, an RLS problem or a wrong
   env *name*.
4. Vercel Cron and GitHub Actions do not run on localhost, so even with keys
   nothing would have been fetched locally — which is exactly why the lazy
   refresh below now exists.

### What changed

- `src/lib/rates/providers/metalCharts.ts` — new default feed (USD/toz spot +
  daily USD→INR reference, or `RATE_USD_INR`), deriving 999/916/833/750 and
  silver per kg, `rate_type='spot_converted'`, MetalCharts attribution link.
  `metalsDev` stays as a swappable provider; `manual` stays the fallback.
- `src/lib/rates/lazy.ts` + `…/api/rates/latest` — one guarded refresh when the
  stored value is missing or older than six hours (compare-and-swap lock, quota
  guard, 60 s in-process cooldown, fails silently to the last verified value).
- `src/app/api/dev/rates-status/route.ts` — development-only diagnosis (404 in
  production), reports env *names* only.
- `run.ts` / `usage.ts` — `trigger` (`scheduled` | `manual` | `lazy`) is stored in
  every `rate_job_logs` row; `hasRecentRates()` makes lazy/manual runs idempotent.
- `supabase/migrations/2026-10-18_stage-13_rate_refresh_lock.sql` — the lock table.
- Contacts: call `7558220117`, WhatsApp `8766693614`, as two labelled buttons in
  the header (xl), the mobile drawer, the footer, contact/visit and product pages.
  `9172394518` is gone from the repo.
- GST is no longer shown anywhere a customer looks. Rate cards, history, ticker,
  calculator and JSON-LD print
  *"Making charges vary by design and quality, finalised at the shop when you
  choose your piece."* and the disclaimer
  *"Rates shown are indicative. Final price depends on the product, making
  charges and applicable taxes, confirmed at Tulsi Jewellers."* The calculator is
  metal value only, and `getPublicPricingRules` is no longer wired to it.
- Demo inventory is gone: `catalogue/demo.ts` deleted, `getCatalogue()` returns
  no products rather than fixtures, every catalogue surface shows the honest
  "New designs arriving — ask us on WhatsApp" state (`EmptyCatalogue`), and
  `seed.sql` no longer seeds placeholder products.
- New: "Trending styles" design-inspiration strip (labelled, WhatsApp per tile,
  licence-safe placeholders), `public/images/CREDITS.md` (generated by
  `scripts/generate-image-credits.mjs`), `docs/PHOTO_GUIDE.md`.

### Known limitation found while testing

`notFound()` inside a **partially prerendered** route answers HTTP 200 with the
404 page inside it — a soft 404. Cache Components forbids `dynamicParams = false`,
so the only fix is to give those routes up (removing `loading.tsx` did not change
the status). Mitigation in place: every unknown slug returns `robots: noindex`.
A URL that matches no route at all (`/nope`) is a correct 404.

### Not built in this pass

Bulk photo upload with client-side compression, and product video, are not
implemented: they need a live Supabase Storage bucket to be written and tested
against, and writing an untestable upload path would be worse than the gap.
`docs/PHOTO_GUIDE.md` documents the manual path until that exists.
