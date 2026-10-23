# TULSI JEWELLERS — SEQUENTIAL VIBE-CODING PROMPT CHAIN (Part 2: Phases 19–36)

Continues [PROMPT_CHAIN_1_18.md](./PROMPT_CHAIN_1_18.md). Same per-phase format:
**Objective → Prompt (copy-paste) → Expected output → Files → Testing → Acceptance →
Likely errors → Verify → Next-phase needs.** Paste one phase at a time.

---

## PHASE 19 — Visitor Geolocation & Distance ⬜ TODO

**Objective:** opt-in distance only. No tracking, no auto-prompt.

**Prompt:**
> Inspect `src/components/location/*` and `src/lib/config.ts` (`hasMapCoordinates`). Add
> `src/lib/geo.ts` with a pure `haversineKm(a, b)` (returns km, 3dp) and re-export city-pair
> test vectors in a comment. Build `UseMyLocationButton` (client): permission is requested
> **only** on click, never on load; states idle → asking → granted → denied → timeout →
> unsupported, each with honest copy ("Location permission was not granted. You can still
> use Google Maps to get directions."). On success show "You are approximately X km from
> Tulsi Jewellers" with a Nearby (< 5 km) / Moderate (< 25 km) / Far label, plus Get
> Directions. Coordinates stay in component state and are **never sent to the server,
> never logged, never stored**. Update the privacy policy section accordingly (truthfully).

**Expected output:** distance feature + documented privacy behaviour.
**Files:** `src/lib/geo.ts`, `src/components/location/UseMyLocationButton.tsx`,
`src/app/policies/privacy/page.tsx` (later phase may own the file — coordinate).
**Testing:** deny permission; simulate timeout; distance for two known coordinates;
verify no network request carries coordinates (DevTools); keyboard-only activation.
**Acceptance:** no geolocation call on page load; every failure path has user-facing copy;
Haversine within 1% of a reference value.
**Likely errors:** `navigator.geolocation` accessed during SSR → guard with a mounted check;
`Permissions-Policy` header missing → add `geolocation=(self)`.
**Verify:** with coordinates unset, the button still works but shows only distance/directions.
**Next-phase needs:** confirmed coordinates.

---

## PHASE 20 — Directions & Share ⬜ TODO

**Objective:** one-tap navigation to the showroom.

**Prompt:**
> Inspect the location components. Add `directionsHref(origin?)` in config producing keyless
> `https://www.google.com/maps/dir/?api=1&destination=<lat>,<lng>` (+ `&origin=<lat>,<lng>`
> when the visitor shared a location, + `&travelmode=driving`), and a Share action using
> `navigator.share` with a copy-link fallback and toast confirmation. Place Get Directions
> and Call buttons in the Visit page hero, the map section, the mobile action bar and the
> footer. When coordinates are placeholders, fall back to the owner-supplied Google Maps
> link, or show the honest "location not yet confirmed" state — never a fabricated route.

**Expected output:** directions across all surfaces.
**Files:** `src/components/location/*`, `src/components/MobileActionBar.tsx`,
`src/components/Footer.tsx`, `src/lib/config.ts`.
**Testing:** directions from the Visit page, mobile bar and footer; share sheet on mobile
Chrome/Safari; copy-link fallback on desktop; placeholder-coordinate behaviour.
**Acceptance:** route opens the exact showroom in Google Maps; no key used; no dead link.
**Likely errors:** `navigator.share` throwing on desktop → try/catch with fallback.
**Verify:** open a generated URL and confirm the correct destination pin.
**Next-phase needs:** WhatsApp number confirmed by the owner.

---

## PHASE 21 — WhatsApp Integration ⬜ TODO

**Objective:** the highest-converting action on the site, everywhere.

**Prompt:**
> Inspect `whatsappHref()` in `src/lib/config.ts` and every CTA. Build a single
> `src/lib/whatsapp.ts` with message templates: `productEnquiry(product)` →
> "Hello Tulsi Jewellers, I am interested in {name} ({code}). Please share more details.",
> `rateEnquiry()` → "Hello Tulsi Jewellers, I would like to know today's gold/silver rate.",
> `appointmentRequest()` → "...I would like to schedule a showroom visit.",
> `schemeEnquiry()`, `customJewellery()`, `calculatorEstimate(breakdown)` — each in EN and
> हिं, always URL-encoded. Build `WhatsAppButton` (variants: inline, floating, icon,
> sticky mobile) used in: navbar, hero, product cards, PDP, rate cards, calculator,
> scheme, custom, contact, visit, FAQ and the mobile action bar. It must degrade
> gracefully while `CONTACT.whatsappPhone` is a placeholder (show a call-first fallback
> instead of a broken wa.me link) and render a visible `aria-label`. Floating button must
> not cover the mobile bottom bar or the cookie/consent area.

**Expected output:** one WhatsApp module + consistent CTAs.
**Files:** `src/lib/whatsapp.ts`, `src/components/WhatsAppButton.tsx`, all CTA call sites.
**Testing:** every button opens WhatsApp with the correct pre-filled text; product messages
include the code; Hindi template renders correctly on a phone; placeholder state falls back
to call; floating button doesn't overlap at 320px.
**Acceptance:** zero hardcoded wa.me strings outside `whatsapp.ts`/config; no broken links
while the number is unconfirmed.
**Likely errors:** double-encoding the message → encode once; emoji/Devanagari in the query →
rely on `encodeURIComponent`.
**Verify:** paste a generated link on desktop web WhatsApp and check the exact text.
**Next-phase needs:** form fields + enquiry table.

---

## PHASE 22 — Contact Forms & Enquiry Pipeline ⬜ TODO

**Objective:** validated, spam-resistant forms that never lose an enquiry.

**Prompt:**
> Inspect `enquiries`/`scheme_enquiries` in `supabase/migrations` and
> `src/lib/supabase/*`. Build `src/lib/validation/enquiry.ts` (Zod: name 2–120, Indian phone
> 10 digits with optional +91, optional email, interest enum, message 1–4000, preferred
> visit date/time optional, consent boolean) and `POST /api/enquiries` (+ `/api/scheme-enquiries`,
> `/api/callback-requests`): honeypot field must be empty, minimum 3-second fill time,
> per-IP rate limit (5 per 10 minutes) with a DB-backed counter, then insert via the
> **server** client so `status` is forced to `new`. Return field-level errors (400) and a
> friendly success message; never echo user HTML back. Build `ContactForm`, `SchemeForm`,
> `CustomJewelleryForm`, `CallbackRequestForm` with inline validation, disabled-while-
> submitting state, success panel with a WhatsApp follow-up link, and accessible error
> summaries (`aria-describedby`, focus moves to the first error). Store `source_page`.
> Also render an admin-visible "no enquiries yet" empty state.

**Expected output:** working forms → DB rows, with spam controls.
**Files:** `src/app/api/enquiries/**`, `src/lib/validation/*`,
`src/components/forms/*`, `src/app/contact/page.tsx`.
**Testing:** happy path (row appears in the DB with `status='new'`); each validation failure;
honeypot triggered; 6th submission in 10 minutes blocked; direct POST bypassing the UI is
rate-limited; keyboard + screen-reader flow.
**Acceptance:** no enquiry silently fails; a duplicate submission is prevented; PII is not
logged to the console.
**Likely errors:** RLS insert policy rejecting the server client → use the anon-key server
client (public insert policy) or the service role for the API route only; missing
`preferred_visit_date` column → Phase 4 migration must have run.
**Verify:** submit in हिं and confirm the stored message keeps Devanagari intact.
**Next-phase needs:** content pages.

---

## PHASE 23 — About Us ⬜ TODO

**Objective:** storytelling with zero invented history.

**Prompt:**
> Build `/about` as a premium editorial page: hero, `Our Story` (renders the owner's story
> placeholder as a clearly marked placeholder block), `Our Philosophy`, `Our Craftsmanship`,
> `Our Collections`, `Our Customer Experience`, `Our Showroom` — each only with verifiable
> or placeholder content. Include a `Timeline` component **only if** at least two real
> dated milestones exist (≥2 items, otherwise omit the component entirely and say so in a
> comment). Add the trust & transparency block (gold purity, hallmark info, billing,
> exchange, repair, custom, after-sales) where each row renders "Details to be confirmed by
> the showroom" until the owner supplies it — never a BIS/HUID/certification claim we
> cannot verify. Show the shop-photo placeholder frames with descriptive alt text and
> instructions for replacement. End with a visit/contact CTA.

**Expected output:** about page + optional timeline + trust block.
**Files:** `src/app/about/page.tsx`, `src/components/about/*`,
`src/lib/i18n/{en,hi}.ts`.
**Testing:** with no milestones → no timeline; with placeholder story → visible placeholder
styling; EN/हिं both render; no factual claim appears that the owner did not supply.
**Acceptance:** grep for "since 19", "ISO", "BIS", "IGI", "GIA", "certified" returns only
placeholder-marked or owner-supplied strings.
**Likely errors:** placeholder text styled like real copy → give placeholders a distinct
visual treatment (`[ ... ]` + muted colour + tooltip).
**Verify:** the page reads as premium even with placeholders present.
**Next-phase needs:** guide topics.

---

## PHASE 24 — Jewellery Guides (Education) ⬜ TODO

**Objective:** genuinely useful, factual content that also earns search traffic.

**Prompt:**
> Build `/guides` + four articles in `src/content/guides/*.md` (or TSX data objects) with
> consistent `ArticleLayout` (breadcrumbs, reading time, related links, table of contents):
> 1) Gold purity & 22K vs 18K vs 14K, plus what hallmarking is (state the BIS framework
> factually, no claim that Tulsi Jewellers holds a specific certification),
> 2) Diamond 4Cs (cut/colour/clarity/carat) with no certainty claims and no "conflict-free"
> claims, 3) Jewellery care for gold/silver/diamond with practical do/don't,
> 4) Buying checklist + bridal jewellery guide. Charts/tables where they help. Cross-link
> guides from the footer, PDP and rate pages. Add `Article` JSON-LD with author as the
> business (no fake person names). Keep every claim checkable; if unsure, omit rather than
> guess.

