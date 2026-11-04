# OPERATIONS.md — running the site after launch

Short, specific, and in the order you would actually need it. Nothing here
invents a policy: if a fact has to come from the showroom, it says so.

---

## 1. What runs by itself

| What | When | Where |
| --- | --- | --- |
| Gold and silver rates | Daily 09:30 IST, plus a backup run at 10:30 IST | Vercel Cron → `/api/cron/fetch-rates`, GitHub `fetch-rates.yml` |
| Health check | Every 30 minutes | `.github/workflows/uptime.yml` → `/api/health`, opens an issue on failure |
| Build + tests | Every push to `main` and every pull request | `.github/workflows/ci.yml` |
| Festival strip | Computed per request, cached for minutes | `src/lib/festivals/` — no network call, so it cannot fail |

The site itself needs **no API key to stay up**. The rate feeds are keyless by
default; a key only raises the quality of the source.

---

## 2. Daily, weekly, monthly

**Daily (one minute).** Open `/api/health`. It should say `"status": "ok"`. If it
says `degraded`, the `checks` block says which part: `rates.state`,
`database`, `scheduledJob`, `festivals`.

**Weekly (five minutes).** Glance at `/rates` — the six lines should carry today's
date. Glance at `/admin` → Enquiries when Supabase is connected.

**Monthly (ten minutes).** Check the GitHub Actions tab: the uptime workflow
should be green, and the rate workflow should not be failing. Check the rate
provider's dashboard for remaining monthly calls.

---

## 3. If today's rate is missing

1. `/api/health` → `checks.rates` tells you whether nothing was published
   (`unavailable`) or only some lines are missing.
2. GitHub → Actions → **Fetch gold and silver rates** → **Run workflow**. Its log
   names the cause: `503` means `CRON_SECRET` is not set in Vercel; `401/403`
   means the two secrets differ; `429` means the provider's monthly quota is done.
3. If the provider is down, the site keeps showing the last verified value with
   its date and the line "Please confirm today's rate at the store", and falls
   back to a second source before it does that. A night with no upstream data
   no longer blanks the board.
4. You can always enter the rate yourself in `/admin` → Rates. That entry leads
   for 36 hours.

Never edit a value by hand in the database: the admin form runs the same checks
(positive number, plausible jump, correct unit) that the automatic job does.

---

## 4. Adding next year's festival dates

Dates live in `src/lib/festivals/data.ts`, one entry per festival, each with:

- `dateStart` / `dateEnd` — plain calendar dates in **India time**,
- `leadDays` — how early the strip may appear,
- `verified` — an entry that is not verified never renders,
- `sources` — two independent pages that agree on the date.

Procedure:

1. Read the dates on Drik Panchang for the year, and confirm each on one other
   panchang (Prokerala was used for 2026).
2. Add the entries. Where two sources disagree, leave the entry out until they
   agree — a wrong date is worse than no strip.
3. Run `npm test`. The calendar tests reject a reversed date, a missing source, a
   non-HTTPS source, a duplicate slug and a one-source "verified" entry.
4. Push. The strip appears on its own when a lead window opens and disappears the
   day after the festival.

Currently seeded: **2026 only**. That is deliberate — every date in the file was
read on a source page. Add 2027 the same way, before Diwali 2026.

---

## 5. Supabase free tier: keep-alive and pause

A free Supabase project is paused after about a week without activity, which
would take the admin panel and rate history offline. The daily rate job writes a
row when Supabase is configured, which counts as activity — but do not rely on
that alone:

- Keep `/api/health` green: it reads the rate snapshot daily.
- If you will not touch the site for a month, open the Supabase dashboard once a
  week, or move to a paid plan.
- A paused project is not lost: restore it from the dashboard and the data is
  back.

---

## 6. Backups

Every table that matters is append-friendly, and the two exports that matter are
small:

- **Enquiries** — `/admin` → Enquiries shows them; Supabase → Table editor →
  `enquiries` → Export CSV.
