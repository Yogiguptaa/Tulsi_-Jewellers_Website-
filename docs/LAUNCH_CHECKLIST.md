# LAUNCH_CHECKLIST.md — Tulsi Jewellers

Work top to bottom. Nothing here is optional unless it says **optional**. Ticks are
for you to keep; the ordering matters (the rate feed cannot work before the
database does).

Legend: ✅ done in the code · ⬜ your action · ⚠️ needs a decision from you

---

## 1. Fill the business facts (blocking)

Everything customer-visible comes from `src/lib/config.ts`.

| # | Item | Where | Status |
| --- | --- | --- | --- |
| 1 | Full address | `CONTACT.address` | ✅ filled from the public listing — ⚠️ confirm it matches your signboard |
| 2 | Call line + WhatsApp line | `CONTACT.primaryPhone` = `7558220117`, `whatsappPhone` = `8766693614` | ✅ set as two clearly labelled buttons in the header, footer, contact and product pages — ⚠️ confirm both lines are answered |
| 3 | Opening hours | `CONTACT.hours` **and** `HOURS_SCHEDULE` | ✅ Mon–Sat 10:30–21:00, Sunday closed — ⚠️ both must change together, or the "Open now" label will be wrong |
| 4 | Email | `CONTACT.email` | ⬜ blank on purpose; the footer hides the row until you supply one |
| 5 | Map coordinates | `CONTACT.latitude` / `longitude` | ✅ street-accurate pin; replace with the shopfront pin for exact distances |
| 6 | Google Maps link | `CONTACT.googleMapsLink` | ✅ searches the street address — no API key, no billing |
| 7 | Instagram / Facebook | `CONTACT.instagram` / `facebook` | ⬜ blank; footer hides them |
| 8 | Tax number | `CONTACT.gstNumber` | ⬜ blank; printed on your bill, never on the site. Rate cards deliberately show no tax line — they say *“Rates shown are indicative. Final price depends on the product, making charges and applicable taxes, confirmed at Tulsi Jewellers.”* |
| 9 | Established year | `CONTACT.establishedYear` | ✅ 1990 from the public listing — ⚠️ correct if wrong |
| 10 | Business story | `CONTACT.aboutStory` | ⬜ `/about` shows an owner-input notice until you write it |
| 11 | Scheme terms | `SCHEME.terms` | ✅ written from your card wording — ⚠️ have it checked |
| 12 | Delivery within Nagpur | `DELIVERY.insideNagpurNote` | ✅ states that nothing is promised; the outside-Nagpur notice is already everywhere it must be |

Run `npm run check:placeholders` after any change: it fails the build if a raw
`[INSERT …]` would reach a customer.

## 2. Real logo and photographs

- ⬜ `public/logo.svg` → replace with the real mark (square, works on light and dark).
- ⬜ `public/favicon.ico`, `public/apple-touch-icon.png`, `public/og-default.jpg`
      (the generated `apple-icon` and `opengraph-image` are branded placeholders —
      real artwork is better).
- ⬜ Photographs: [public/images/README.md](public/images/README.md) and
      [docs/MEDIA_GUIDE.md](docs/MEDIA_GUIDE.md) explain the sizes and the media
      pipeline. Stock files live in `public/media/`, are listed in
      `public/media/manifest.json` and credited on `/image-credits`; replace each
      one with the showroom's own photo (or refresh the stock with
      `npm run sync:media`) and delete its manifest entry and credit row together.

## 3. Supabase production project

1. ⬜ Create the project, then run in the SQL editor, in this order:
   `schema.sql` → `seed.sql` → `migrations/2026-10-10_stage-2.1_…` →
   `migrations/2026-10-11_stage-8_…` → `migrations/2026-10-15_stage-11_…` →
   `migrations/2026-10-17_stage-12_metalsdev_daily_rates.sql` and
   `migrations/2026-10-18_stage-13_rate_refresh_lock.sql`.
2. ⬜ Promote your auth user with the commented SQL at the end of `seed.sql`.
3. ⬜ **Re-verify RLS before going live** (this was never run against a live database):
   - as `anon`, these must return `[]`, not rows: `metal_rates` where
     `approval_status='pending'`, `rate_job_logs`, `rate_api_usage`, `enquiries`,
     `scheme_enquiries`, `reviews` where `status<>'approved'`, `admin_users`;
   - as `anon`, an `INSERT` into `metal_rates` / `reviews` must be refused;
   - as `anon`, an `INSERT` into `enquiries` must succeed with `status='new'` and
     nothing else.
   Full script: `supabase/RLS_TESTING.md`.
