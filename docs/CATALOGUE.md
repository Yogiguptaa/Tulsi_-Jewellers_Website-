# The product catalogue — how to add pieces

This is the owner-facing guide to the catalogue. It covers one path only, because
the site deliberately has one path: **edit a spreadsheet, import it, commit the
result.**

```
content/catalogue/products.csv          ← you edit this (Excel, Google Sheets, Numbers)
        │
        │  npm run catalogue:import       (validates first, writes nothing if a row is wrong)
        ▼
src/content/catalogue/products.json     ← the site reads this; never edit by hand
        │
        ▼
The catalogue pages, search, filters and product detail pages
```

Why a JSON file rather than a database: the catalogue is the one thing that must
never be down. A checked-in JSON file needs no server, no network and no database,
so the showroom stays browsable when everything external fails — and the hosting
bill stays at ₹0. A database can still be layered on top (the existing Supabase
admin panel is), but it is never required to show the catalogue.

---

## 1. Files and commands

| Path | What it is |
| --- | --- |
| `content/catalogue/products.csv` | The catalogue you edit. Ships with only the header row. |
| `content/catalogue/products.sample.csv` | Eight worked examples covering all three catalogue types. **Never publish it as-is** — the supplier row is marked `EXAMPLE`. |
| `src/content/catalogue/products.json` | Generated. Committed, so a deploy never depends on the import running. |
| `src/lib/catalogue/vocabulary.json` | The allowed values the importer accepts. |
| `public/images/products/<collection>/` | Where product photographs belong. |

```bash
npm run catalogue:import     # validate the CSV, then write products.json
npm run catalogue:check      # validate only; also fails if products.json is stale
npm run catalogue:sample     # run the whole pipeline on the sample file (writes .data/)
```

`catalogue:check` is part of `npm run verify` and `npm test`, so a CSV that drifts
from the published JSON fails the checks instead of quietly shipping stale stock.

---

## 2. Adding a piece, step by step

1. **Photograph it.** One to six images per piece, portrait 4:5, about 1200 × 1500
   px, WebP, under 600 KB each.
2. **Name the files** by product id and position:
   `public/images/products/gold/TJ-G-1001-1.webp`, `…-2.webp`, and so on.
3. **Copy a row** from `products.sample.csv` into `products.csv` and edit it. Every
   row needs at least: `product_id`, `name_en`, `description_en`, `category`,
   `type`, `metal`, `catalogue_type` and `image_1`.
4. **Run `npm run catalogue:import`.** Errors are printed with the CSV line number
   and the column. Nothing is written while any row is invalid.
5. **Look at it locally:** `npm run dev`, then open `/collections` and the product
   page.
6. **Commit both files** — the CSV and the regenerated JSON — plus the new images.

Removing a piece is the same loop: delete its row, import, commit.

---

## 3. Columns

Required columns are marked •. Everything else may be blank.

| Column | Notes |
| --- | --- |
| • `product_id` | Unique, 2–40 characters, letters/digits/`-`/`_`. Used on the bill, in the wishlist and in every WhatsApp message. Convention: `TJ-<collection initial>-<number>`, e.g. `TJ-G-1001`. |
| • `name_en` | Up to 120 characters. |
| `name_hi` | Falls back to `name_en` when blank (never machine-translated). |
| • `description_en` | 20–700 characters, factual: what it is, how it is made, what is included. |
| `description_hi` | Falls back to `description_en`. |
| `slug` | URL segment. Generated from `name_en`; must be unique. |
| • `category` | One of `gold-jewellery`, `gold-coins`, `gold-biscuits`, `silver-jewellery`, `diamond-jewellery`, `fancy-jewellery`, `gems`. |
| • `type` | `rings`, `necklaces`, `earrings`, `bangles`, `bracelets`, `chains`, `pendants`, `mangalsutra`, `necklace-sets`, `anklets`, `coins-bars`, `idols`, `gemstones`. |
| `style` | A lowercase hyphenated style word: `temple`, `kundan`, `polki`, `jadau`, `antique`, `bridal`, `minimal`, `modern`, `daily-wear`, `classic`, `diamond`, `gemstone`, `fashion`, `filigree`. Becomes a filter chip. |
| • `metal` | `gold`, `silver`, `fashion`, `gemstone`. |
| `purity` | `24K`, `22K`, `20K`, `18K`, `14K`, `925`, `other`. **Required for gold and silver** — the site never guesses a purity. |
| `weight_grams` | Grams, e.g. `42.5`. Leave blank rather than estimating. Say in the description when it is a pair total. |
| `stone_detail` | Factual stone sentence. Certification details stated at the counter, not invented here. |
| `gemstone` | `ruby`, `citrine-topaz`, `emerald`, `sapphire`, `pearl`, `amethyst`. Leave blank for none. |
| `gender` | `women`, `men`, `kids`, `unisex` (default `unisex`). |
| `occasion` | `bridal`, `daily`, `festive`, `gifting` (default `daily`). |
| `image_1` … `image_6` | `image_1` is required. A local path (`/images/products/gold/TJ-G-1001-1.webp`) or a Cloudinary delivery URL (see §5). |
| `availability` | `in_stock`, `on_enquiry` (default), `sold_out`. Only for `catalogue_type = showroom`. |
| • `catalogue_type` | `showroom`, `inspiration` or `supplier` — see §4. |
| `supplier_name` | Required for a supplier design. Printed on the product page. |
| `supplier_ref` | The supplier's own reference. Must be unique per supplier. |
| `supplier_url` | Optional https link to the supplier's page. |
| `price_inr` | Digits only. Showing a price is optional; leave blank and the piece reads "Price on Enquiry". Only allowed for showroom pieces. |
| `featured` | `true` / `false`. Featured pieces appear first on the home page. |
| `last_updated` | `YYYY-MM-DD`. Defaults to the import date. Shown on the product page. |
| `created_at` | `YYYY-MM-DD`. Optional; drives the "Newest" sort. Defaults to `last_updated`. |

