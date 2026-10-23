# TULSI JEWELLERS — SEQUENTIAL VIBE-CODING PROMPT CHAIN (Part 1: Phases 1–18)

How to use: paste **one phase at a time** into Claude/Codebuff, in this project.
Every prompt starts by inspecting the repo. Never paste two phases at once.
Per-phase format: **Objective → Prompt (copy-paste) → Expected output → Files →
Testing → Acceptance → Likely errors → Verify before next phase → Next-phase needs.**

Statuses reflect reality in this repo right now:

- ✅ **DONE** = already implemented and verified (do not redo; the prompt is kept for reference/re-runs)
- 🔄 **PARTIAL** = scaffold exists, phase completes it
- ⬜ **TODO**

Reference docs: [ARCHITECTURE.md](./ARCHITECTURE.md) · [CONTEXT.md](../CONTEXT.md) ·
[OWNER_CHECKLIST.md](./OWNER_CHECKLIST.md).

---

## PHASE 1 — Project Planning ✅ DONE

**Objective:** lock the vision, sitemap, stack, honesty rules and file map before any code.

**Prompt (reference):**
> Inspect this repository: `CONTEXT.md`, `docs/ARCHITECTURE.md`, `src/lib/config.ts`, `package.json`.
> Confirm the stack (Next.js App Router, TypeScript strict, Tailwind v4, Supabase), the
> 35-route sitemap, and the hard business rules. Then produce a short written plan for the
> remaining phases, listing which routes are P0 and which business facts are still
> placeholders. Do not write feature code yet. Do not change config values.

**Expected output:** plan + placeholder inventory. **Files:** `CONTEXT.md`, `docs/ARCHITECTURE.md`.
**Testing:** none (documentation). **Acceptance:** every placeholder the site will render is listed.
**Errors:** none. **Verify:** rules list matches `DELIVERY.outsideNagpurNote` verbatim.
**Next-phase needs:** approved palette, fonts and honesty rules.

---

## PHASE 2 — Brand & Design System ✅ DONE

**Objective:** tokens, typography, ornaments, motion rules — one visual language.

**Prompt (reference):**
> Inspect `src/app/globals.css`, `src/components/ui/*` and `tailwind.config`/`@theme` tokens.
> Confirm the ivory/champagne/charcoal/maroon/gold system, the Playfair + Inter + Devanagari
> font pairing, the `GoldRule` ornament, reduced-motion overrides and the Devanagari
> letter-spacing fix. List any component using gold for body text (there should be none).
> Do not restyle without a reason; do not add gradients.

**Expected output:** token inventory + corrections. **Files:** `globals.css`, `ui/*`.
**Testing:** visual check at 320/375/430/768/1440. **Acceptance:** charcoal-on-ivory contrast
passes AA; gold used only for lines/icons/buttons. **Verify:** Hindi headings render in
Devanagari display font. **Next-phase needs:** stable class/token names.

---

## PHASE 3 — Project Initialization ✅ DONE (+ rebuild rule)

**Objective:** runnable Next 16 + TS + Tailwind + Supabase deps, error/404/skip-link shell.

**Prompt (reference):**
> Inspect `package.json`, `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`,
> `src/app/{layout,error,global-error,not-found}.tsx`. Confirm the app builds and the
> bilingual provider wraps the tree. Note the Windows-safe commands:
> typecheck `node ./node_modules/typescript/lib/tsc.js --noEmit`,
> lint `node node_modules/eslint/bin/eslint.js src`,
> build `node node_modules/next/dist/bin/next build`. Fix anything broken; add no dependencies.

**Expected output:** clean build. **Files:** config + app shell.
**Testing:** the three commands above; `/` and a bad URL in the browser.
**Acceptance:** all three exit 0; 404 page renders styled. **Errors:** Turbopack cache →
delete `.next`. **Verify:** console has no hydration warnings. **Next-phase needs:** working build.

---

## PHASE 4 — Database Architecture 🔄 PARTIAL (Step 2.1 to finish)

**Objective:** verify Stage 2 schema, then apply the additive 2.1 migration for the
full rate/product/enquiry spec.

