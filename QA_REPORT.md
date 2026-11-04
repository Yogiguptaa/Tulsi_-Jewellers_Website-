# QA report — Tulsi Jewellers

Date: 4 November 2026
Production: https://tulsijewellerswebsite.vercel.app/
Branch shipped: `final-polish` → `main`

## 1. Why nothing was changing

`main` and `origin/main` were both at `517e7cd`, with **51 uncommitted entries**
(26 modified tracked files, 25 new files) on the build machine. Vercel builds
from GitHub `main`, so it had no new commit to build and kept serving the old
site. This was not a caching fault: there is no service worker, no `next-pwa`
registration and no `revalidate` override in the layout, home page or
`next.config.ts`.

All of that work is now committed on `final-polish`, merged to `main`, and
deployed. Proof, not assertion:

```
GET /api/version
{"commit":"265a8dc1c84b9c424357dc6d0fd007dd804637a0","shortCommit":"265a8dc",
 "builtAt":"2026-11-04T05:30:58.279Z","env":"production","branch":"main"}
```

`/api/version` returns `Cache-Control: no-store` and does not exist in the old
build (it was 404 before this deploy). The admin footer shows `v<short sha>`.

## 2. Rates — what is served now

The old board published an **international spot price converted to rupees**,
which is 15–22% below an Indian counter quote because duty, local premium and
taxes sit on top.

The board now reads one verified Indian figure and derives the rest:

| Purity | Live value (per 10 g) | Derivation |
|---|---|---|
| 24K / 999 | **₹1,42,024.00** | Indian 24K base |
| 22K / 916 | ₹1,30,093.98 | × 0.916 |
| 20K / 833 | ₹1,18,305.99 | × 0.833 |
| 18K / 750 | ₹1,06,518.00 | × 0.750 |
| 14K / 585 | ₹83,084.04 | × 0.585 |
| Silver 999 / kg | ₹1,95,719.00 | Indian silver base |

Comparison with the Indian reference points supplied for this work:

- 24K ₹1,42,024 vs MCX ₹1,42,024 — the same figure (it is the source).
- 24K ₹1,42,024 vs Nagpur retail ₹1,45,376 (1 Nov) — **2.3% lower**, which is
  exactly the kind of small showroom-to-benchmark difference the label covers.
- 22K ₹1,30,093.98 vs Nagpur retail 22K ₹1,33,163 — 2.3% lower.
- The old live 24K was ₹1,20,547.52, i.e. **17.1% below** Nagpur retail and
  **15.1% below** MCX.

Live payload checks (`/api/rates/latest`):

- `providerLabel: "India market benchmark (MCX)"`
- `spotConverted: false` (no silent conversion)
- `customerNote: "India market benchmark (MCX), INR. Showroom rates may differ slightly."`
- six lines, no `₹0`, no `NaN`
- `status: "stale"` with notice *“Showing the last verified rate from 26 Oct
  2026, 6:00 pm IST. Please confirm today's rate at the store.”* — correct and
  deliberate: the seeded figure is dated 26 Oct 2026.

**Action for the owner:** update `content/rates/india-benchmark.json` (two
numbers + `observedAt`) each morning; see `docs/INDIA_RATES.md`. Until then the
site honestly shows the last verified figure and asks customers to confirm.

Reference check: before publishing, the 24K figure is compared with the converted
spot value. More than 3% below or more than 30% above that reference is held for
review. Unit-tested both ways.

## 3. Checks actually run

| Check | Command | Result |
|---|---|---|
| Placeholder guard | `npm run verify` | passed |
| Customer-copy / media guard | `npm run verify` | passed — 5,928 strings, 13 design styles, 36 media assets |
| Catalogue validation | `npm run import-products --check` | passed — CSV valid, 0 products (empty state is intentional) |
| Unit tests (Vitest) | `npm run verify` | **86 passed / 86**, 9 files |
| TypeScript | `tsc --noEmit` | passed |
| ESLint | `eslint src --max-warnings=0` | passed |
| Production build | `next build` | passed — 83 routes generated |
| Secret scan | tracked files + history | no keys; only `.env.example` is committed |
| Live smoke | `curl` | `/`, `/rates`, `/collections`, `/designs`, `/visit-us`, `/api/health`, `/api/version`, `/sitemap.xml` all **200** |

New tests added for this round (`tests/india-rates.test.ts`, 15 tests):
derivation of every purity and the exact factors, per-gram figures, silver 925,
empty/invalid base producing no rows, no zero or NaN, validation of missing
values, a decimal-point slip, a future timestamp, age calculation, and
reference-check rejection both below and above the band.

## 4. What is still open, and why

These were **not** done, and are reported as blocked rather than claimed:

1. **Unique images per collection/design.** The site has 36 licensed media assets
   and some sets reuse images (e.g. `mangalsutra` and `chains-and-pendants` have
   one each). The required 6×8 collection sets and 14×6 design sets need
   `PEXELS_API_KEY` / `PIXABAY_API_KEY` for `npm run sync:media`; neither exists
   in the environment. No images were taken from other jewellers.
2. **Catalogue products.** `content/catalogue/products.csv` is header-only, so
   the catalogue correctly shows its empty state. The importer, validation and
   pages are in place; real products, weights and photos must come from the
   owner.
3. **Browser test suites.** Playwright, axe and Lighthouse are not installed in
   this repository (no browser runner), so the e2e/accessibility/Lighthouse
   checklist was not executed. It is not reported as passing.
4. **Database-backed admin.** Supabase is not configured, so manual entry is the
   file-based path in `docs/INDIA_RATES.md`; `/api/health` shows
   `database: not_configured`, `scheduledJob: not_configured`.
5. **India/MCX live feed.** No verified India endpoint key is available. The
   MetalCharts India pages could not be confirmed without an account, and the
   “Mellora API” key/terms were not available, so neither is used.

## 5. Limitations and owner inputs

Still needed from the owner: real showroom photographs (Cloudinary or
`catalogue/images/<id>/`), the product CSV, the Google Maps embed link, a Google
Business Profile link, and any paid Indian rate-feed key. The site functions
without all of them.

No secrets were committed. `.env.local` is absent locally; `.env.production`
contains only `NEXT_PUBLIC_SITE_URL`. If a key was ever pasted into a chat or
document, revoke it in the provider dashboard and issue a new one.