**Expected output:** 4 factual guides + hub.
**Files:** `src/app/guides/**`, `src/components/content/*`, `src/content/guides/*`.
**Testing:** typography on long text; TOC links; mobile reading; JSON-LD validity;
spellcheck; no unsupported claim.
**Acceptance:** content passes a "is this true and verifiable?" review; no keyword stuffing.
**Likely errors:** `/guides/[slug]` catching `/guides` → keep the hub as an explicit route.
**Verify:** each guide renders in both languages (translate or mark EN-only with a note).
**Next-phase needs:** genuine reviews (or an honest absence).

---

## PHASE 25 — Reviews & Trust Signals ⬜ TODO

**Objective:** show reviews only when they are real.

**Prompt:**
> Inspect the `reviews` table (empty by design, `status='pending'` default, no public insert
> policy). Build `ReviewCarousel` (keyboard-accessible, autoplay off, pause on hover/focus)
> and a reviews section that renders `reviews` where `status='approved'` only. If zero
> approved rows exist, render an honest state: "Customer reviews will appear here once
> Tulsi Jewellers publishes verified feedback." Do **not** invent names, ratings or
> "verified purchase" badges. On the PDP show a review count only when > 0. Include
> `AggregateRating` JSON-LD **only** when ≥1 genuine approved review exists, otherwise omit
> it entirely (fake ratings violate Google's policies and are a legal risk).

**Expected output:** review components with an honest empty state.
**Files:** `src/components/reviews/*`, `src/app/api/admin/reviews/**` (approve/reject).
**Testing:** 0 reviews → empty state, no JSON-LD; 1 approved → renders, JSON-LD appears with
the true count; pending rows stay invisible to the public; publish a review from admin and
see it appear after revalidation.
**Acceptance:** no fabricated review content anywhere in the repository.
**Likely errors:** hardcoded sample reviews left in the code → delete them, use the empty
state; carousel stealing focus → manage focus explicitly.
**Verify:** `select status, count(*) from reviews` and match exactly what the site shows.
**Next-phase needs:** legal page intros.

---

## PHASE 26 — Policies (Delivery, Returns, Privacy, Terms) ⬜ TODO

**Objective:** honest, editable legal pages with the delivery restriction front and centre.

**Prompt:**
> Build `/policies/{delivery,returns,privacy,terms}` with a shared policy layout (last
> updated date, section nav, print-friendly). Delivery page: state verbatim
> `DELIVERY.outsideNagpurNote` as the headline message, add the within-Nagpur line
> "Please contact Tulsi Jewellers for current service and delivery availability within
> Nagpur." (never a promise), and explicitly list what is **not** offered (pan-India,
> nationwide, international shipping) as ruled-out items. Returns/Exchange/Warranty: use
> bracketed placeholders for every business-specific term and mark each as awaiting owner
> confirmation, plus a neutral note that the shop's applicable policy governs. Privacy:
> describe exactly what the site collects (enquiry form fields, wishlist in localStorage,
> optional analytics) and state truthfully that geolocation never leaves the browser.
> Terms: standard structure with placeholders. Add a `PolicyPage` data file so the owner can
> edit copy without touching layout, and a visible "pending owner confirmation" banner.