---

## 4. The three catalogue types

This is the most important column on the sheet.

| `catalogue_type` | Means | What the site says |
| --- | --- | --- |
| `showroom` | The piece is physically at the Hansapuri showroom. | "In the showroom" **only** when `availability = in_stock`; otherwise "Ask availability" or "Not available right now". |
| `inspiration` | A design reference photographed or supplied so a customer can describe a style. | "Design inspiration — not showroom stock", plus a notice that the showroom will confirm what it can make or arrange. |
| `supplier` | An authorised supplier's design that can be ordered on request. | "Supplier design — ordered on request", the supplier's name, and a notice that price, making time and specification are confirmed before anything is agreed. |

The importer enforces the rule rather than trusting the person filling the sheet:

- an `inspiration` or `supplier` row may **not** be `in_stock`;
- an `inspiration` or `supplier` row may **not** carry a `price_inr`;
- a `supplier` row must name its supplier;
- the same supplier reference twice is an error.

`src/lib/catalogue/static.ts` re-checks the same rules when the site reads the
JSON, and `tests/catalogue.test.ts` asserts the wording, so an edit in a component
cannot reintroduce a false availability claim.

---

## 5. Images

**Local (recommended).** `/public/images/products/<category>/<PRODUCT-ID>-<n>.webp`.
The importer fails if the file is not there, so a broken path cannot reach a page.
JPG and PNG work; WebP is what the documentation and the size advice assume.

**Cloudinary (optional).** If the photographs already live in Cloudinary, paste the
delivery URL. Only `https://res.cloudinary.com/...` is accepted, and the importer
warns when the URL has no `f_auto,q_auto` transformation. Add
`/upload/f_auto,q_auto,w_1200/` to the path for a sensible mobile size. The cloud
name is enough — **no API key or secret is used, and none may be committed**;
images are read through their public delivery URLs.

**Never scrape another jeweller's photographs.** Every image must be the
showroom's own, or licensed with the licence recorded (the editorial photographs in
`public/media/manifest.json` already carry their licence and credit).

Missing images are handled at render time: `Photo` falls back to a neutral monogram
tile rather than a broken image icon.

---

## 6. What the importer refuses

| Problem | Message |
| --- | --- |
| Missing required column | `missing required column(s): …` |
| Duplicate `product_id` (case-insensitive) | `duplicate product_id … — every piece needs its own id` |
| Duplicate slug | `duplicate slug …` |
| Missing/incorrect image | `image_1 is required` / `not found: public/…` / `not an allowed image host` |
| Unknown category, type, metal, purity, gemstone, gender, occasion | `… must be one of: …` |
| Gold or silver without a purity | `purity is required for gold …` |
| Inspiration/supplier marked in stock | `a … entry cannot be "in_stock"` |
| Price on a non-showroom entry | `an inspiration or supplier design may not carry a price` |
| Supplier without a name | `supplier_name is required for a supplier design` |
| Same supplier design twice | `duplicate supplier record …` |
| Sample text left in a field | `… is still a sample value` / mentions `EXAMPLE` |
| Impossible date or weight | `weight_grams must be a positive number …` / `last_updated must be a real date` |

Warnings (not failures) flag a JPG where WebP is better, an image over 600 KB, and a
Cloudinary URL without transformations.

---

## 7. Supplier feeds

If a supplier provides a feed **and permits commercial use of their data and
images**, export it to CSV with the columns above and use the importer — no new
code, no runtime dependency. Until such permission exists, supplier designs go in
by hand as `catalogue_type = supplier` with the supplier named, which is what the
page discloses. The site never calls a supplier API to render the catalogue.

---

## 8. Deployment

The catalogue is static data. Nothing in this workflow needs a database, a secret
or a paid service, and no deployment was performed as part of adding it.

- **Current production:** Vercel, unchanged. `npm run build` then let Vercel deploy
  the branch as usual.
- **Cloudflare Workers (the ₹0 target):** the repository already carries
  `freebuff.wrangler.jsonc` and `@opennextjs/cloudflare` (`freebuff.open-next.config.ts`).
  Build with OpenNext, then deploy the generated Worker. The static JSON is bundled
  into the Worker, so there is no D1 or R2 requirement for the catalogue.
- `notFound()` in a partially prerendered route answers HTTP 200 with `noindex`;
  the sitemap lists only real pages. This is why unpublished product slugs do not
  pollute search results.

Do not deploy a build produced before `npm run catalogue:import` if the CSV has
changed — `npm run verify` fails on exactly that mismatch.

---

## 9. Troubleshooting

| Symptom | Cause and fix |
| --- | --- |
| `/collections` shows "new designs arriving" | `products.json` is empty. That is the honest state until real stock is imported — not a bug. |
| A piece does not appear | Wrong `category` (it lives on another collection page), or the row failed validation — run `npm run catalogue:check`. |
| "products.json is out of date with the CSV" | You edited the CSV and did not run `npm run catalogue:import`. |
| Product page 404s | The slug changed when `name_en` changed; old links stop working by design, so keep names stable or add an explicit `slug`. |
| Image shows the monogram tile | The path is not in `/public` (the importer would have caught this) or the Cloudinary URL is wrong. |
