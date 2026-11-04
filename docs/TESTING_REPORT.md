# Testing report — catalogue upgrade

Everything below was executed on the local checkout. Results are copied from the
actual command output, not estimated. Where something could not be tested, it is
listed under **Not tested** with the reason.

- **Environment:** Windows, Node 25.3.0 (the project targets Node 22.x), Next.js
  16.4.2, Turbopack build, production server on `localhost:3100` / `3101`.
- **Date of run:** 3 November 2026.

## 1. Automated checks

| Check | Command | Result |
| --- | --- | --- |
| Placeholders | `node scripts/check-placeholders.mjs` | ✓ exit 0 — 4 documented placeholders, **none customer-visible** |
| Copy and media guards | `node scripts/check-customer-copy.mjs` | ✓ exit 0 — 5,926 strings, 13 design styles, 36 media assets |
| Catalogue freshness | `node scripts/import-products.mjs --check` | ✓ exit 0 — CSV valid, `products.json` in sync |
| Unit tests | `vitest run` | ✓ **71 tests, 8 files, all passing** |
| TypeScript | `tsc --noEmit` | ✓ exit 0 |
| ESLint | `eslint src --max-warnings=0` | ✓ exit 0, no warnings |
| Production build | `next build` | ✓ exit 0 — 82 static/partial pages generated |
| Route smoke test | `scripts/smoke-live.mjs http://localhost:3100` | ✓ **65 routes, all 200**, 5 extra in-page links, 0 failing |

`npm run verify` runs all of the above except the build and smoke test, and now
also fails when the CSV and the published JSON disagree.

## 2. Catalogue behaviour, exercised with real rows

The pipeline was proved end to end by importing
`content/catalogue/products.sample.csv` into the site, building it, serving it, and
then restoring the empty catalogue.

- Import: **8 products written — 6 showroom, 1 inspiration, 1 supplier, 0 errors**,
  11 warnings (JPEG instead of WebP, two files over 600 KB).
- Routes checked individually, all **200**: `/`, `/collections`,
  `/collections/diamond-jewellery`, `/collections/gold-jewellery`,
  `/jewellery/rings`, `/jewellery/bridal-jewellery`, `/gems`,
  `/products/temple-gold-necklace`, `/products/bridal-set-design-reference`,
  `/products/kundan-necklace-supplier-design`, `/rates`, `/visit-us`, `/contact`,
  `/wishlist`, `/sitemap.xml`, `/robots.txt`, `/api/health`.
- Rendered markup asserted on the three provenance types:
  - showroom piece recorded in stock → `In the showroom` present (1 occurrence);
  - inspiration piece → `Design inspiration` (1) and `not showroom stock` (1);
  - supplier piece → `Supplier design` (1) and `ordered on request` (2).
- Sitemap contained both the published product slug and
  `/collections/diamond-jewellery`.
- Rates integration still healthy during the run: `/api/rates/latest` → 200 with
  **6 of 6 lines populated**, status `updated`; `/api/health` → 200, `ok`.

## 3. Proving nothing fake ships

After restoring the empty catalogue and rebuilding:

| Assertion | Result |
| --- | --- |
| `/` returns 200 | ✓ |
| `/collections` returns 200 | ✓ |
| Sample product name on the home page | **0 occurrences** |
| Sample product name on a collection page | **0 occurrences** |
| Sample product slug in `sitemap.xml` | **0 occurrences** |
| `catalogue:check` (CSV vs JSON) | ✓ in sync, 0 products |

The shipped catalogue is empty by design. The site renders its existing empty state
rather than any invented inventory.

## 4. Importer rejection tests

Covered by `tests/catalogue-import.test.mjs`, all passing:

- duplicate `product_id` (case-insensitive) — rejected;
- duplicate slug derived from the same name — rejected;
- inspiration or supplier row marked `in_stock` — rejected;
- price on an inspiration or supplier row — rejected;
- supplier row without `supplier_name` — rejected;
- the same supplier reference twice — rejected;
- missing `image_1`, a path that does not exist in `/public`, an image on a
  non-allow-listed host, and `http://` images — rejected;
- unknown category, jewellery type, metal or gemstone — rejected;
- gold/silver without a purity — rejected;
- non-numeric weight, impossible date — rejected;
- missing required columns — rejected with the column names;
- a header-only file — accepted as an empty catalogue;
- the shipped sample file — 8 products, 0 errors;
- quoted commas and escaped quotes parse correctly; comment rows are skipped;
- a Cloudinary delivery URL is accepted, with a warning when it has no
  `f_auto/q_auto` transformation.