**Expected output:** four policy pages + editable content model.
**Files:** `src/app/policies/**`, `src/content/policies/*`, `src/components/content/PolicyPage.tsx`.
**Testing:** the outside-Nagpur sentence appears word-for-word; no policy claims a service
the owner hasn't confirmed; print layout; footer links resolve (no 404).
**Acceptance:** zero accidental delivery promises; every unconfirmed term is visibly marked.
**Likely errors:** the phrase drifting during localisation → import it from config, never
retype it; dead footer links → add every policy route to the footer test.
**Verify:** read all four pages aloud as the owner and confirm nothing is a false promise.
**Next-phase needs:** route metadata plan.

---

## PHASE 27 — SEO & Structured Data ⬜ TODO

**Objective:** complete, non-spammy technical SEO.

**Prompt:**
> Audit every route's metadata. Implement `generateMetadata` (unique title ≤ 60 chars,
> description ≤ 155, canonical from `SITE.baseUrl`, OG 1200×630 + Twitter summary_large_image
> using a branded fallback image), `sitemap.ts` (static routes + active categories + active
> products, drafts excluded, `lastModified` from `updated_at`), `robots.ts` (allow all,
> disallow `/admin`, `/api`, sitemap reference), semantic HTML landmarks, heading order
> checks, `alt` text on 100% of images, breadcrumbs everywhere, and JSON-LD:
> `JewelryStore` (omit address/geo/telephone/openingHours while unverified), `BreadcrumbList`,
> `ItemList` on category pages, `Product` only with genuine price+availability, `FAQPage` on
> `/faq` only for questions actually visible on the page. Add a metadata test script that
> fails when any route lacks a title, description or canonical, or when a placeholder string
> leaks into metadata.

