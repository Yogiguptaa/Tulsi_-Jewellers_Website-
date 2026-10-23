# TULSI JEWELLERS — OWNER INPUT CHECKLIST

Fill this in (or paste the answers into chat) and every `[BRACKETED PLACEHOLDER]` on the
site can be replaced. Anything left blank stays a visible placeholder — the site never
invents a value to fill the gap.

Legend: **BLOCKING** = the site cannot be called "fully launched" without it ·
**HIGH** = affects conversion or trust · **OPTIONAL** = nice to have.

---

## 1. CONTACT & LOCATION

| # | Item | Priority | Example of the format needed | Your value |
|---|---|---|---|---|
| 1 | Full showroom address (as it should appear in Google) | **BLOCKING** | `Shop No. __, Bhandara Road, Hansapuri, Nagpur, Maharashtra 440018` | |
| 2 | Primary phone (the one customers should call) | **BLOCKING** | 10-digit Indian mobile or landline with STD code | |
| 3 | WhatsApp number | **BLOCKING** | same format; say if it differs from the primary phone | |
| 4 | Email address | **BLOCKING** | `shop@example.com` | |
| 5 | Opening hours + weekly off | **BLOCKING** | e.g. `Mon–Sat 10:30 am – 9:00 pm, Sunday closed` (day-by-day is best) | |
| 6 | Google Maps link | **BLOCKING** | paste the full `google.com/maps/place/...` URL | |
| 7 | Exact latitude / longitude | HIGH | e.g. `21.1535569, 79.0990804` (needed for distance + directions) | |
| 8 | Nearest landmark (only if you want it shown) | OPTIONAL | e.g. "near Radha Krishna Mandir" — only if accurate | |
| 9 | Instagram link | OPTIONAL | full URL | |
| 10 | Facebook link | OPTIONAL | full URL | |
| 11 | GST number (only if you want it displayed publicly) | OPTIONAL | 15-character GSTIN | |

---

## 2. BRAND

| # | Item | Priority | Notes |
|---|---|---|---|
| 12 | Logo file — light background | **BLOCKING** | PNG with transparency or SVG, ideally ≥ 1000px wide → `public/logo.png` |
| 13 | Logo file — dark background | HIGH | needed for the footer if the light logo disappears on dark |
| 14 | Favicon / app icon | HIGH | 512×512 PNG |
| 15 | Confirmed tagline (EN + हिं) | HIGH | the current tagline is the one you supplied; confirm or replace |
| 16 | Hindi spelling of the shop name | HIGH | e.g. तुलसी ज्वेलर्स — confirm |
| 17 | 1200×630 social share image | HIGH | used for WhatsApp/Facebook link previews |

---

## 3. BUSINESS FACTS (never guessed by the site)

| # | Item | Priority | Notes |
|---|---|---|---|
| 18 | Year the shop was established | HIGH | shown only if provided; the site does not invent "since 19xx" |
| 19 | Business history / story (2–5 paragraphs) | HIGH | family background, how the shop started, what you specialise in |
| 20 | What you actually sell (tick the real ones) | **BLOCKING** | gold / silver / diamond / fancy / gold coins & biscuits / gems (ratna) / custom & repair |
| 21 | Collections you want as separate pages | HIGH | rings, necklaces, earrings, bangles, chains, pendants, mangalsutra, bridal, men's, women's, kids' |
| 22 | Do you do custom / bespoke orders? | HIGH | if yes, what you accept (designs, remaking old gold, sizing) |
| 23 | Do you do repairs / polishing / resizing? | HIGH | if yes, which services |
| 24 | Gold saving scheme terms (₹499 enrolment) | HIGH | instalments, duration, redemption rules, what is excluded |
| 25 | Hallmark / BIS information you can prove | HIGH | only what is genuinely true — the site will not claim hallmarking otherwise |
| 26 | Diamond certification practice | HIGH | which lab (if any) and whether certificates are provided |
| 27 | Awards / recognitions | OPTIONAL | only if verifiable |

---

## 4. POLICIES (needed before the legal pages are final)