**Prompt:**
> Read `supabase/schema.sql`, `supabase/seed.sql`, `supabase/RLS_TESTING.md`,
> `src/lib/supabase/types.ts` and §H of `docs/ARCHITECTURE.md`. Then write a **new
> additive migration** `supabase/migrations/0002_rates_products_enquiries.sql` implementing
> every row of the §H1 table: `metal_rates` audit columns + `market_session` enum +
> `effective_date` + GST/making-charge flags + unique natural key, `v_latest_rates` and
> `v_rate_history_daily` views, `products` filter/search columns (`subcategory`, `gender`,
> `occasion`, `stone_type`, `diamond_details`, `price_type`, `featured`, `tags`,
> `search_doc` generated tsvector + GIN index), `enquiries` form columns, and the new
> `rate_provider_status`, `wishlists`, `rate_alerts` tables with RLS policies. Keep the
> existing hard-rule constraints (rate > 0, price NULL or > 0, status default draft,
> no public insert on reviews). Update `src/lib/supabase/types.ts` to match exactly.
> Do not edit `schema.sql` destructive statements, do not touch `config.ts`, do not seed
> fake rates or products.

**Expected output:** one migration file + refreshed types.
**Files:** `supabase/migrations/0002_*.sql`, `src/lib/supabase/types.ts`, `CONTEXT.md`.
**Testing:** run the migration in the Supabase SQL Editor (or local `supabase db reset`),
then re-run `supabase/RLS_TESTING.md`; confirm `select * from v_latest_rates` returns 0 rows
(not an error) on an empty database.
**Acceptance:** migration is idempotent, all new tables have RLS enabled, `tsc` passes.
**Likely errors:** `enum already exists` → use `do $$ ... exception when duplicate_object`;
generated column cannot reference `now()` → build `search_doc` from text columns only;
view column rename breaks types → update both in one commit.
**Verify:** `\d+ metal_rates` shows the new columns; anon cannot select `rate_provider_status`.
**Next-phase needs:** applied migration (or an accepted "run this yourself" note).

---

## PHASE 5 — Business Configuration System 🔄 PARTIAL

**Objective:** one config object drives every page; placeholders visible, never invented.

**Prompt:**
> Read `src/lib/config.ts` end to end, plus `PENDING_CONFIRMATIONS` and
> `docs/OWNER_CHECKLIST.md`. Extend it — without inventing anything — so it covers every
> fact the site renders: `RATES` (provider mode, disclaimer text, staleness message,
> purity display labels), `POLICIES` (delivery/returns/privacy/terms intro placeholders),
> `GUIDES` metadata, `SOCIAL`, `ANALYTICS` placeholders, `FEATURE_FLAGS`
> (`rates`, `wishlist`, `reviews`, `calculator`) defaulting to the safe values, and
> `CATEGORY_FLAGS` so unsold categories can be disabled. Add helpers
> `placeholderOrNull()`, `rateSourceLabel()`, `mapEmbedSrc()`, `directionsHref(origin?)`.
> Keep `isPlaceholder()`, the delivery note and all existing exports unchanged in meaning.
> Every new unknown value must be a bracketed placeholder. No business fact may appear
> anywhere else in the codebase.

**Expected output:** expanded config + flag helpers.
**Files:** `src/lib/config.ts`, `CONTEXT.md`.
**Testing:** grep for a hardcoded phone/address outside config; `tsc` + `lint`.
**Acceptance:** `grep -rn "7558220117" src | grep -v config.ts` returns nothing;
disabling a feature flag hides its UI with no errors.
**Likely errors:** `as const` breaking new optional fields → type the object where needed;
`FEATURE_FLAGS` typed as literal `false` → widen to `boolean`.
**Verify:** toggling `FEATURE_FLAGS.reviews` removes the reviews section; delivery note
still renders on Home/Visit/Footer. **Next-phase needs:** config API frozen.

---

## PHASE 6 — Homepage ⬜ TODO

**Objective:** the cinematic, honest, fully-templated homepage.