- **Rates** — `/rates/history` shows the published series; Supabase → `metal_rates`
  → Export CSV.

Do that monthly, or before any schema change. There is no automated backup
workflow in this repository, because it would need the service-role key stored in
GitHub — a bigger risk than the export it saves.

---

## 7. Vercel's free plan and a business site

Vercel's Hobby plan is intended for non-commercial use. A jewellery shop taking
enquiries is a business site, so **check Vercel's current terms before relying on
Hobby for this domain**. Options, cheapest first:

1. **Vercel Pro** — the least work: the repository is already configured, only the
   plan changes.
2. **Netlify** — `netlify.toml` is in the repository and the site deploys with no
   code changes.
3. **Cloudflare Pages** — works for the static pages; the rate cron would move to
   a Cloudflare Cron Trigger, which is code work, not a setting.

Nothing in this repository assumes a specific host beyond the `vercel.json` cron.

---

## 8. Rotating a key

| Key | Where to change it | Then |
| --- | --- | --- |
| `CRON_SECRET` | Vercel → Environment Variables **and** GitHub → Secrets | Redeploy Vercel, then run the rate workflow once |
| `RATE_API_KEY` | Vercel → Environment Variables | Redeploy |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → API → rotate, then Vercel | Redeploy; check `/admin` |
| `PEXELS_API_KEY` / `PIXABAY_API_KEY` | Only used by `npm run sync:media` locally | Nothing to redeploy |

After changing a Vercel variable, **redeploy** — an environment change alone does
not reach a running deployment.

---

## 9. What to do when something is wrong

| Symptom | First look |
| --- | --- |
| Rate board shows a date from yesterday | `/api/health` → `checks.rates.ageHours`; run the rate workflow |
| Rate board is empty | `/api/health` → `503` means no value at all; run the workflow and read its log |
| Enquiry form says it could not save | Supabase keys missing or the project is paused; the form offers WhatsApp meanwhile |
| Admin login does not work | Supabase Auth: the account must exist there **and** have a row in `admin_users` |
| A page is blank after a deploy | Vercel → Deployments → the build log; `npm run build` locally reproduces it |
| Festival strip is missing | Expected when no window is open. On a festival day it should show; if not, check `data.ts` `verified` |
| A collection page shows fewer photographs than expected | The design wall lists every photograph of every style mapped to that collection in `COLLECTION_DESIGN_SLUGS` (`src/lib/designs.ts`), eight at a time. Add a style there, or add photographs to the style's `images` array |

---

## 10. The showroom pin, the map and media

### The owner's own Google Maps link

The Visit page works without any Google account (it searches the published street
address). To point it at the showroom's own listing, paste two links in
**Vercel → Settings → Environment Variables**, for Production *and* Preview:

| Variable | Where to get it |
| --- | --- |
| `NEXT_PUBLIC_GOOGLE_MAPS_URL` | Google Maps → find Tulsi Jewellers → **Share → Copy link** |
| `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_URL` | Google Maps → same place → **Share → Embed a map** → copy the `src` address inside the iframe code |

Then **redeploy** (environment changes only reach a new deployment). Only `https`
links are accepted; a mistyped value is ignored and the address search is used, so
the page can never break because of a pasted link. No API key, no billing account.

If the pin should also make the distance estimate exact, set `CONTACT.latitude`
and `CONTACT.longitude` in `src/lib/config.ts` to the shopfront coordinates.

### Photographs and video

* Owner photographs: upload them to Supabase Storage and add them to a product;
they appear in the catalogue automatically.
* Stock photographs and video: the collection design walls read
`public/media/manifest.json`. To grow them, put `PEXELS_API_KEY` (and/or
`PIXABAY_API_KEY`) in `.env.local`, run `npm run sync:media`, then review each
picture before keeping it. Video tiles render automatically once a manifest
entry has `kind: "video"` and a `poster`; nothing else has to change.
* Every file keeps its licence and credit; `/image-credits` prints them. Never
copy a photograph from another jeweller's site or a marketplace.