| # | Item | Priority | Notes |
|---|---|---|---|
| 28 | Delivery policy **within Nagpur** | **BLOCKING** | exact terms. The site already states, permanently, that home delivery outside Nagpur is not available |
| 29 | Return policy | **BLOCKING** | window (e.g. 7 days), condition, what is excluded, refund vs exchange |
| 30 | Exchange policy | **BLOCKING** | old-gold exchange rules, deduction %, making-charge treatment |
| 31 | Warranty / after-sales | HIGH | what is covered and for how long |
| 32 | Billing transparency statement | OPTIONAL | e.g. GST invoice issued, weights shown on the bill |
| 33 | Privacy-related commitments | HIGH | confirm: do you want enquiries stored? how long? who reads them? |

---

## 5. PRODUCTS & PRICES

For each item, provide: **name · category · subcategory · material · purity · weight (g) ·
stone/diamond details · price or "on enquiry" · availability · product code · 1–5 photos ·
description**. Send in any format (Excel, a WhatsApp list, or photos with captions) — the
admin panel makes entry easy once it exists.

| # | Item | Priority |
|---|---|---|
| 34 | 10–20 real products to launch with (one or two per category) | **BLOCKING** for a real-looking catalogue |
| 35 | Product photos: 1 main + up to 4 angles per item, plain background if possible | **BLOCKING** |
| 36 | Real prices, or confirm "Price on Enquiry" for everything | HIGH |
| 37 | Making charges / wastage / stone-charge policy (for the calculator) | OPTIONAL — the calculator stays metal-value-only until this exists |

**Until real products exist**, the site shows clearly DEMO-labelled sample items with
"Price on Enquiry". They are never presented as your inventory.

---

## 6. IMAGERY

| # | Item | Priority | Notes |
|---|---|---|---|
| 38 | Exterior / signboard photo | HIGH | daytime, straight-on, clean |
| 39 | Interior wide shot | HIGH | shows the counters and lighting |
| 40 | Counter / display close-up | HIGH | |
| 41 | Staff at work (with their permission) | OPTIONAL | |
| 42 | Bridal set photographed on a model or mannequin | HIGH | strongest single conversion image |
| 43 | Category hero images | HIGH | one strong image per main collection page |
| 44 | Rate-page header image | OPTIONAL | bullion/coin imagery |

Format: original JPEG/PNG, ≥ 2000px on the long edge, no WhatsApp-compressed copies if you
can avoid them. Every demo image currently in use will be replaced 1:1 with these.

---

## 7. RATES (choose one path)

| Option | What it needs | Cost | Behaviour |
|---|---|---|---|
| **A. Manual IBJA entry** (recommended to start) | nothing — staff type the AM & PM rates into `/admin/rates` | free | fully functional today; source shown as "IBJA benchmark entered by Tulsi Jewellers" |
| **B. Automated provider** | an API key from a licensed provider (metals.dev ships as the mapper) | ₹0 on its free tier (100 calls/month, enough for twice-daily); otherwise $1.79/month (≈ ₹150) for 2,000 calls | the feed is fetched on a schedule and stored with its source and timestamp; a value that jumps past the approval threshold waits for you in the admin panel. Setup, cost and the licence terms to confirm: [`docs/RATE_PROVIDER.md`](RATE_PROVIDER.md) |
| **C. Indicative international spot** | a free-tier API key | free (limited) | clearly labelled **not** the IBJA benchmark — not recommended for a retail showroom |

| # | Item | Priority |
|---|---|---|
| 45 | Which option (A / B / C) | **BLOCKING** for the rate pipeline |
| 46 | Rate API key + provider name (if B or C) | only if B/C |
| 46a | **Written confirmation that you may publish the provider's rates on this commercial website** — display rights for the IBJA/MCX data, any required attribution wording, and storage of the history. A no-answer means stay on option A (manual). | **BLOCKING** before go-live with B |
| 47 | Source wording you want displayed | HIGH |
| 48 | Making-charge %/₹ per gram, wastage %, GST % (only if you want them in the calculator) | OPTIONAL |

The site never shows a rate without its source, date, time, unit, purity, session and GST
status — and it never shows `₹0` or a made-up number.

---

## 8. REVIEWS