**Prompt:**
> Inspect `src/app/page.tsx` (currently a temporary hero), `src/components/*`, `src/lib/i18n/*`
> and the config/flag API from Phase 5. Rebuild the homepage as a composition of section
> components in `src/components/home/`: `HeroSection` (serif headline "Tulsi Jewellers",
> editable tagline, CTAs Explore Collection / View Gold & Silver Rates / Visit Our Store /
> WhatsApp Us, one restrained parallax + light sweep, poster-first image), `BrandIntro`
> (story placeholder shown as placeholder, never as fact), `FeaturedCollections`
> (cards from `categories` where `is_active`, DB-first with a graceful fallback),
> `RateTicker` (prominent, honest — if no rate rows exist show "Rates will appear here
> once published" with the disclaimer; never a fake number), `ShowcaseGrid` (demo-labelled
> ProductCards), `WhyChooseUs` (only verifiable claims), `GoldStrip`/`DiamondStrip`/
> `SilverStrip` (alternating editorial compositions, not three identical card rows),
> `BridalFeature`, `CustomCta` (open WhatsApp/contact), `StoreExperience` (address/hours
> placeholders + map link + directions; if `hasMapCoordinates()` is false, show the
> honest "map available once the location is confirmed" state), `ReviewsSection`
> (honest empty state; no sample quotes attributed to customers), `FaqPreview`,
> `NewsletterOrAppointment` **only if a real backend exists — otherwise skip**.
> Every section is a Server Component unless it needs interaction. Bilingual copy in
> `src/lib/i18n/{en,hi}.ts` with key parity. Respect reduced-motion. No lorem ipsum.

**Expected output:** a home page with ~11 distinct sections, all placeholder-aware.
**Files:** `src/app/page.tsx`, `src/components/home/*`, `src/components/ui/*` (reuse),
`src/lib/i18n/*`.
**Testing:** browser at 375/1440 in EN and हिं; keyboard-tab the whole page; check
`prefers-reduced-motion: reduce`; confirm the delivery note and rate disclaimer appear.
**Acceptance:** no invented fact rendered; every section has a real empty state; LCP image
uses `priority`; Lighthouse mobile ≥ 90 performance.
**Likely errors:** `position: fixed` inside a `backdrop-filter` header traps the drawer →
keep overlays outside the header; `new Date()` during prerender → use `src/lib/year.ts`;
raw apostrophes breaking lint → escape them.
**Verify:** toggle language and reload (persists); hero CTAs land on real routes.
**Next-phase needs:** reusable card/section patterns.

---

## PHASE 7 — Navigation & Collections Hub ⬜ TODO

**Objective:** desktop mega menu, mobile drawer, catalogue routing, breadcrumbs.

**Prompt:**
> Inspect `src/components/Navbar*`, `MobileBottomBar`, `src/lib/config.ts` ROUTES and the
> i18n dictionaries. Finalise navigation: sticky-after-scroll desktop bar with
> Home · Collections · Gold · Diamond · Silver · Bridal · Rates · About · Contact, a
> Collections mega menu driven by `categories` (DB) with a fallback list, search icon,
> wishlist badge, WhatsApp icon, EN/हिं toggle. Mobile: full-screen drawer with large tap
> targets (≥44px), sticky WhatsApp + Call actions. Build `/collections` as a hub with
> editorial category cards, plus `[category]/page.tsx` server component that reads the DB
> and 404s disabled categories. Add `Breadcrumbs` (with BreadcrumbList JSON-LD) to every
> nested route. All nav labels bilingual.

**Expected output:** complete navigation + working category routing.
**Files:** `src/components/Navbar*.tsx`, `src/components/MobileDrawer.tsx`,
`src/components/Breadcrumbs.tsx`, `src/app/collections/**`.
**Testing:** tab order, Escape closes overlays, focus returns to the trigger, deep-link each
category, disabled category returns 404, back-button behaviour on the drawer.
**Acceptance:** no dead links; active route indicated; drawer scroll-locks body; z-index
order header (50) > drawer (45) > bottom bar (40).
**Likely errors:** browser back not closing the drawer → sync drawer state with the history
API; mega menu closing on hover gap → padded hover bridge.
**Verify:** 320px width with no horizontal scroll. **Next-phase needs:** category slugs.

