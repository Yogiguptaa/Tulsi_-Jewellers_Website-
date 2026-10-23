# TULSI JEWELLERS — MASTER ARCHITECTURE

> Status: **design document** (no application code is written from this file).
> Single source of truth for facts stays `src/lib/config.ts`. Build log: `CONTEXT.md`.
> Prompt chain: `docs/PROMPT_CHAIN_1_18.md` + `docs/PROMPT_CHAIN_19_36.md`.
> Owner input list: `docs/OWNER_CHECKLIST.md`.

---

## A. WEBSITE VISION

A bilingual (English / हिंदी) luxury jewellery showroom site for a real Nagpur shop,
built so that **nothing on it is invented**. Every fact is either verified by the
owner, present in the Supabase database, or visible as a bracketed placeholder.

Feeling to create, in priority order:

| Impression | How it is earned |
|---|---|
| Trustworthy | Real NAP block, real Google Maps placement, zero invented claims, honest rate disclaimers |
| Premium | Ivory/champagne palette, serif display type, editorial spacing, restrained gold hairlines |
| Local & real | Nagpur/Nagpur-only language, Hansapuri showroom, landmark mentions only if supplied |
| Craft | Large photography, unhurried scroll rhythm, few but deliberate motions |
| Easy to act | WhatsApp + call + directions reachable from every screen, mobile bottom action bar |

Anti-goals: gold-on-gold gradients, confetti animations, fake "50% OFF" banners,
fake testimonials, lorem ipsum, template-looking hero-with-three-icons layout.

**Honesty rules that outrank every design idea**

1. No invented business facts (address, phone, WhatsApp, email, hours, GST, year,
   awards, hallmark/BIS claims, lab names, reviews, prices, stock).
2. Home delivery **outside Nagpur is not available** — exact wording from
   `DELIVERY.outsideNagpurNote`, displayed wherever delivery is mentioned.
3. No promise of delivery *inside* Nagpur either until the owner confirms terms.
4. Rates always carry source, date, time, unit, purity, session, GST status and
   the "indicative, not final retail price" disclaimer. Never `₹0`, never blank.
5. Demo catalogue items are labelled DEMO and never look like real Tulsi stock.
6. Reviews table is empty until genuine reviews exist; the UI shows an honest
   "reviews pending" state instead of sample quotes.

---

## B. SITEMAP (final target — 35 routes)

Legend: **[B]** already built in Stage 1 · **[S2]** schema/seed exist · **[N]** new.
All routes are bilingual through the `LanguageProvider` (copy, not URL prefixes,
unless the owner wants `/hi/...` later — see decision D7).

| # | Route | Page | Status |
|---|---|---|---|
| 1 | `/` | Home | [B] scaffold, rebuilt Phase 6 |
| 2 | `/about` | About Us | [N] Phase 23 |
| 3 | `/collections` | All collections hub + catalogue | [N] Phase 9 |
| 4 | `/collections/gold-jewellery` | Gold | [S2] category |
| 5 | `/collections/diamond-jewellery` | Diamond | [S2] |
| 6 | `/collections/silver-jewellery` | Silver | [S2] |
| 7 | `/collections/fancy-jewellery` | Fancy / fashion | [S2] |
| 8 | `/collections/gold-coins-biscuits` | Gold coins & biscuits | [S2] |
| 9 | `/collections/gems-ratna` | Gems (ratna) | [S2] |
| 10 | `/collections/rings` | Rings | [N] subcategory |
| 11 | `/collections/necklaces` | Necklaces | [N] |
| 12 | `/collections/earrings` | Earrings | [N] |
| 13 | `/collections/bangles-bracelets` | Bangles & bracelets | [N] |
| 14 | `/collections/chains` | Chains | [N] |
| 15 | `/collections/pendants` | Pendants | [N] |
| 16 | `/collections/mangalsutra` | Mangalsutra | [N] |
| 17 | `/collections/bridal` | Bridal collection | [N] |
| 18 | `/collections/mens-jewellery` | Men's | [N] |
| 19 | `/collections/womens-jewellery` | Women's | [N] |
| 20 | `/collections/kids-jewellery` | Kids' | [N] |
| 21 | `/collections/custom-bespoke` | Custom / bespoke | [N] |
| 22 | `/products/[slug]` | Product detail | [N] Phase 10 |
| 23 | `/rates` | Gold & Silver Rates (today) | [N] Phase 12–14 |
| 24 | `/rates/history` | Rate history + charts + table | [N] Phase 15 |
| 25 | `/rates/calculator` | Gold/silver price calculator | [N] Phase 16 |
| 26 | `/scheme` | Gold Saving Scheme (₹499 enrolment, enquiry only) | [B] config, page [N] |
| 27 | `/guides` | Guides hub | [N] Phase 24 |
| 28 | `/guides/gold-purity` | Gold purity + 22K vs 18K + hallmark | [N] |
| 29 | `/guides/diamond-4cs` | Diamond 4Cs | [N] |
| 30 | `/guides/jewellery-care` | Care (gold/silver/diamond) | [N] |
| 31 | `/guides/buying-checklist` | Buying checklist + bridal guide | [N] |
| 32 | `/faq` | FAQ (+ FAQ schema) | [S2] seed exists |
| 33 | `/contact` | Contact + form | [N] Phase 22 |
| 34 | `/visit` | Store location / Find us | [N] Phase 18–20 |
| 35 | `/policies/{delivery,returns,privacy,terms}` | 4 policy pages | [N] Phase 26 |
| — | `/sitemap.xml`, `/robots.txt`, `not-found`, `error` | infra | [B] partial, Phase 27 |