**Expected output:** full metadata layer + sitemap/robots + schema.
**Files:** `src/app/**/page.tsx` metadata, `src/app/sitemap.ts`, `src/app/robots.ts`,
`src/lib/seo/*`.
**Testing:** Rich Results test on Home/Product/Rates/FAQ/Breadcrumbs; `curl` each route and
inspect the head; sitemap contains no drafts; robots blocks `/admin`; no duplicate titles.
**Acceptance:** zero invented values in schema; every route canonical; no placeholder text in
titles/descriptions.
**Likely errors:** `[INSERT` appearing in OG titles → sanitise metadata through a
`cleanMeta()` helper that strips placeholder brackets; product OG image missing → branded
fallback.
**Verify:** search-site query `site:` style self-check conceptually via sitemap coverage.
**Next-phase needs:** verified NAP for local schema.

---

## PHASE 28 — Local Nagpur SEO & Discovery ⬜ TODO

**Objective:** win local search without lying to Google.

**Prompt:**
> Build the local SEO layer: consistent NAP across footer/schema/contact/visit (all sourced
> from `config.ts`), a Nagpur-focused but honest copy pass on Home/About/Visit/Contact/Rates
> (natural mentions of Kalyan/… only if the owner supplies landmarks — otherwise omit),
> "Visit us in Nagpur" section with the showroom context, `LocalBusiness`/`JewelryStore`
> schema using **only** verified fields, and a documented `docs/GBP_SETUP.md` covering
> Google Business Profile creation/verification, category selection, NAP consistency rules,
> photo guidance, hours entry, review-request etiquette (ask real customers, never invent),
> Search Console verification (DNS or meta placeholder `NEXT_PUBLIC_GSC_VERIFICATION`), and a
> post-launch citation checklist. Also add an internal-linking pass between
> collections ↔ rates ↔ guides ↔ visit.

**Expected output:** local SEO implementation + GBP runbook.
**Files:** `docs/GBP_SETUP.md`, `src/app/visit/page.tsx`, footer/contact copy,
schema in `src/lib/seo/*`.
**Testing:** schema validator; NAP string equality across pages (grep); no invented landmark
or address in copy; internal link graph has no orphans.
**Acceptance:** the site is ready to be verified in GBP with zero conflicting addresses.
**Likely errors:** stale address in a hardcoded string somewhere → grep the whole `src` for
the address text and confirm a single source.
**Verify:** every page that shows an address shows the identical string.
**Next-phase needs:** GA property (optional).

---

## PHASE 29 — Analytics ⬜ TODO

**Objective:** measurable funnel, no PII, fully optional.