## 5. Provenance and filter tests

Covered by `tests/catalogue.test.ts`, all passing:

- the vocabulary JSON matches `COLLECTIONS`, the `JewelTypeSlug` union, the enum
  values and `GEMSTONES` (drift between the importer and the app fails the suite);
- a showroom piece says "In the showroom" only when `availability = in_stock`, and
  "Ask availability" otherwise — never "available now";
- an inspiration design is never described as stock, even if bad data reaches it;
- a supplier design names its supplier, says "ordered on request", and carries the
  supplier reference;
- a real showroom piece has no provenance notice;
- every WhatsApp message contains the product name **and** product code, for all
  three catalogue types;
- the catalogue-type filter cannot return an inspiration item under "showroom";
- style, metal, category and search combine correctly; Hindi text is searchable;
- unpriced products sort **last** in both price directions;
- the bridal landing page matches the bridal occasion, not a collection slug, and a
  product type with no landing page is not silently matched elsewhere;
- related designs prefer the same provenance.

## 6. Bugs found and fixed

| # | Bug | Root cause | Fix |
| --- | --- | --- | --- |
| 1 | A product had no notion of showroom / inspiration / supplier, so nothing stopped an inspiration photo from being presented as stock | The data model only had `availability` | Added `catalogueType`, `style`, `supplier` and `lastUpdated`; enforced the rules in the importer, re-checked them when reading the JSON, and render them on card, quick view and detail page |
| 2 | "Price: high to low" put every *Price on Enquiry* piece first | Unpriced products were ranked `Infinity`, which is last ascending but first descending | Replaced the numeric rank with a comparator that keeps unpriced items last in both directions |
| 3 | The importer rejected valid values such as `necklace-sets`, `coins-bars`, `daily wear` | The token normaliser converted every hyphen to an underscore | Normaliser now unifies whitespace to `-` and matches vocabulary values treating `-`/`_` as equal |
| 4 | `src/lib/rates/manualBenchmark.ts` failed `tsc` (`RateProvider` not exported from `./types`) | The provider interface moved to `./providers` and this file was never updated; nothing imports it | Removed the orphaned, non-compiling file. It duplicated the manual-entry path and was unreachable; no working functionality was removed |
| 5 | `HomeView` rejected the new `"static"` / `"mixed"` catalogue sources | Its `source` prop was typed `"database" \| "empty"` | Widened the prop to the real union, with a comment explaining each value |
| 6 | The new `diamond-jewellery` collection rendered no design wall, failing the designs test | It was added to `COLLECTIONS` but not to `COLLECTION_DESIGN_SLUGS` | Mapped it to the existing diamond/gemstone style photographs |

## 7. Not tested, and why

| Area | Status |
| --- | --- |
| Cloudflare deployment | **Not performed.** No Cloudflare credentials were supplied and deployment was not authorised. The build produces a standard OpenNext/Workers bundle; `freebuff.wrangler.jsonc` is unchanged. |
| Vercel / live site | **Not touched.** The existing production deployment was left exactly as it was. |
| Real Android / iPhone / tablet devices | Not tested on hardware. Responsive behaviour is CSS + existing layout; no physical device or browser automation was used in this run. |
| Actual WhatsApp handoff | The link and message text are covered by unit tests and the rendered markup, but WhatsApp itself was not opened. |
| Supabase admin panel | No database is configured locally, so the panel's product editing was not exercised. The catalogue does not depend on it. |
| Lighthouse / Core Web Vitals numbers | Not measured; no performance claim is made. Images use `next/image` sizing and lazy loading as before. |
| Accessibility audit with a screen reader | Not performed. Focus states, labels and alt text are unchanged from the existing design, with new controls built from the same primitives. |
| Supplier feed importer against a live feed | Not possible without a supplier that permits commercial reuse; CSV is the documented path. |

## 8. Reproducing this

```bash
npm run verify                                  # placeholders, copy, catalogue sync, tests, types, lint
node ./node_modules/next/dist/bin/next build     # production build
node ./node_modules/next/dist/bin/next start -p 3100
node scripts/smoke-live.mjs http://localhost:3100
```

To exercise the catalogue as this report did:

```bash
node scripts/import-products.mjs --in content/catalogue/products.sample.csv --out src/content/catalogue/products.json
# build, inspect /collections and the three product pages, then restore:
git checkout src/content/catalogue/products.json   # if tracked; otherwise restore the empty file
```

The sample file is a template, not inventory. It must not be published.