---

## PHASE 8 — Product Data Layer ⬜ TODO

**Objective:** typed, cached, RLS-safe product access — no UI coupling.

**Prompt:**
> Inspect `src/lib/supabase/*` and `src/lib/supabase/types.ts`. Create
> `src/lib/products/queries.ts` (server-only) with `listProducts({category, subcategory,
> metal, purity, gender, occasion, stoneType, priceType, inStock, search, sort, page})`,
> `getProductBySlug`, `getRelatedProducts`, `getFeaturedProducts`,
> `getFilterFacets(category)`. Rules: only `status='active'` rows ever leave this module;
> price renders as "Price on Enquiry" when `price_inr` is null or `is_price_on_request`;
> null fields are omitted from DTOs rather than rendered as "undefined";
> list queries use `select` projections (no `*`), server-side filtering, and cache tags
> (`products`, `product:<slug>`) with `revalidate` windows. Add `src/lib/products/demo.ts`
> exposing clearly-labelled DEMO fixtures used **only** when the DB is unreachable, with a
> `DEMO` badge flag on the DTO.

**Expected output:** query module + DTO types + demo fallback.
**Files:** `src/lib/products/*`, `src/lib/supabase/server.ts` (read-only reuse).
**Testing:** unit-style checks in a scratch route or Vitest when added: draft products never
returned, `priceText` correct for each price type, search matches EN and HI names.
**Acceptance:** UI never sees a draft, a null price, or an unlabelled demo row.
**Likely errors:** `await cookies()` in a cached function → wrap the Supabase client behind
the cache boundary; numeric columns arriving as strings from PostgREST → coerce once here.
**Verify:** with the DB empty, catalogue pages show the honest empty state, not a crash.
**Next-phase needs:** stable DTO shape.

---

## PHASE 9 — Product Catalogue UI ⬜ TODO

**Objective:** premium grid with skeletons, pagination and empty states.

**Prompt:**
> Inspect `src/lib/products/queries.ts` and the design system. Build `ProductGrid`,
> `ProductCard` (image with aspect ratio, bilingual name, category label, material/purity
> chips, weight if present, "Price on Enquiry" or the real price, availability state,
> WhatsApp + wishlist + view actions, DEMO badge when `isDemo`), `ProductGridSkeleton`, and
> `EmptyState`. Category pages: server component reads search params, renders the grid,
> count, active-filter chips and pagination (12/page, `?page=`). Never render a sold-out
> item as available. Cards are links to `/products/[slug]`.

**Expected output:** catalogue with loading/empty/error states.
**Files:** `src/components/product/*`, `src/app/collections/**`.
**Testing:** empty DB → empty state; seeded demo → cards; 320px single column, 1440px 4-up;
WhatsApp link on a card carries the product name and code.
**Acceptance:** no layout shift while loading; all images lazy except the first row;
keyboard-focusable card actions.
**Likely errors:** nested `<a>` inside a link card → make actions buttons with
`stopPropagation`; missing `sizes` prop → blurry mobile images.
**Verify:** clicking a sold-out card still opens details with an explicit unavailability note.
**Next-phase needs:** slug routing.

---

## PHASE 10 — Product Detail Pages ⬜ TODO

**Objective:** gallery, honest specs, enquiry actions, Product JSON-LD.

**Prompt:**
> Inspect the product DTO and catalogue components. Build `/products/[slug]` with
> `generateMetadata` (title/description/canonical/OG from real data only), breadcrumbs,
> `ProductGallery` (thumbnails + zoom + keyboard arrows, `next/image`), a spec table that
> **omits** every null field (material, purity with karat+fineness, weight, stone type,
> diamond details, product code, availability), price block ("Price on Enquiry" /
> "Calculated from current rates + applicable charges" / fixed price / unavailable),
> `ShareRow` (WhatsApp, copy link, native share), and CTAs: Enquire on WhatsApp
> (message includes name + code), Call Us, Visit Store. Add related products (same
> category, exclude self). Emit `Product` JSON-LD **only** when price and availability are
> genuine; otherwise emit `BreadcrumbList` only. `notFound()` for draft/archived slugs.