**Prompt:**
> Inspect `src/lib/config.ts` ANALYTICS placeholders. Add GA4 via `next/script`
> (`NEXT_PUBLIC_GA_ID`, no-op when unset, `afterInteractive`, no double-loading on route
> change) and a typed `src/lib/analytics.ts` `track(event, params)` that swallows errors when
> GA is absent. Instrument: `product_view`, `whatsapp_click` (with location: navbar/card/pdp/
> rate/fab), `phone_click`, `directions_click`, `rate_view`, `calculator_use`,
> `enquiry_submit`, `search` (query length only — never the raw query text if it could carry
> personal data; prefer the term since it is not personal), `wishlist_add`,
> `wishlist_remove`, `share_click`. Add Meta Pixel placeholder (`NEXT_PUBLIC_META_PIXEL_ID`)
> behind a flag, and a Search Console verification meta placeholder. Respect
> `FEATURE_FLAGS.analytics` so the site ships with analytics off until an ID exists. Do not
> insert fake tracking IDs; do not collect names, phones or emails in event params.

**Expected output:** optional analytics with a typed event layer.
**Files:** `src/lib/analytics.ts`, `src/app/layout.tsx`, `.env.example`, call sites.
**Testing:** with no ID → zero network calls to Google; with a test ID → events fire once per
action, including after client-side navigation; no PII in payloads.
**Acceptance:** analytics can be enabled by adding one env var; nothing breaks when absent.
**Likely errors:** duplicate page_view on App Router navigation → send page_view manually and
disable the automatic one; script loading before consent → gate behind the flag.
**Verify:** event names match the documented list exactly.
**Next-phase needs:** a11y audit baseline.

---

## PHASE 30 — Accessibility ⬜ TODO

**Objective:** WCAG 2.1 AA-conscious implementation on every route.

**Prompt:**
> Audit the whole app for a11y: landmarks and heading order, one `<h1>` per page, focus
> visible on every interactive element, `:focus-visible` rings in gold with sufficient
> contrast, skip link working, all images with meaningful alt (decorative → `alt=""`),
> form labels + `aria-describedby` error text + fieldset/legend for radio groups, modal and
> drawer focus traps with Escape + focus restore, `aria-live="polite"` for rate updates and
> toast messages, `aria-current` on nav, colour contrast ≥ 4.5:1 for body text (verify gold
> is never used for text), `prefers-reduced-motion` honoured by every animation, keyboard-only
> completion of: search, filters, gallery zoom, calculator, forms, and directions with
> geolocation. Add an `axe-core`/Lighthouse audit note to CONTEXT.md with found issues fixed.

**Expected output:** a11y fixes + audit record.
**Files:** `src/components/**`, `src/app/globals.css`, `CONTEXT.md`.
**Testing:** axe DevTools on Home/catalogue/PDP/rates/calculator/contact (0 critical);
keyboard-only run-through of each flow; screen-reader smoke test on the rate ticker and
forms; zoom to 200% with no content loss; reduced-motion simulation.
**Acceptance:** no critical/serious axe violations; 100% keyboard reachable; visible focus
everywhere; Lighthouse accessibility ≥ 95.
**Likely errors:** icon-only buttons without labels; colour-only status (rate up/down) →
add text/arrow + label; carousel not pausing on focus.
**Verify:** tab from the top of the page to the footer without a mouse, hitting every control.
**Next-phase needs:** performance budget.

---

## PHASE 31 — Performance ⬜ TODO

**Objective:** fast on a mid-range Android over 4G.

**Prompt:**
> Optimise: `next/image` everywhere with correct `sizes`, `priority` only for the hero LCP
> image, AVIF/WebP formats, blurred placeholders for large editorial images, lazy mounting
> of below-fold client sections, dynamic import for heavy/interactive components
> (search dialog, calculator, charts) so first-load JS shrinks, font subsetting via
> `next/font` with `display: swap` (already in place — verify), DB query review for N+1 and
> missing indexes (`explain analyze` the catalogue and history queries), cache tags +
> `revalidate` windows so pages are static wherever possible, `stale-while-revalidate` for
> the rates endpoint, and image `remotePatterns` only for allowed hosts. Record before/after
> numbers (bundle size, LCP, TBT, route payload) in CONTEXT.md. No new dependency without
> measuring first.

**Expected output:** measured performance improvements + recorded numbers.
**Files:** `next.config.ts`, components (imports/images), `src/lib/*` queries, `CONTEXT.md`.
**Testing:** `next build` output (First Load JS per route), Lighthouse mobile on Home /
category / PDP / rates, offline-ish slow 4G throttling, repeat the rate-poll scenario to
confirm it doesn't hurt INP.
**Acceptance:** Home First Load JS ≤ ~150 kB gzip, Lighthouse mobile performance ≥ 90,
LCP < 2.5s on throttled 4G, CLS < 0.1.
**Likely errors:** dynamic-importing something that is above the fold (worse LCP);
`priority` on multiple images; chart SVG bloating the bundle when it should be client-only.
**Verify:** re-run Lighthouse after each change; report the real numbers, not estimates.
**Next-phase needs:** a security review pass.