Route groups: `(marketing)` public · `(legal)` policies · `admin/*` auth-guarded.
**Only categories the owner actually stocks stay enabled** — `categories.is_active`
in the DB plus `SHOP_CATEGORIES` in config; disabled ones 404 rather than showing
empty shelves.

---

## C. TECHNOLOGY STACK

| Layer | Choice | Why (and why not the alternative) |
|---|---|---|
| Framework | **Next.js 16.4 App Router + Turbopack** (installed) | SSR for SEO, Route Handlers for the rate job, "use cache" for cheap repeat renders |
| Language | **TypeScript strict** (installed) | Placeholder/`null` discipline is what keeps invented facts out |
| Styling | **Tailwind v4 `@theme` tokens** (installed) | Design system in one file; no runtime CSS cost |
| Motion | **Framer Motion** (installed) | Already in the tree; used in ≤6 components, all respecting reduced-motion |
| Icons | **Lucide** (installed) | Tree-shaken; socials use inline SVG (Instagram/Facebook left Lucide) |
| Database | **Supabase Postgres** (client libs installed) | Only free option already in the project that gives Postgres + RLS + Auth + Storage + Realtime + pg_cron together. A catalog check for alternatives surfaced nothing that covers auth+RLS+realtime in one service, so no swap is justified |
| Auth (admin) | **Supabase Auth** + `admin_users` allowlist | Role separation owner/staff enforced in the DB, not just the UI |
| Files | **Supabase Storage** bucket `product-images` | Public read, admin-only write (bucket created in Stage 2 schema) |
| Charts | **hand-rolled SVG sparkline/line** | A chart library would add 40–90 KB for one page; the data is ≤400 points |
| Email | *not in v1* | Enquiries are stored in the DB (owner's choice); adding Resend later is one adapter |
| Hosting | **Vercel Hobby** (assumed, free) | Next-native, 2 cron jobs/day = exactly IBJA's AM+PM cadence. Alternative: Supabase `pg_cron` + `pg_net` if cron limits tighten |

Everything is free-tier by default. **Paid items are explicitly optional and
flagged in §F**: a commercial Indian benchmark-rate API key, and (only if the
owner wants a custom-styled map) a Google Maps JS API key.

---

## D. DESIGN SYSTEM

### D1. Colour tokens (`src/app/globals.css` → `@theme`)

| Token | Value | Use |
|---|---|---|
| `--color-ivory` | `#FAF6EE` | page background |
| `--color-offwhite` | `#FFFDF8` | raised surfaces, cards |
| `--color-champagne` | `#EFE3CC` | borders, quiet fills |
| `--color-charcoal` | `#241F1C` | primary text |
| `--color-maroon` | `#5A0F1B` | brand accent, headings |
| `--color-gold` | `#B8923A` | hairlines, icons, 1px rules, buttons |
| `--color-emerald` | `#0F3D2E` | rare accent (trust/rate "up" never — see below) |
| `--color-rate-up` / `--color-rate-down` | neutral `#5C5C5C` / `#7A5C52` | rate deltas are **neutral by design** — no green/red trading-screen look |

Rule: gold is **borders, icons, separators, small buttons** — never body text,
never large fills. Body text is charcoal on ivory (AA contrast verified).

### D2. Typography

- Display: **Playfair Display** (serif) — headings, numerals in hero only.
- Body: **Inter** — 16px/1.7 base, max 68ch measure.
- Devanagari: **Tiro Devanagari Hindi** (display) + **Noto Sans Devanagari** (body).
- Scale: 12 / 14 / 16 / 18 / 20 / 24 / 32 / 44 / 60 (clamp on the top three).
- Hindi: letter-spacing override for `tracking-*` classes is already global.

### D3. Spacing, radius, elevation

4px base scale. Section rhythm: `py-16` mobile → `py-28` desktop; alternating
section compositions so the page never reads as "another card grid".
Radius: `4px` inputs/buttons, `8px` cards, `0` for editorial image blocks.
Elevation: hairline champagne border + 1 soft shadow token; no glow.

### D4. Component system (names fixed here so the prompt chain can reuse them)

Primitives `src/components/ui/`: `Button` (3 variants, 3 sizes) · `Badge` ·
`SectionHeading` (eyebrow/serif title/lede) · `Skeleton` · `EmptyState` ·
`Breadcrumbs` · `Toast` · `Select` · `Input` · `Textarea` · `Checkbox` ·
`Tabs` · `Modal` · `GoldRule` (decorative 1px divider) · `Stat`.
Feature: `Navbar` (+`MegaMenu`, `MobileDrawer`, `SearchDialog`) · `Footer` ·
`ProductCard` · `ProductGrid` · `ProductGallery` (zoom + thumbs) · `FilterPanel` ·
`SortSelect` · `WishlistButton` · `RateTicker` · `RateCard` · `RateChart` ·
`RateTable` · `RateCalculator` · `MarketStatusPill` · `WhatsAppButton` ·
`CallButton` · `ContactForm` · `MapSection` (+`UseMyLocationButton`) ·
`ReviewCarousel` (honest empty state) · `FAQAccordion` · `ArticleLayout` ·
`LoadingScreen` · `BackToTop` · `MobileActionBar` · `ShareRow` · `DemoBadge`.

Data layer `src/lib/`: `config.ts` (facts) · `i18n/*` · `supabase/{client,server,admin,env,types}` ·
`rates/{provider,manualProvider,httpProvider,status,format}` · `products/*` ·
`geo.ts` (haversine) · `analytics.ts` · `validation/*` (Zod schemas) · `slug.ts`.

### D5. Motion tokens

| Token | Value | Applied to |
|---|---|---|
| `fadeUp` | 400ms, 12px, ease-out | section reveals (IntersectionObserver, once) |
| `imageReveal` | 700ms clip-path | editorial images |
| `hoverLift` | 200ms, 1.02 scale | product cards only |
| `goldSweep` | 900ms, 1 pass | hero ornament, rate card on update |
| `numberRoll` | 500ms | rate value change |

`prefers-reduced-motion: reduce` → all of the above collapse to opacity 0→1 in
0ms; parallax and the sparkle cursor turn off entirely.

---

## E. FEATURE MAP

**P0 — required for "fully functional"**

1. Bilingual shell, header/mega-menu/search drawer, mobile drawer, footer, 404.
2. Home: hero, brand intro, featured collections, showcase grid, why-choose,
   gold/diamond/silver/bridal strips, custom CTA, store experience, reviews state, FAQ, rate ticker.
3. Catalogue: DB-backed grid, category/subcategory pages, filters + sorting,
   skeletons, empty states, pagination.
4. Product detail: gallery + zoom, spec table (only non-null fields), availability,
   WhatsApp enquiry with product name + code, call, visit, share/copy link, breadcrumbs.
5. Rates: today's cards (per purity), source/timestamp/session/GST/making-charge
   flags, change vs previous, market status, staleness banner, disclaimer,
   history charts (1D/7D/30D/3M/6M/1Y) + table, calculator with configurable charges.
6. Rate pipeline: provider abstraction, admin manual entry (always works),
   optional HTTP provider, cron route with secret, validation, never-overwrite-on-error,
   `rate_job_logs`, health panel.
7. Enquiries: Zod-validated forms (contact, product, scheme, custom, callback,
   bridal consult) → `enquiries` table, honeypot + rate limit, success/error states.
8. Contact & Visit: NAP, map embed, hours (only when real), get directions,
   geolocation → Haversine distance, permission-denied path.
9. Policies (4), About, Guides (4), FAQ — all placeholder-aware.
10. SEO: metadata per route, OG/Twitter, canonical, LocalBusiness + JewelryStore
    + BreadcrumbList + FAQPage + Product (only genuine data), sitemap, robots.
11. Admin: login, dashboard (rates, API health, counts, latest enquiries),
    products/categories/rates/announcements/FAQs/settings CRUD, role guard.
12. A11y + performance pass; reduced motion; keyboard paths; Core Web Vitals budget.

**P1 — high value, still in scope**

Wishlist (localStorage + DB-ready) · recently viewed · product comparison (2–4) ·
share/copy link · appointment & callback requests · rate alerts (schema only,
needs email/WhatsApp backend) · jewellery education pages · size guide ·
printable product sheet · Hindi content completeness.

**P2 — deferred, documented not built**

WhatsApp Business API automation (needs paid provider + verified number) ·
SMS/email rate alerts delivery · GA4 audience remarketing · multi-store ·
online payments (**explicitly out of scope — no online payments**) ·
multi-currency · customer accounts.

---

## F. RATE-PROVIDER STRATEGY (the one everyone fakes — here it is real)

### F1. Verified facts about the benchmark source

- **IBJA (India Bullion & Jewellers Association)** is the Indian benchmark
  publisher: daily **Opening** and **Closing** rates, 999/995/916/750/585 gold
  and 999 silver, **exclusive of GST**.
- IBJA's own terms state: **no publication on Saturdays and Sundays**, no
  publication on central-government holidays, office 10:30–18:30 IST.
- Therefore "live tick-by-tick Indian gold rate" **does not exist for free**.
  Two publications per business day is the honest maximum from this source.
- IBJA does not publish an unrestricted public JSON API. Third-party resellers
  (e.g. `indiagoldratesapi.com`) expose IBJA AM/PM data **with an API key on a
  paid plan**. Scraping `ibjarates.com` from our server is fragile and not
  licensed — **not implemented at any phase**.

### F2. Provider abstraction (`src/lib/rates/provider.ts`)

```ts
export type RateQuote = {
  metal: "gold" | "silver";
  purity: "999" | "995" | "916" | "833" | "750" | "585";
  unit: "INR_PER_10_GRAM" | "INR_PER_KG";
  rate: number;                 // > 0, always
  marketSession: "AM" | "PM" | "DAILY" | "LIVE";
  effectiveDate: string;        // YYYY-MM-DD
  observedAt: string;           // ISO, provider timestamp
  provider: string;             // machine id, e.g. "ibja_api"
  sourceLabel: string;          // what the visitor reads
  gstIncluded: boolean;         // IBJA = false
  makingChargesIncluded: boolean;// always false
};

export interface RateProvider {
  id: string;
  sourceLabel: string;
  getLatestRates(): Promise<RateQuote[]>;
  getHistoricalRates(from: string, to: string): Promise<RateQuote[]>;
  getProviderStatus(): Promise<{ ok: boolean; message: string }>;
}
```

Implementations, selected by `RATE_PROVIDER` env var:

| id | Works with | Cost | Behaviour |
|---|---|---|---|
| `manual` **(default, shipped)** | nothing | free | Owner/staff type the IBJA AM & PM rate into `/admin/rates` once or twice a day. Real data, real timestamps, attributed as "IBJA benchmark entered by Tulsi Jewellers". Site is 100% functional with zero keys |
| `http_json` | any provider the owner buys (IBJA reseller, Metals-API, GoldAPI.io, metalpriceapi…) | paid/key | Fully automated AM+PM fetch driven by a JSON field-mapping config in `site_settings` so no code change is needed to switch vendors |
| `indicative_spot` | free-tier international spot APIs | free/limited | **Clearly labelled "indicative international spot converted to INR — not the IBJA benchmark"**. Off by default; only if the owner accepts non-benchmark numbers |

A provider is never silently swapped. `site_settings.active_rate_provider` +
the `source` column on every row means the visitor always sees which source a
number came from, and history rows keep the provider that produced them.

### F3. Data pipeline (never fetched from the visitor's browser)

```
cron (Vercel Hobby 2×/day: 05:30 UTC ≈ 11:00 IST, 13:15 UTC ≈ 18:45 IST,
      Mon–Fri only)  →  POST /api/cron/fetch-rates  (Authorization: Bearer CRON_SECRET)
   →  provider.getLatestRates()
   →  validate (schema, >0, plausible band, currency, unit, purity, non-stale timestamp)
   →  compare with last stored value (compute delta, keep history)
   →  upsert metal_rates (idempotent on natural key)
   →  write rate_job_logs (success | error | skipped + duration)
   →  revalidate cache tags ["rates"] so pages refresh
```

Failure handling: on any validation/network failure **the last valid row is
never overwritten**; the job logs the error and the UI shows
*"Latest verified rate temporarily unavailable — displaying previous verified
data"* with the older timestamp visible. No `₹0`, no blank card, ever.
Weekends/holidays: the newest row simply has an older `effective_date`, and the
UI says "Last published: Fri 18:45 IST (IBJA publishes on business days only)".

### F4. Rate schema additions (Stage 2.1 migration — see §J)

`metal_rates` gains `provider`, `market_session`, `effective_date`,
`gst_included`, `making_charges_included`, `is_verified`,
`superseded_by`, plus a unique natural key and a `v_latest_rates` view that
computes previous value + delta so the UI never does that math itself.

### F5. Visitor-facing honesty contract (every rate surface)

Each card shows: **purity (karat + fineness) · rate + unit · source label ·
effective date · AM/PM session · "exclusive of GST" or "incl. GST" ·
making-charge status · change vs previous published rate · market status pill**.
Every rate page ends with the mandatory disclaimer:

> Displayed bullion rates are indicative benchmark/market rates from the stated
> source and may exclude GST, making charges, wastage, stone charges and other
> applicable charges. Final jewellery pricing is subject to Tulsi Jewellers'
> applicable pricing and product details.

Words banned in the UI: "live tick", "real-time live rate" (unless a genuine
live feed is configured), "today's fixed price".

### F6. Calculator (Phase 16)

Metal value = `rate × weight × purity factor`. Then optional, **admin-configured
only** components: making charge (% or ₹/g), wastage %, stone charge (₹), GST %
(from `pricing_rules`, `is_public` gate). Output is labelled
**"Estimated price — not a quotation"**, and hidden entirely if the owner
hasn't configured the rules (default state).

---

## G. LOCATION & GEOLOCATION STRATEGY

- Central config: `CONTACT.latitude/longitude/googleMapsLink` in `config.ts`
  (already scaffolded as `null` + `hasMapCoordinates()` guard). Values supplied
  by the owner; **no coordinates are ever invented**. *(The Google listing found
  during exploration — 21.1535569, 79.0990804, Bhandara Rd, Hansapuri — is
  pre-filled only after the owner confirms it.)*
- Map: **keyless Google embed** `https://www.google.com/maps?q=<lat>,<lng>&output=embed`
  inside a lazy `iframe` (loading="lazy", titled, 16:9 → 4:3 responsive). No API
  key, no billing risk. A Google Maps **JS** API map is a documented upgrade only
  if the owner supplies a key with billing enabled; the site works without it.
- Directions: `https://www.google.com/maps/dir/?api=1&destination=<lat>,<lng>`
  (keyless). When the visitor shares their location we add
  `&origin=<lat>,<lng>` so the route opens already computed.
- **Geolocation is opt-in only** — a button ("Use my current location"), never on
  load, never stored. Denied → *"Location permission was not granted. You can
  still use Google Maps to get directions."* Timeout/unsupported → same fallback.
- Distance: Haversine in `src/lib/geo.ts` (pure function, unit-tested with known
  city pairs), rendered as "≈ 4.2 km away" plus "Nearby (under 5 km)" styling.
  Accuracy of the rough phrasing is deliberate: IP-less browser GPS is good to
  ~10–50 m, but the copy never implies precision we don't have.
- Permission policy header includes `geolocation=(self)` so embeds can't request it.
- Privacy: `privacy` policy states location is processed in the browser only,
  never sent to the server, never stored (and this is true — it is).

---

## H. DATABASE DESIGN

Already created in Stage 2 ([supabase/schema.sql](../supabase/schema.sql), 599 lines,
13 tables, RLS everywhere): `admin_users`, `categories`, `products`,
`product_images`, `metal_rates`, `pricing_rules`, `enquiries`, `scheme_enquiries`,
`announcements`, `faqs`, `reviews`, `site_settings`, `rate_job_logs`, plus enums,
trigram indexes, `updated_at` triggers, `is_admin()`, and the `product-images`
bucket.

### H1. Stage 2.1 migration — additive only, nothing existing is dropped

| Object | Change | Purpose |
|---|---|---|
| `metal_rates` | `+ provider text not null default 'manual'`, `+ market_session market_session`, `+ effective_date date not null`, `+ gst_included boolean not null default false`, `+ making_charges_included boolean not null default false`, `+ is_verified boolean not null default false`, `+ superseded_by uuid`, `+ note text` | full audit trail per master spec |
| enum | `+ market_session ('AM','PM','DAILY','LIVE')` | IBJA AM/PM vs daily/manual vs live |
| `metal_rates` | unique `(metal, purity, unit, effective_date, market_session, provider)` | idempotent cron upsert, true history |
| view | `v_latest_rates` | latest verified row per (metal,purity,unit) + previous rate + absolute/percent delta |
| view | `v_rate_history_daily` | one row per date with 999/916/750/585 + silver columns for the table export |
| `products` | `+ subcategory text`, `+ gender gender_kind`, `+ occasion text[]`, `+ stone_type text`, `+ diamond_details jsonb`, `+ price_type price_type not null default 'on_enquiry'`, `+ featured boolean`, `+ tags text[]`, `+ search_doc tsvector` (generated) | filters, sorting, search without a search service |
| enum | `+ price_type ('fixed','on_enquiry','rate_based','unavailable')`, `+ gender_kind ('women','men','kids','unisex')` | price transparency + audience filters |
| `enquiries` | `+ interested_in text`, `+ preferred_visit_date date`, `+ preferred_time text`, `+ source_page text`, `+ user_agent text`, `+ consent boolean not null default false` | master-spec form fields, spam forensics |
| `admin_users` | unchanged (owner/staff) | role separation stays in the DB |
| `rate_provider_status` | new singleton-ish table: `provider, status, last_success_at, last_error_at, last_error, consecutive_failures` | admin dashboard API-health monitor |
| `wishlists` | new: `anon_id text, product_id uuid, created_at` (unique pair) | local-first wishlist, DB-ready for accounts later |
| `rate_alerts` | new, **inactive by default**: `contact_type ('email'|'whatsapp'), contact_value, metal, purity, target_rate, is_active=false` | schema for the future alert feature; no delivery backend claimed |
| `appointments` | new: reuse `enquiries` with `kind='appointment'` instead — **no extra table** | avoids two sources of truth |

### H2. RLS in one paragraph

Public read: `categories` (active), `products` (active only), `product_images`
of active products, `metal_rates` (verified), `faqs` (active), `announcements`
(live window), `pricing_rules` (`is_public`), `reviews` (**approved only**),
`site_settings` (`is_public`). Public insert: `enquiries`, `scheme_enquiries`,
`wishlists` (insert/delete by `anon_id`) — insert-only, `WITH CHECK status='new'`.
Everything else is admin-only via `is_admin()`. `rate_job_logs`,
`admin_users`, `rate_alerts`, `rate_provider_status` are admin/service-role only.

### H3. Data access patterns

- Read paths use server-side Supabase clients with cache tags
  (`rates`, `products`, `content`) and explicit `revalidate` windows —
  no per-request DB hammering, no service-role key near the client.
- Writes from forms go through **Route Handlers** (Zod → DB) so validation,
  rate limiting and honeypot checks all live server-side.
- Admin CRUD goes through Route Handlers too (never direct table writes from
  the browser), each re-checking `is_admin()` server-side.

---

## I. SECURITY PLAN

| Risk | Control |
|---|---|
| Service-role key leak | Key read only in `src/lib/supabase/admin.ts` (server-only import guard); never `NEXT_PUBLIC_`; `.env.example` documents names without values; `.env*` git-ignored except the example |
| Admin exposure | `/admin` behind Supabase Auth + `admin_users` allowlist + `middleware.ts`; every admin API re-verifies `is_admin()`; roles owner/staff limit destructive actions |
| Cron abuse | `/api/cron/*` requires `Authorization: Bearer ${CRON_SECRET}`; 404 when unset; idempotent naturally-keyed upserts |
| Form spam | Zod schema, honeypot field, min-time-to-submit check, per-IP rate limit (DB counter table, 5/10 min), message length caps, no HTML rendering of user text |
| XSS | React escaping only; no `dangerouslySetInnerHTML` for DB content; strict CSP via `next.config.ts` headers |
| SQL injection | Supabase client parameterization only; no string-built SQL; views are read-only |
| Clickjacking / sniffing | `X-Frame-Options: SAMEORIGIN` (map iframe is outbound), `X-Content-Type-Options`, `Referrer-Policy: strict-origin-when-cross-origin`, HSTS, `Permissions-Policy: geolocation=(self), camera=(), microphone=()` |
| Location privacy | Geolocation used in-page only; never sent to our server; disclosed in the privacy policy |
| Image uploads | Admin-only, MIME + size validated, served from Supabase Storage public bucket; no execution paths |
| Secrets in client | `NEXT_PUBLIC_*` limited to Supabase URL/anon key, site URL, GA ID. Rate API key is server-only (`RATE_API_KEY`) |

---

## J. SEO / LOCAL SEO / ANALYTICS

- Per-route `generateMetadata` with unique title (≤60) + description (≤155),
  canonical, OG (1200×630) and Twitter card. Titles localise the phrase set:
  `Tulsi Jewellers Nagpur`, `jewellery shop in Nagpur`, `gold jewellery Nagpur`,
  `diamond jewellery Nagpur`, `silver jewellery Nagpur`, `bridal jewellery Nagpur`,
  `gold rate Nagpur`. No keyword stuffing, no doorway pages.
- Structured data: `JewelryStore`/`LocalBusiness` (name, address, geo, phones,
  hours **only when real** — fields omitted while they are placeholders, never
  invented), `BreadcrumbList` on every deep page, `FAQPage` on `/faq` where
  eligible, `Product` **only** for active DB products with genuine data, and
  `ItemList` for category pages.
- `sitemap.ts` (dynamic, DB-aware, excludes drafts) + `robots.ts` + clean
  slugs (`/collections/gold-jewellery`, not `?cat=3`).
- Local discovery prep: consistent NAP across site/footer/schema; `Google
  Business Profile` + `Search Console` + `Analytics` placeholders documented in
  `docs/OWNER_CHECKLIST.md`; no fake GBP reviews.
- Analytics (Phase 29): GA4 via `next/script` with `NEXT_PUBLIC_GA_ID`
  (no-op when unset), events: `product_view`, `whatsapp_click`,
  `phone_click`, `directions_click`, `rate_view`, `calculator_use`,
  `enquiry_submit`, `search`, `wishlist_add`. Meta Pixel optional, placeholder ID.

---

## K. REQUIREMENTS THE OWNER MUST SUPPLY (summary — full list in OWNER_CHECKLIST)

**Blocking for "no placeholders left"**: full address, primary phone, WhatsApp
number, email, opening hours + weekly off, Google Maps link, logo, shop photos,
real product photos + specs, business story, services, delivery/return/exchange
terms, GST display preference, genuine reviews.

**Blocking for automated live rates**: either (a) accept manual IBJA entry
(free, works today), or (b) buy a provider plan and supply `RATE_API_KEY`.

**Not blocking** (site is fully functional without them): Google Maps JS key,
GA4 ID, Search Console token, Meta Pixel, WhatsApp Business API.

---

## L. ACCEPTANCE CRITERIA FOR "FULLY FUNCTIONAL"

1. Every P0 feature works end-to-end with **no credentials at all** (honest
   empty states; manual rate entry path live).
2. With Supabase creds + rate key + cron secret configured, rates publish
   themselves twice per business day and history charts fill with real rows.
3. `tsc --noEmit`, `eslint src`, `next build` clean; no console errors on any
   route; Lighthouse mobile ≥ 90 performance / ≥ 95 accessibility on Home,
   catalogue and rates.
4. No `[INSERT …]` string is rendered as if it were a fact — placeholders are
   visible as placeholders (or hidden with an honest alternative).
5. The outside-Nagpur delivery statement appears on Home, Visit, FAQ, Delivery
   policy, product pages and footer.
6. No fake rate, review, price, certification or stock claim exists anywhere in
   code, seed data or UI copy.