4. ⬜ Storage: create the `product-images` bucket and confirm only an admin can write.
5. ⬜ Check `/admin/login` shows the sign-in form (not the setup screen) and that a
   signed-in non-admin gets the neutral 403.

## 4. Automatic rates

Nothing needs to be bought or signed up for. The key-less spot feed is already on
when `RATE_PROVIDER` is unset, and it runs every day.

1. ⬜ **See a real value now:** `npm run dev`, then in another terminal
   `npm run rates:fetch`. It prints every stored row in rupees.
2. ⬜ **Match your counter.** If the board reads low against what you quote, set
   `RATE_INDIAN_MARKET_PCT` to the difference you see (the converted international
   price excludes duty and local premium). It is printed on the rates page as a
   shop-set adjustment; leave it at 0 to show the raw converted price.
3. ⬜ **Daily refresh on the live site.** `vercel.json` runs at 04:00 UTC (09:30 IST)
   and `.github/workflows/fetch-rates.yml` retries at 05:00 UTC. Set `CRON_SECRET`
   in Vercel **and** in GitHub → Settings → Secrets and variables → Actions, plus
   `SITE_URL` in GitHub. Without the secret the cron route answers 503 by design.
4. ⬜ Run the Stage 12 and Stage 13 migrations and add
   `SUPABASE_SERVICE_ROLE_KEY` to Vercel, otherwise the live site keeps no rate
   (on a laptop it falls back to `.data/rates.json`).
5. ⬜ **Rates appear without any cron, too.** Open `/rates` — when the stored value
   is missing or older than six hours the API refreshes it once by itself (one lock,
   quota-guarded). Nothing to press.
6. ⬜ **First rate run:** open `/admin/rates` and press **Run now**. Expect
   `inserted: 6` (24K/22K/20K/18K/14K gold and silver 999). Press it a second time —
   it must answer *"Today's rates are already stored"* and spend no call.
7. ⬜ Confirm on `/rates`: *Latest available rate*, the source sentence
   ("International market price converted to INR…"), the source, date, IST time,
   unit and purity, and the making-charges line instead of any tax figure.
8. ⬜ **Optional — a licensed feed.** To use MetalCharts instead
   (<https://metalcharts.org>, free plan, 200 calls/month, attribution already
   printed), set `RATE_PROVIDER=metalcharts` and `RATE_API_KEY=…`, then
   `node scripts/check-rate-provider.mjs`.
9. ⬜ **If you enter the rate yourself**, use `/admin/rates` → manual entry. A fresh
   manual value leads its series for 36 hours, then the automatic feed takes over.
10. ⬜ Diagnose anything unexpected with
   `curl http://localhost:3210/api/dev/rates-status` (development only, 404 in
   production): it shows where values are stored, which variable names are set, the
   last job message and the age of the newest row — never a key value.
11. ⬜ Check `/admin/rates` → *Rates health*: provider, endpoint host, calls used this
   month, next run.

## 5. Deploy and domain

1. ⬜ Vercel → import the repository → set every environment variable for
   **Production** (and Preview, if you want the preview links to work).
2. ⬜ Add the domain, point DNS, and wait for SSL to show *Valid*.
3. ⬜ Set `NEXT_PUBLIC_SITE_URL` to the final origin (no trailing slash) — canonical
   tags, Open Graph, the sitemap and the shared rate card all read it.
4. ⬜ Redeploy after changing any variable (Next inlines the `NEXT_PUBLIC_*` ones).
5. ⬜ Check the security headers arrive:
   `curl -sI https://your-domain | grep -iE 'x-frame|referrer|content-security|strict-transport'`.

## 6. End-to-end test on a real phone

- ⬜ Send one real enquiry from `/contact` and one from a product page. Both must
  appear in **Admin → Enquiries** within seconds, and the visitor must see the
  success state.
- ⬜ Repeat a few times quickly: the rate limiter must eventually answer *"Too many
  enquiries from this device"* rather than accepting everything.
