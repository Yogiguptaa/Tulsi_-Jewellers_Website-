# Team roles and access

Four responsibilities, and the boundaries between them. The guiding rule is that
**the public website has no administrative surface at all**: there is no admin
button, no admin route linked from the storefront, and no password written into the
code. Everything a customer can reach is read-only.

## Owner / Super Admin

Accountable for the catalogue being true.

- Decides what is showroom stock, what is inspiration and what is a supplier design
  — this is the one judgment the website cannot make for them.
- Owns the pricing policy: whether a price is published at all, and what the
  showroom quotes.
- Owns the hosting account, the domain and any secrets (there are currently none
  that the catalogue needs).
- Approves publication, and is the only role that should mark a piece `in_stock`.
- Holds the Supabase project credentials, if the optional admin panel is used.

## Catalogue Manager

- Adds and edits rows in `content/catalogue/products.csv`, photographs the pieces,
  and names the image files.
- Runs `npm run catalogue:import`, fixes the validation errors it reports, and
  checks the result on `/collections` before asking for a deploy.
- Maintains `last_updated`, weights, purity and stone details from the counter's own
  records — never from a photograph or an assumption.
- Does **not** change copy, layout or code.

## Content Manager

- Banners, collection descriptions, guide articles, inspiration collections and
  bilingual copy in `src/lib/i18n/`.
- Decides which supplementary photographs appear as editorial imagery, and keeps
  their licence and credit accurate in `public/media/manifest.json`.
- Does **not** edit product rows or the catalogue JSON.

## Developer / Maintainer

- Code, dependencies, tests, the import script and the build.
- Runs `npm run verify` (placeholders, copy rules, catalogue freshness, unit tests,
  TypeScript, ESLint) and `npm run build` before any deploy.
- Owns deployments, backups of the CSV and images, and dependency upgrades.
- Rotates any credential that has ever been pasted into a chat, ticket or commit —
  and keeps it out of the repository.

---

## How access actually works

| Surface | Who can change it | How it is protected |
| --- | --- | --- |
| Catalogue (`products.csv`, `products.json`) | Catalogue Manager, reviewed by the Owner | Git history and pull-request review. Every change is attributable and reversible. |
| Copy, images, design | Content Manager | Same repository review. |
| Code, deployment | Developer | Repository permissions and the hosting account. |
| Optional Supabase admin panel | Owner only | Supabase Auth with row-level security; the panel is not linked from the storefront and is not part of the public catalogue path. |

There is no shared password, no "admin" query parameter and no client-side check
that could be bypassed: the storefront renders data it is given and offers no
mutation at all. Enquiries are the only inbound write, through a validated form.

If the optional Supabase panel is not configured, the site still runs completely:
the catalogue is the JSON file, and the panel is an alternative editing surface for
the Owner, not a requirement.

---

## Handover checklist

1. The Owner can log in to the hosting account and the repository.
2. The Catalogue Manager has run `npm run catalogue:import` once and seen the piece
   appear locally.
3. `npm run verify` passes on a clean checkout.
4. `docs/CATALOGUE.md` has been read by whoever will add stock.
5. Any credential shared outside a password manager has been rotated.