**Expected output:** full PDP + metadata + conditional schema.
**Files:** `src/app/products/[slug]/page.tsx`, `src/components/product/*`.
**Testing:** open each price type; zoom with mouse and keyboard; copy-link toast; view-source
for JSON-LD; ask for a draft slug (must 404); print stylesheet sanity.
**Acceptance:** no "undefined"/"null"/`₹0` anywhere; WhatsApp text correct in EN and हिं.
**Likely errors:** OG image missing for demo items → fall back to a branded default OG;
`generateMetadata` hitting the DB twice → cache the lookup with `cache()`.
**Verify:** product page works with the DB unreachable (demo mode labelled).
**Next-phase needs:** product search fields.

---

## PHASE 11 — Search, Filters & Sorting ⬜ TODO

**Objective:** fast search + facet filters that only show real data.

**Prompt:**
> Inspect `queries.ts`, `ProductGrid` and the header search affordance. Build a global
> `SearchDialog` (opens from navbar and `/` shortcut, debounced input, suggestions for
> categories + product names, recent searches in localStorage, empty state with category
> links, keyboard navigation) and `FilterPanel` + `SortSelect` for category pages:
> category, subcategory, metal, purity, gender, occasion, stone type, price range,
> availability; sorting featured/newest/price asc/desc. Facets come from
> `getFilterFacets()` so a filter with zero possible values is not rendered. Filters are
> URL-driven (`searchParams`) so results are shareable and back/forward works. Server-side
> filtering only.

**Expected output:** working search + filters.
**Files:** `src/components/search/*`, `src/components/filters/*`, category pages,
`src/lib/products/queries.ts`.
**Testing:** "gold ring", "silver bracelet", "bridal necklace", "mangalsutra";
zero-result query; filter combinations; clearing all filters; reload keeps state.
**Acceptance:** search covers EN and HI names and product codes; facets reflect the DB;
no client-side full-table fetch.
**Likely errors:** search term read during prerender → read from `searchParams` only;
trigram index unused because of `ilike` without `pg_trgm` operator → use
`.textSearch()`/`ilike` with the GIN index and verify with `explain`.
**Verify:** Hindi search returns results; empty query shows recent/category suggestions.
**Next-phase needs:** rate page shell.

---

## PHASE 12 — Rate Provider Integration ⬜ TODO

**Objective:** real, pluggable, key-safe rate source. No fake numbers, ever.

**Prompt:**
> Read §F of `docs/ARCHITECTURE.md`, `src/lib/supabase/{admin,server}.ts` and the
> `metal_rates` columns from Phase 4. Implement `src/lib/rates/`:
> `types.ts` (`RateQuote`, `RateProvider`), `manualProvider.ts` (reads the latest
> admin-entered rows — the default that always works, source label
> "IBJA benchmark entered by Tulsi Jewellers"), `httpProvider.ts` (generic JSON provider
> configured from env + `site_settings` field mapping: base URL, auth header name, API key
> from `RATE_API_KEY`, JSON paths for gold 999/916/750/585 and silver 999, session, and
> provider timestamp), `index.ts` (`getRateProvider()` selected by `RATE_PROVIDER`),
> `validate.ts` (schema + numeric + > 0 + plausible band ±25% vs previous + currency/unit/
> purity/unit checks + non-future, non-ancient timestamp), `format.ts` (INR formatting with
> Indian digit grouping, karat↔fineness labels, delta formatting), `status.ts`
> (`v_latest_rates` + `rate_provider_status` reader with `dataAgeMinutes`, `isStale`).
> Absolutely no scraping of ibjarates.com, no client-side fetch of the external provider,
> no `NEXT_PUBLIC_` key, and no silent provider switching — the active source is always
> shown to the visitor. When the provider is unset or fails, return the last valid rows
> from the DB with their original timestamps.