- ⬜ Submit the scheme enquiry form; check it lands in the same screen.
- ⬜ Tap every WhatsApp button (header, footer, floating button, product, wishlist,
  rate share) on **both iPhone and Android** — the link must open WhatsApp with the
  message pre-filled.
- ⬜ Tap every phone number: the dialler must open with `+91…`.
- ⬜ Open `/visit-us`, allow location once, and check the distance reads as
  *approximate*; deny it and check the page still works.
- ⬜ On iOS Safari: *Share → Add to Home Screen*, and confirm the icon and name.
- ⬜ Turn on the phone's **Reduce Motion** setting and reload — no animations.
- ⬜ Search for today's rate on the phone; check the ticker and `/rates` agree.

## 7. Search Console and local search

1. ⬜ Verify the domain in Search Console, submit
   `https://your-domain/sitemap.xml`, and check `/robots.txt` disallows `/admin`,
   `/api/` and `/wishlist`.
2. ⬜ Google Business Profile: make the **name, address and phone identical** to
   `CONTACT` — a mismatch splits your local ranking. Add the showroom photos.
3. ⬜ Once reviews are live on Google, put the review link into
   **Admin → (config)** so the "Review us on Google" link can be switched on.
4. ⚠️ **Optional**: GA4 measurement ID and Meta Pixel ID — both stay off until you
   supply them, and neither is currently wired, so the privacy policy describes
   exactly what the site does today.
5. ⬜ Print the site's QR code for the counter and the bill:
   `npm run qr -- https://your-domain`, then verify `public/qr/site.svg` on two
   phones and print at least 30 mm square. (The file currently encodes the local
   development URL — regenerate it with the real domain before printing.)
6. ⚠️ **hreflang is deliberately not used.** Both languages share one URL and are
   switched in the browser, so there is no second URL to declare. If you ever want
   `/hi/…` as a separate, indexable set of pages, that is a routing change — until
   then `hreflang` would point search engines at pages that do not exist.

## 8. Performance and quality gates

- ⬜ `npm run check:placeholders` → ✓ (also runs automatically as part of `npm run build`).
- ⬜ `npm run check:types` · `npm run lint` · `npm run build` → all clean.
- ⬜ `npm start` and walk the site once in production mode (not `npm run dev`).
- ⬜ Lighthouse, mobile, on the deployed URL. Target ≥ 90 for Performance,
  Accessibility, Best Practices and SEO. What is already done:
  the hero image is `priority` and preloaded through `next/image`, fonts are
  `display: swap` with the two Devanagari families subsetted to `devanagari`, every
  photo has fixed dimensions (no layout shift), and motion respects
  `prefers-reduced-motion`.
- ⬜ Check the browser console on `/`, `/rates`, a product page and `/admin` for
  zero errors, and the Network tab for zero 404s.
- ⬜ Re-run the enquiry and rate checks **on the deployed origin**, not just locally.

## 9. Known gaps (deliberate — decide if you want them)

| Gap | Why it is not done | What it would need |
| --- | --- | --- |
| Offline caching (service worker) | A cached rate could be shown after it stopped being true | a service worker that never caches `/api/*` + an offline page |
| Book a showroom visit | Needs real storage and an admin screen, not a form that pretends | `visit_requests` table + public write path with rate limiting + admin status |
| Rate-alert signup | Must not imply WhatsApp/SMS you cannot yet send | `alerts` table + consent text + admin list |
| Marathi | The i18n layer supports two languages cleanly; a third needs review of every string | `lib/i18n/mr.ts` + toggle |
| Dark mode | The ivory/maroon palette is the brand; a dark one must be designed, not inverted | design tokens + header toggle |
| GA4 / Pixel | No analytics is wired, and the privacy policy says so | measurement IDs + a policy update |
| Unknown: diamond admin "price guide" field | Every diamond quote is given at the counter | an admin-only field on the diamonds card |

## 10. After launch

- ⬜ Check **Admin → Rates** once a week: *Data age* and *API calls used*.
- ⬜ Approve or reject anything in *Awaiting approval* the same day — a flagged
  value is invisible to customers until you decide.
- ⬜ Check the enquiry list daily for the first fortnight.
- ⬜ Rotate `RATE_API_KEY` and `CRON_SECRET` if either ever appears in a chat,
  a screenshot or a log. Keys belong in `.env.local`, Vercel and GitHub secrets only.