---

## PHASE 32 — Security Hardening ⬜ TODO

**Objective:** no leaked secrets, no open admin, no spam flood.

**Prompt:**
> Implement the §I checklist: `next.config.ts` headers (HSTS, X-Content-Type-Options,
> Referrer-Policy, X-Frame-Options SAMEORIGIN, Permissions-Policy including
> `geolocation=(self)`, CSP allowing self + Supabase + Google Maps frame + GA when enabled),
> verify no `NEXT_PUBLIC_` variable holds a privileged value, confirm the service-role key
> is only read inside server files, add Zod validation to every route handler, DB-backed rate
> limiting on all public POST routes, honeypot + timing checks, admin route guards with
> server-side `is_admin()` re-checks, cron secret verification, storage upload validation
> (MIME + size + admin-only), and `npm audit` review with a note on any accepted advisory.
> Add `docs/SECURITY.md` documenting the threat model and rotation procedure for
> `SUPABASE_SERVICE_ROLE_KEY`, `RATE_API_KEY` and `CRON_SECRET` (rotate via Vercel env +
> Supabase dashboard; never commit).

**Expected output:** hardened configuration + security doc.
**Files:** `next.config.ts`, `src/app/api/**`, `src/middleware.ts`, `docs/SECURITY.md`,
`.env.example`.
**Testing:** unauthenticated POST to each admin/public route; oversized upload; missing/extra
fields; XSS payload in an enquiry (must be stored inert and never rendered as HTML);
CSP violations in the console (must be none); headers verified with `curl -I`;
`grep -rn NEXT_PUBLIC_ src` review.
**Acceptance:** no privileged value is client-reachable; every mutation is validated and
rate-limited; security headers present on all routes.
**Likely errors:** CSP breaking `next/font` or inline styles → use nonces or allow the
specific sources (document the choice); rate limiting keyed on a spoofable header.
**Verify:** repeat the admin auth test after clearing cookies.
**Next-phase needs:** mobile QA.

---

## PHASE 33 — Mobile Optimisation ⬜ TODO

**Objective:** the mobile site is the primary product, not a shrinking desktop.

**Prompt:**
> Audit at 320, 360, 375, 390, 430, 768 px: no horizontal scroll anywhere; tap targets ≥ 44px
> with ≥ 8px spacing; thumb-zone placement for the bottom action bar (Home, Collections,
> Rates, WhatsApp, Visit); safe-area insets on iOS (`env(safe-area-inset-bottom)`); sticky
> "View Rates" affordance on the rates pages; drawers that scroll internally with the body
> locked; single-column card layouts with readable type (≥16px body, no tiny caps); forms
> with `inputmode`/`autocomplete` hints (`tel`, `email`, `name`, `postal-code`);
> text selection and long Hindi words not overflowing; the map iframe usable without
> trapping scroll; skeletons that do not cause reflow; and slow-network behaviour
> (throttled 3G) with honest loading states. No hover-only information on touch (product
> card actions must be tappable, not hover-revealed).

**Expected output:** a mobile-first pass across all routes.
**Files:** all layout/feature components, `globals.css`.
**Testing:** device emulation for each width + one real phone; landscape orientation;
iOS Safari (100vh pitfall); Android Chrome; keyboard open/close behaviour on forms; the
bottom bar not covering the WhatsApp FAB or the last section.
**Acceptance:** zero horizontal overflow; every action reachable with one thumb; no
touch-hostile hover reveals.
**Likely errors:** `100vh` → use `100dvh`; fixed bottom bar covering content → add bottom
padding equal to the bar height.
**Verify:** scroll each page to the bottom and confirm the last CTA is clickable.
**Next-phase needs:** motion tokens finalised.

---

## PHASE 34 — Advanced Animations & Interactions ⬜ TODO

**Objective:** memorable micro-interactions that stay fast and never annoy.