| # | Item | Priority |
|---|---|---|
| 49 | Genuine customer reviews (name as they want it shown, rating, comment, and their permission to publish) | HIGH |
| 50 | Confirmation you want them published on the site | HIGH |

Until real reviews arrive, the site shows an honest "reviews will appear here once published"
state. It will never generate sample reviews, names or ratings.

---

## 9. ACCOUNTS & LOGINS (free tiers)

| # | Item | Priority | Notes |
|---|---|---|---|
| 51 | Supabase project URL + anon key + service-role key | **BLOCKING** | create at supabase.com → Project Settings → API; the service key goes only into the server env (never chat if you can avoid it) |
| 52 | Admin login email(s) for the dashboard | HIGH | you + staff; roles owner/staff |
| 53 | Vercel account (for hosting) | HIGH | free Hobby plan is enough |
| 54 | Domain name (e.g. tulsijewellersnagpur.com) | HIGH | + DNS access |
| 55 | GA4 measurement ID | OPTIONAL | analytics stays off until supplied |
| 56 | Search Console verification token | OPTIONAL | |
| 57 | Google Business Profile access | HIGH | for local search + map presence |
| 58 | Meta Pixel ID | OPTIONAL | |

---

## 10. RUNNING THE SITE YOURSELF (`/admin`)

The dashboard is built and guarded, but it has nothing to talk to until step 1 below is
done. Three steps, once:

1. **Create the Supabase project** and put its three keys in the environment
   (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`).
2. **Run the SQL**, in this order, in the Supabase SQL editor:
   `supabase/schema.sql` → `supabase/seed.sql` →
   `supabase/migrations/2026-10-10_stage-2.1_catalogue_and_rate_detail.sql` →
   `supabase/migrations/2026-10-11_stage-8_admin_audit_log.sql`. Every file is safe to run
   again.
3. **Create your login** (Supabase → Authentication → Users) and promote it by running the
   commented `insert into public.admin_users …` statement at the end of `supabase/seed.sql`.
   Until that row exists the panel stays closed even if the login works.

What you can do there, and what the public site does in response:

| Screen | Publishes immediately to | Notes |
|---|---|---|
| Rates | `/rates`, `/rates/history`, the home-page ticker | nothing publishes unless the value passes the same checks the automated feed uses |
| Products | `/collections`, `/products/<slug>`, the home page | a draft/archived product is invisible to visitors; the first gallery line becomes the main photo |
| Collections | `/collections`, the header menu | a collection holding products cannot be deleted |
| Announcements | the bar above the header | both languages required; start/end dates expire it automatically |
| FAQs | `/faq` and its FAQ structured data | once any row is active, the database replaces the built-in answers |
| Reviews | the home page | approve a review and it appears; samples disappear when genuine ones exist |
| Pricing rules | `/rates/calculator` | `owner` only; a rule marked public is shown to visitors, otherwise the calculator stays metal-value-only |
| Enquiries | nothing (internal) | no export of customer details is provided, by design |

Roles: `owner` can do everything; `staff` can read everything and edit products, rates,
announcements, FAQs and enquiry status, but cannot delete records or change pricing rules.

---

## 11. SIGN-OFF

| # | Item | Priority |
|---|---|---|
| 59 | Review the site with all placeholders visible and confirm none of them is a false claim | **BLOCKING** |
| 60 | Confirm the outside-Nagpur delivery wording is exactly what you want customers to read | **BLOCKING** |
| 61 | Confirm shipping/returns/privacy/terms text is acceptable (these are starting points, not legal advice — have them reviewed if needed) | **BLOCKING** |
| 62 | Provide a name and phone number for the "who to call if the site breaks" contact | HIGH |
| 63 | Run the admin setup steps in §10 and confirm you can sign in and publish a rate | **BLOCKING** before the site is called live |

---

**How to send this back:** any format is fine — fill the tables, or just paste answers
into chat in blocks (Contact / Brand / Products / Policies / Rates). Each batch is applied
to `src/lib/config.ts` (facts) or the database (products, rates, reviews), and the
corresponding entry disappears from `PENDING_CONFIRMATIONS`.
