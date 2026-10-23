# Rate provider (external feed) — setup, cost and licence

This document only matters once you decide to switch the automatic feed on.

## 0. Which provider is which

| `RATE_PROVIDER` | Provider | Key variable | Free tier | Notes |
| --- | --- | --- | --- | --- |
| `metalcharts` (**default**) | [MetalCharts](https://metalcharts.org) | `RATE_API_KEY` | 200 calls/month | USD per troy ounce; the site converts with a daily USD→INR reference rate. The free plan requires a visible link to MetalCharts — the rates board renders it. |
| `metalsdev` | [Metals.Dev](https://metals.dev) | `METALS_DEV_API_KEY` | 100 calls/month | Quotes INR directly, one request, no FX step. |
| `manual` | The showroom | — | free | Values are typed into **Admin → Rates**. |

Provider files: `src/lib/rates/providers/metalCharts.ts` and `…/metalsDev.ts`.
Docs read for these implementations: <https://metalcharts.org/metals-api> and
<https://metals.dev/docs> (2026-10-18).

Every value fetched from either feed is a **converted international spot price**,
stored with `rate_type = 'spot_converted'`, GST and making charges excluded, and
labelled as such on every screen. It is never presented as the IBJA benchmark.

## 1. The variables (automatic daily rates)

MetalCharts (default — nothing else needs to change):

```env
RATE_PROVIDER=metalcharts
RATE_API_KEY=<the key from your MetalCharts dashboard>
```

Metals.Dev instead:

```env
RATE_PROVIDER=metalsdev
METALS_DEV_API_KEY=<the key from your Metals.Dev dashboard>
```

Optional, either provider:

```env
RATE_API_MONTHLY_LIMIT=200     # the job stops at 90% of this
RATE_MAX_JUMP_PCT=5            # bigger moves are held for admin approval
RATE_USD_INR=94.96             # pin the FX rate instead of the daily reference
```

## 2. What it costs

Metals.Dev prices as published on <https://metals.dev/pricing> (re-read 2026-10-17):

| Plan | Price / month | Requests / month |
| --- | --- | --- |
| Free | $0 | 100 |
| Copper | $1.79 | 2,000 |
| Silver | $9.99 | 10,000 |
| Platinum | $19.99 | 50,000 |
| Palladium | $39.99 | 100,000 |
| Gold | $99.99 | 500,000 |
| Enterprise | from $250 | custom |

Every plan — including Free — lists **MCX & IBJA prices**, and updates are capped
at a 60-second delay. Annual billing gives two months free. Request volume, not
features, therefore decides the tier:

| Schedule | Requests / month (approx.) | Fits |
| --- | --- | --- |
| Twice a day, Mon–Fri — **what `vercel.json` ships with** (`0 5,12 * * 1-5` = 10:30 and 17:30 IST) | ~44 | Free plan (100) |
| Every 30 min, 09:30–18:30 IST, Mon–Fri | ~396 | Copper ($1.79) |
| Every 15 min, 09:30–18:30 IST, Mon–Fri | ~792 | Copper ($1.79) |

**Bottom line: ₹0 if the twice-daily schedule is enough, otherwise about
$1.79/month (≈ ₹150/month, ≈ ₹1,800/year) plus GST and card charges.** That is
the whole cost of the feed; the only other moving part is the Vercel plan note
below. A twice-daily poll of a twice-daily benchmark is the honest match — paying
for a 60-second feed buys nothing a jeweller can use.

Quota safety: the panel warns at 80% and 100%, gives paid plans 10% grace, then
disables access until the month resets — it never bills overage. If access is cut
mid-month the site does not break: the cron run fails, the failure is logged, and
the last verified rate stays published with its own date.

**Vercel plan note:** Vercel Hobby triggers a cron job only once per day, so the
committed twice-daily schedule needs **Pro**. On Hobby, either accept one run per
day (`0 5 * * 1-5`, ~22 requests/month) or keep Vercel out of it and call the same
route from any scheduler that can send the `CRON_SECRET` header. If you upgrade,
change the schedule and the provider tier together.

> Whatever you choose, the schedule must match how often the benchmark actually
> moves. IBJA publishes a morning and an afternoon rate on business days; polling
> every five minutes would spend quota to learn nothing, and would tempt someone
> into labelling a twice-daily figure “Live”.

---

## 3. Licence terms you must confirm before going live

Do this in writing (email is fine) with Metals.Dev, and keep the reply. The site
can be switched on without it, but **you** are relying on these answers:

1. **Public display rights** — the terms (read 2026-10-17) say: *“You are
   authorized to publish rates provided by Metals.Dev API on websites for
   commercial purposes or for personal use, as long as you maintain an active
   subscription … Upon the termination of your subscription, you may not use the
   information extracted from the API for commercial purposes.”* So publishing on
   Tulsi Jewellers' shop site is allowed **only while the subscription is live**.
   Confirm in writing that the **Free tier counts as an active subscription for
   commercial display** — the same terms reserve the right to change free usage
   without notice, so for a commercial shopfront the safe reading is to buy the
   cheapest paid tier (Copper, $1.79/month).
2. **Redistribution right for the IBJA/MCX authority feed specifically** — that
   Metals.Dev is licensed to redistribute IBJA and MCX data and that your display
   of it is covered.
3. **Attribution** — whether a credit is required, in what wording. The site
   already prints `Source: IBJA benchmark (via Metals.Dev)` next to every value;
   confirm that satisfies it, or supply the exact wording you want shown.
4. **Field meaning (this is a data-correctness question, not a pricing one)** —
   which fineness `ibja_gold` represents, and what unit the response is in when it
   reports `"unit": "default"`. The mapper refuses to guess: it will reject the
   payload until `RATE_API_UNIT` is set. See §4.
5. **Storage and history** — that keeping a history of the values (the site stores
   every observation and charts it) is permitted.
6. **Polling limits** — the maximum request frequency and any caching obligation.
7. **On cancellation** — what you must stop displaying when the subscription ends.
   The site is already built for this: switch `RATE_PROVIDER` back to `manual`, or
   simply remove `RATE_API_KEY`; the external feed turns off and the showroom's own
   labelled entries are shown instead.
8. **No warranty / no accuracy guarantee** — the terms state the data is provided
   “AS IS”, that Metals.Dev is *not* a financial data feed provider and does not
   warrant accuracy or timeliness, and that nothing is financial advice. The
   wording on the site therefore says “indicative benchmark”, never “official” or a
   guarantee, and the shop remains answerable for the counter price. Governing law
   is India, which suits a Nagpur business.
9. **No resale** — reselling the data or building a competing API is forbidden;
   storing the shop's own history for its own chart is a different thing, which is
   why item 5 above still needs a yes in writing.

If you would rather have IBJA's own permission instead of going through an
aggregator, that is a separate commercial conversation: IBJA's public site states
that use beyond fair use needs its permission.

---

## 4. Going live, step by step

1. Create the Metals.Dev account and copy the API key into `.env.local` locally and
   into Vercel → Environment Variables for production. Do not paste it into chat.
2. Set `RATE_PROVIDER=metalsdev` and `METALS_DEV_API_KEY=…` (plus `RATE_API_MONTHLY_LIMIT=100`
   and `RATE_MAX_JUMP_PCT=5` if you want them stated explicitly).
3. **See what really arrives, with the key redacted:**

   ```bash
   node scripts/check-rate-provider.mjs
   ```

   This prints the response shape — currency, unit, timestamp, which fields came
   back and the converted ₹ values — and never prints the key.
4. Read the printed **unit**. If it says `default` (or anything that is not a real
   unit), set `RATE_API_UNIT` to what the values really are (`g`, `kg`, `toz`) and
   re-run until the converted values look like real gold and silver rates.
5. Confirm the fineness behind each field from that output, then delete the
   matching entry from the `assumptions` list in
   `src/lib/rates/mappers/metals-dev.ts` — the admin panel shows "Check" for as long
   as an assumption is unconfirmed.
6. Run, in the Supabase SQL editor:
   `supabase/migrations/2026-10-15_stage-11_rate_provider_governance.sql` (approval
   governance) and then
   `supabase/migrations/2026-10-17_stage-12_metalsdev_daily_rates.sql`
   (`rate_type` + monthly call accounting). Until Stage 11 runs, the ingest refuses
   to store anything, so no un-approved value can ever be published.
7. Set `CRON_SECRET` in Vercel; without it `/api/cron/fetch-rates` returns 503 and
   does nothing, by design. Add the same value and `SITE_URL` as GitHub repository
   secrets so `.github/workflows/fetch-rates.yml` can run as the safety net.
8. Deploy, then open **Admin → Rates**: the *Feed status* card shows the active
   feed, the endpoint host, whether a key is set, how fresh the data is, the calls
   used this month, and anything waiting for approval. **Run now** triggers the
   same job by hand; a second run the same day fetches nothing and spends no call.

### Schedule

| Where | When | Behaviour |
| --- | --- | --- |
| `vercel.json` | `0 4 * * *` (09:30 IST) daily | Vercel Hobby allows one cron run per day, precise to the hour |
| `.github/workflows/fetch-rates.yml` | 04:00 and 05:00 UTC | Second run is a safety net; it exits immediately when today's rows exist |

Both may be active: the endpoint is idempotent (same series + observation time +
source is never stored twice), so a duplicate trigger costs nothing.

---

## 5. What the site will and will not say

| Situation | What a customer sees |
| --- | --- |
| Fresh value from an intraday feed | `Live rate` — only if the mapper declares `publication: "intraday"` |
| IBJA/MCX published benchmark (the metals.dev feed) | `Latest published rate`, with `Source: …` and the publish time next to it |
| Nothing ever recorded | The labelled "rate unavailable" notice — never `₹0`, never a dash |
| Feed configured but failing | The last verified value with **its own date**, and the admin panel names the failure. Nothing is blended or extrapolated |
| Value held for approval | Not shown at all; customers keep seeing the previous published value |
| Showroom's own entry | `Source: Entered by Tulsi Jewellers (IBJA benchmark)` |

Rules enforced in code: a stored value belongs to exactly **one** source (never
averaged across providers); when a board carries values from more than one source,
each line is labelled and the board lists every source with its own newest time.

## 6. Safety rails (all in `src/lib/rates/`)

- **Validation before storage** — numeric and positive, INR only (a foreign-currency
  quote is refused, never converted), expected unit, expected purity, the provider's
  own timestamp present and neither in the future nor older than `RATE_MAX_AGE_DAYS`,
  and a plausible INR band per series (a per-ounce figure read as a per-10-gram rate
  is rejected).
- **Approval gate** — a value that clears all of that but moves more than
  `RATE_MAX_JUMP_PCT` (default **6%**) against the last published value for the same
  series is stored as `pending`: held off the site until an admin approves it on
  **Admin → Rates**, with the reviewer's email and the time recorded on the row and
  in `rate_job_logs`. Manual entries obey exactly the same rule.
- **Never a silent overwrite** — a failed validation stores nothing, so the last
  good value stays published with its own timestamp.
- **History** — the chart reads only publishable rows, so a withheld value cannot
  appear on a public graph.
- **Audit** — every run (scheduled, manual or approval) writes to `rate_job_logs`.

---

## 7. Adding another provider

One file, one registry line:

1. Copy `src/lib/rates/mappers/metals-dev.ts` to `…/mappers/<provider>.ts`, change
   `id`, `hosts`, `defaultEndpoint`, `sourceName`, `series`, `assumptions` and the
   `map()` function to match the provider's real response.
2. Add it to `MAPPERS` in `src/lib/rates/mappers/index.ts`.
3. Point `RATE_API_URL` at it (or set `RATE_API_PROVIDER=<id>`).

Validation, storage, approvals, the cron route and every screen keep working
unchanged, because nothing outside `mappers/` knows which provider is in use.