**Prompt:**
> Implement tasteful motion per §D5: scroll reveals via a single reusable `Reveal`
> component (IntersectionObserver, animate once, no layout thrash), hero parallax limited to
> `transform` with rAF throttling, editorial image reveals, a subtle one-pass gold sweep on
> the rate card when a value changes, `numberRoll` on rate deltas, product card
> hover-lift + image zoom on pointer devices only, smooth page transitions inside the route
> group (no full-screen wipe on every navigation), optional extremely subtle desktop
> sparkle cursor **behind a flag and disabled by default**, a premium loading screen using
> the logo (max ~600ms, never blocking, skipped on repeat visits via sessionStorage),
> back-to-top button, and toast notifications. Every animation must degrade to an instant
> state under `prefers-reduced-motion`. Measure the INP impact and remove anything that
> costs more than it delights.

**Expected output:** motion system + measured impact.
**Files:** `src/components/motion/*`, feature components.
**Testing:** reduced-motion on/off; low-end CPU throttling (4×); scroll performance on
mobile; no animation replay on scroll-back; no motion blocking content on slow networks.
**Acceptance:** INP < 200ms on throttled mobile; no animation hides content permanently; the
sparkle cursor is off by default.
**Likely errors:** animating `height`/`top` (layout thrash); scroll listeners without
cleanup; loading screen never dismissing when JS fails → CSS-only fallback + timeout.
**Verify:** disable JS and confirm content is still visible (no animation-gated content).
**Next-phase needs:** all features on staging preview.

---

## PHASE 35 — Complete QA ⬜ TODO

**Objective:** prove the whole thing works before launch.

**Prompt:**
> Run the full QA checklist below as a written test report in `docs/QA_REPORT.md`. For each
> item: status (pass / fail / blocked), what was tested, evidence (command output, URL,
> screenshot path), and the fix applied. Re-run `tsc --noEmit`, `eslint src`, `next build`
> and record the exact output. Test with **no credentials** (honest empty states) and again
> with credentials configured. Do not mark anything pass without evidence; list blocked
> items explicitly rather than guessing.

**Expected output:** `docs/QA_REPORT.md` with evidence per item.
**Files:** `docs/QA_REPORT.md`, plus fixes wherever failures are found.
**Acceptance:** no unexplained failure; every blocked item names the missing input.

**FINAL QA CHECKLIST (test each and mark pass/fail/blocked)**

- Visual quality: palette restraint, no gold text, spacing rhythm, alternating compositions, 200% zoom.
- Mobile: 320/360/375/390/430/768 px, landscape, no horizontal scroll, thumb reach, safe areas.
- Desktop: 1024/1280/1440/1920, generous whitespace, sane max-width, no stretched line lengths.
- Navigation: all links resolve, active states, mega menu, drawer, back/forward, breadcrumbs.
- Search: EN + हिं terms, product codes, suggestions, empty state, recent searches, keyboard.
- Filters & sorting: each facet, combinations, URL shareability, clear-all, zero-result state.
- Product pages: every price type, availability states, missing fields omitted, gallery + zoom,
  share/copy link, related products, draft slug → 404.
- WhatsApp: every CTA opens wa.me with correct text in both languages; placeholder fallback works.
- Phone links: `tel:` works on mobile for all configured numbers; no invented number.
- Contact form: happy path, validation, honeypot, rate limit, success + error states, DB row created.
- Google Maps: embed loads (or honest panel), correct pin, directions link, geolocation opt-in,
  denial path, no key exposed.
- Rates: daily cards per purity, source/date/time/session/GST/making-charge flags, delta vs
  previous, market status, staleness banner, weekend wording, empty state, disclaimer verbatim.
- Rate pipeline: cron auth, validation rejects bad payloads, no overwrite on failure, idempotency,
  `rate_job_logs`, provider health panel, `revalidateTag` effect.
- History: ranges, series, AM/PM toggle, no interpolation over gaps, stats correct, CSV matches table.
- Calculator: purities, weights, unit switch, rules present/absent, estimate labelling, WhatsApp breakdown.
- Reviews: approved-only, honest empty state, JSON-LD only when real.
- SEO: unique title/description/canonical per route, OG/Twitter previews, sitemap without drafts,
  robots blocks admin, schema valid, no placeholder leaks into metadata.