**Expected output:** provider abstraction + validators + formatters.
**Files:** `src/lib/rates/*`, `.env.example` (`RATE_PROVIDER`, `RATE_API_KEY`,
`RATE_API_BASE_URL`, `CRON_SECRET`).
**Testing:** unit-check validation against: missing field, zero, negative, string value,
absurd 10× jump, wrong unit, stale timestamp — each must reject and preserve the previous row.
**Acceptance:** switching `RATE_PROVIDER` changes the source with no code edits; the
disclaimer text renders on every rate surface.
**Likely errors:** provider returns paise vs rupees → explicit unit mapping and a
documented assumption; timezone drift → store timestamptz, display IST with the zone named.
**Verify:** with no provider configured the site shows manual-mode copy, not an error.
**Next-phase needs:** provider interface frozen.

---

## PHASE 13 — Rate Database & Today's Rates Page ⬜ TODO

**Objective:** the most prominent, most trustworthy page on the site.

**Prompt:**
> Using the Phase 12 modules, build `/rates`: header block (Date, Last updated, Source,
> `MarketStatusPill` — Live / Updated / Market closed / Data unavailable, and
> "updated X minutes ago"), `RateCard` per purity (24K/999, 22K/916, 20K/833 if present,
> 18K/750, 14K/585 gold; 999 silver, labelled /kg and /10g where the unit differs) with
> change vs previous published rate using **neutral** styling, AM/PM session tags, and
> GST/making-charge status text; `RateHistoryTable` (recent rows) and the mandatory
> disclaimer verbatim from config; a staleness banner when `isStale`; and an honest empty
> state when no rows exist ("No verified rate has been published yet — rates appear here
> once Tulsi Jewellers publishes the IBJA benchmark"). Add a compact `RateTicker` for the
> homepage and a `/api/rates/latest` route handler (cached, revalidate-tagged `rates`)
> that the ticker polls every 5 minutes **only while the tab is visible** — not every
> page render, not per visitor. Never call the external provider from the browser.

**Expected output:** rates page + ticker + latest-rates endpoint.
**Files:** `src/app/rates/page.tsx`, `src/components/rates/*`, `src/app/api/rates/latest/route.ts`.
**Testing:** no-rows state; one row; two sessions same day; stale row (fake observed_at older
than 24h) → banner; weekend scenario → "published on business days only" note; tab-hidden
polling stops.
**Acceptance:** no `₹0`, no blank card, source+timestamp visible on every number; the
disclaimer is present; polling stops when hidden.
**Likely errors:** hydration mismatch from `Date.now()` → compute relative time in a
client component after mount or render an ISO label; ticker layout shift when numbers
change → reserve width with `tabular-nums`.
**Verify:** screen-reader announces rate updates politely (`aria-live="polite"`).
**Next-phase needs:** stable rate rows for history.

---

## PHASE 14 — Automatic Daily Updates (cron + health) ⬜ TODO

**Objective:** rates refresh themselves twice per business day, safely.

**Prompt:**
> Build `POST /api/cron/fetch-rates`: requires `Authorization: Bearer ${CRON_SECRET}`
> (404 when the secret is unset or wrong), runs the Phase 12 provider, validates with
> `validate.ts`, upserts into `metal_rates` on the natural key
> `(metal, purity, unit, effective_date, market_session, provider)` **without ever
> overwriting a valid row with an invalid one**, computes and stores the delta, writes a
> `rate_job_logs` row (job, status, message, rows_affected, duration_ms), updates
> `rate_provider_status` (last_success_at / last_error_at / consecutive_failures), and
> calls `revalidateTag('rates')`. Add `vercel.json` cron entries for 05:30 and 13:15 UTC
> Monday–Friday (≈ 11:00 and 18:45 IST) with the comment explaining that IBJA does not
> publish on weekends/holidays, and a documented fallback (Supabase `pg_cron` + `pg_net`,
> or a GitHub Actions schedule) for when Vercel's Hobby cron limits change. Add
> `/admin/rates` manual-entry form for the owner (validated, source-labelled, audited) so
> the system is fully functional with zero paid APIs.

**Expected output:** cron route + config + manual entry.
**Files:** `src/app/api/cron/fetch-rates/route.ts`, `vercel.json`, `src/app/admin/rates/*`,
`src/lib/rates/ingest.ts`.
**Testing:** call the route with no/wrong/correct secret; provider returning junk →
previous row intact + error logged; run twice in the same session → idempotent (no
duplicate rows); verify `revalidateTag` refreshes `/rates`.
**Acceptance:** two runs/day produce exactly two session rows; failures never corrupt data;
every attempt leaves a log row.
**Likely errors:** cron timezone confusion (cron is UTC — document IST equivalents);
`revalidateTag` in a route handler with no cache tags → tag the rate queries.
**Verify:** window with no published row shows the previous verified rate with its own date.
**Next-phase needs:** accumulated history.

---

## PHASE 15 — Rate History ⬜ TODO

**Objective:** honest charts and a table from real rows only.

**Prompt:**
> Build `/rates/history` using `v_rate_history_daily`: range tabs 1D / 7D / 30D / 3M / 6M /
> 1Y / All, series selector (Gold 999, Gold 916, Gold 750, Gold 585, Silver 999), AM/PM
> session toggle **only when both sessions exist**, `RateChart` as a hand-rolled SVG line
> with accessible fallback (a visually hidden data table + `role="img"` with an
> `aria-label` summarising range, min, max), high/low/open/latest stats where the data
> supports them, and a table with date × purity columns plus CSV export generated
> client-side from the same data. Gaps are real gaps: weekends and holidays are **not**
> interpolated, and the chart shows a note when a range contains no published rows.
> Never fabricate a value to fill a date.

**Expected output:** history page with charts, stats, table, export.
**Files:** `src/app/rates/history/page.tsx`, `src/components/rates/RateChart.tsx`,
`RateHistoryTable.tsx`.
**Testing:** empty range; single point; weekend gap; AM-only range (session toggle hidden);
CSV contents match the visible table; keyboard access to range tabs.
**Acceptance:** no interpolated/fake points; chart readable at 320px; reduced-motion still
renders the final chart (no animation dependency).
**Likely errors:** duplicate rows per date when the provider changes → group by date+session
and label the provider if it changed mid-range; timezone shifting dates by one day → build
series from `effective_date` strings, not `Date` objects.
**Verify:** totals reconcile with `select count(*)` on the same range.
**Next-phase needs:** reliable latest rate for the calculator.

---

## PHASE 16 — Gold/Silver Calculator ⬜ TODO

**Objective:** transparent estimate, never a quotation.

**Prompt:**
> Build `/rates/calculator`: inputs metal, purity, weight (g) with unit toggle (g / 10g),
> and — only if `pricing_rules` has public rows — making charge (% or ₹/g), wastage (%),
> stone charge (₹) and GST (%). Compute metal value from the latest verified rate with the
> purity factor, show a line-item breakdown (metal value, making, wastage, stone, GST,
> estimated total), label everything "Estimated price — not a quotation", display the rate
> source/date/time and the mandatory disclaimer, and provide "Enquire on WhatsApp" with the
> full breakdown pre-filled in the message. If pricing rules are missing (the default),
> show the metal value only with a note that making charges and taxes are not included and
> must be confirmed with the showroom. Client component, pure math in
> `src/lib/rates/calculate.ts` (unit-tested), no floating-point money errors
> (round to 2dp at the end only).

**Expected output:** calculator page + tested math module.
**Files:** `src/app/rates/calculator/page.tsx`, `src/lib/rates/calculate.ts`,
`src/components/rates/RateCalculator.tsx`.
**Testing:** 8.5 g 22K against a known rate; 0/negative/absurd weight; purity switch;
rules present vs absent; WhatsApp message contains the breakdown.
**Acceptance:** no hardcoded shop charges; the word "quotation" never appears as a promise;
results are labelled estimates.
**Likely errors:** rounding each line then totalling (drift) → round once at the end;
weight unit confusion (10 g) → explicit unit label on the input.
**Verify:** values reconcile with a manual calculation for two purities.
**Next-phase needs:** admin auth.

---

## PHASE 17 — Admin Dashboard ⬜ TODO

**Objective:** the owner can run the shop without touching code.

**Prompt:**
> Inspect `admin_users`, `is_admin()` and `src/lib/supabase/*`. Build `/admin` guarded by
> Supabase Auth email/password + `middleware.ts` that checks the `admin_users` allowlist
> (and re-checks `is_admin()` in every route handler — the middleware is UX, not security).
> Screens: Dashboard (today's gold/silver rate, last update time, provider status,
> DB status, counts for products/enquiries/pending reviews, featured list), Products CRUD
> (create/edit/archive, image upload to the `product-images` bucket with alt text in EN+HI,
> price type selector, availability, featured, demo flag) , Categories, Rates (manual entry
> + full history + job logs), Enquiries (list, status workflow new→in_progress→resolved,
> no bulk export of personal data), Announcements, FAQs, Reviews (approve/reject — genuine
> only), Settings (public site settings, pricing rules with an `is_public` toggle).
> Every mutation goes through a server route handler with Zod validation and an
> `is_admin()` re-check; role `staff` cannot delete or change pricing rules. Rate-provider
> health panel: Connected/Error, last success, last failure, data age, and a red
> "Rate provider data has not updated recently" warning when stale. No secrets ever reach
> the browser.

**Expected output:** working admin panel + guard.
**Files:** `src/app/admin/**`, `src/app/api/admin/**`, `src/middleware.ts`,
`src/lib/validation/*`.
**Testing:** signed-out access → redirect; non-admin signed-in → 403; staff vs owner
permissions; create/edit/archive a product and see it appear/disappear on the site;
approve a review; upload an image; unauthenticated POST to an admin route → 401.
**Acceptance:** no admin route leaks data without a role check; all writes audited by
`updated_at`/logs.
**Likely errors:** middleware reading cookies in edge runtime incorrectly → use
`@supabase/ssr` `createServerClient` with `await cookies()` pattern; RLS blocking the admin
write path because requests use the anon key → server routes use the user's session
(admin RLS policies) and only the service role for genuinely privileged jobs.
**Verify:** revoke the admin row and confirm access is refused on the next request.
**Next-phase needs:** real coordinates (or an accepted placeholder state).

---

## PHASE 18 — Store Location & Google Maps ⬜ TODO

**Objective:** an elegant, keyless, honest "find us" experience.

**Prompt:**
> Build `/visit` and a reusable `MapSection` (+ Home "Visit Tulsi Jewellers" section):
> keyless embed iframe (`https://www.google.com/maps?q=<lat>,<lng>&output=embed`,
> `loading="lazy"`, `title`, 16:9 → 4:3 responsive, sandboxed permissions), shop marker
> context in copy, address/phone/WhatsApp/email/hours blocks that render placeholders
> visibly as placeholders, Get Directions (keyless `dir/?api=1&destination=`), Share
> Location (Web Share API with copy-link fallback), and a `UseMyLocationButton` slot for
> Phase 19. When `hasMapCoordinates()` is false, replace the iframe with an honest panel:
> "Interactive map will appear once the showroom location is confirmed" plus the address
> text and a Google Maps link if the owner supplied one. Add `JewelryStore`/`LocalBusiness`
> JSON-LD with **only** verified fields (omit address/geo/phone while placeholders).
> Include the outside-Nagpur delivery statement on this page.

**Expected output:** visit page + map component + location schema.
**Files:** `src/app/visit/page.tsx`, `src/components/location/*`.
**Testing:** with placeholder coords → honest panel, no broken iframe; with coords → map
loads lazily, directions link reaches the right destination; 320px layout; JSON-LD valid
(Rich Results test) and contains no invented data.
**Acceptance:** no API key required, no billing risk; schema omits unverified fields.
**Likely errors:** `X-Frame-Options`/CSP blocking the Google iframe → allow
`frame-src https://www.google.com https://maps.google.com`; iframe without a title =
a11y failure.
**Verify:** directions open correctly on a phone; page still works with JS disabled.
**Next-phase needs:** coordinates confirmed with the owner.

---

**End of Part 1.** Continue with [PROMPT_CHAIN_19_36.md](./PROMPT_CHAIN_19_36.md).