- Local SEO: identical NAP everywhere, GBP runbook followed, no invented landmark.
- Schema: Rich Results test on Home/JewelryStore/Breadcrumb/FAQ/Product.
- Accessibility: axe 0 critical/serious, keyboard-only flows, focus visible, labels, reduced motion, contrast.
- Performance: Lighthouse mobile ≥ 90 Home/category/PDP/rates, LCP < 2.5s, CLS < 0.1, INP < 200ms.
- Images: alt text 100%, lazy except hero, AVIF/WebP, correct `sizes`, demo images labelled replaceable.
- Broken links: crawl every internal href (script), zero 404 except an intentional test.
- Console: zero errors/warnings on every route; no hydration mismatch; no failed requests.
- 404 & error pages: styled, honest, with navigation back.
- Loading & empty states: skeletons on every async surface; empty states with a next action.
- Privacy: geolocation never sent to server; localStorage keys documented; privacy policy matches reality.
- Delivery: outside-Nagpur statement on Home/Visit/FAQ/Delivery/PDP/Footer, verbatim.
- Placeholder discipline: "Pending owner confirmation" list generated from `PENDING_CONFIRMATIONS`.
- Security: headers, secret scan, admin guards, upload validation, rate limits, `npm audit`.
- Deployment readiness: env var list complete, migrations applied, cron configured, rollback plan written.

**Likely errors:** reporting pass based on a build rather than a browser test → every UI item
needs a browser step; forgetting to re-run checks after the QA fixes.

**Next-phase needs:** owner sign-off on the placeholder list.

---

## PHASE 36 — Production Deployment ⬜ TODO

**Objective:** launch safely and reversibly.

**Prompt:**
> Prepare the production rollout: finalise `.env.example` (every variable with a comment:
> Supabase URL/anon/service, `NEXT_PUBLIC_SITE_URL`, `RATE_PROVIDER`, `RATE_API_KEY`,
> `RATE_API_BASE_URL`, `CRON_SECRET`, `NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_GSC_VERIFICATION`,
> `NEXT_PUBLIC_META_PIXEL_ID`), write `docs/DEPLOYMENT.md` (Supabase project creation, running
> `schema.sql` + `migrations/0002_*.sql` + `seed.sql`, creating the admin user and promoting
> it, storage bucket check, Vercel project import, env var entry, cron verification, custom
> domain + DNS, Search Console and GBP verification, post-deploy smoke test list, and the
> rollback procedure), and produce the pre-launch sign-off checklist. Verify the production
> build locally (`next build` + `next start`) before deploying. Do not deploy, do not push,
> and do not purchase anything without the owner's explicit instruction.

**Expected output:** deployment runbook + sign-off checklist.
**Files:** `docs/DEPLOYMENT.md`, `.env.example`, `CONTEXT.md`.
**Testing:** local production build served and smoke-tested (Home, category, PDP, rates,
contact, admin login); cron route called manually with the secret; a real enquiry submitted
and read in the admin panel.
**Acceptance:** a fresh deploy can be reproduced from the runbook alone; rollback is a single
documented step.
**Likely errors:** forgetting `NEXT_PUBLIC_SITE_URL` in production → canonical/OG point at
localhost; running the migration after seeding (order matters); cron not firing on Hobby limits.
**Verify:** production URL returns 200 for every sitemap entry.

---

## BUSINESS OWNER HANDOFF CHECKLIST (what only you can provide)

Full detail lives in [OWNER_CHECKLIST.md](./OWNER_CHECKLIST.md). Summary:

**Brand & identity** — final logo (PNG/SVG, light + dark), brand colour confirmation,
Hindi transliteration of the shop name, final tagline.

**Contact (blocking)** — full showroom address, primary phone, WhatsApp number, email,
opening hours + weekly off, Google Maps link, Instagram, Facebook, GST number (only if it
should be displayed), establishment year, business story, the services actually offered.

**Images (blocking for visual quality)** — exterior/signboard, interior, counter/display,
staff at work, jewellery close-ups, bridal sets, one image per major category, and a
1200×630 OG image. Format: original JPEG/PNG, ≥ 2000px on the long edge where possible.

**Products** — for each item: name, category/subcategory, material, purity, weight, stone
type, diamond details, price or "on enquiry", availability, product code, photos, description.

**Policies (blocking for legal pages)** — delivery terms within Nagpur, return window and
conditions, exchange policy, warranty, hallmark/BIS information you can actually prove,
diamond certification practice (which lab, if any), repair services.

**Rates** — either accept manual IBJA AM/PM entry (free, works today) or purchase a provider
plan and supply the API key; confirm the exact source wording you want displayed.

**Trust** — genuine customer reviews with permission to publish, plus confirmation of any
claim the site presents (hallmarking, certifications, awards, years).

**Accounts (optional but recommended)** — Supabase project (free), Vercel account (free),
GA4 property ID, Search Console access, Google Business Profile access.

**Outstanding confirmations currently registered in the app:** see `PENDING_CONFIRMATIONS`
in `src/lib/config.ts` — the site renders these as visible placeholders until they are filled.
