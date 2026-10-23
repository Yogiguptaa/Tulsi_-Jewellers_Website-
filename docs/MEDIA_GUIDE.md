# Media guide — stock photography, video, and the manifest

The storefront never hotlinks an image and never calls a stock-library API while a
customer is on the page. Everything is downloaded once, stored under
`public/media/`, described in `public/media/manifest.json`, and credited in
`public/images/CREDITS.md`.

## 1. How the pipeline fits together

| Piece | Role |
| --- | --- |
| `scripts/sync-media.ts` | Searches Pexels and Pixabay, downloads photos (and a few short videos), converts photos to WebP at 1600 px max, writes manifest entries and credits. |
| `public/media/manifest.json` | The only list components read: path, size, blur placeholder, bilingual alt text, category, licence. |
| `scripts/build-media-manifest.mjs` | Refreshes dimensions/blur from the files on disk, drops entries whose file is gone, and warns about unlisted files. It never invents a credit. |
| `src/lib/catalogue/images.ts` | Typed accessors (`imageFor`, `imageSrc`, `imageAlt`, `mediaProviders`). |
| `/image-credits` | Customer-facing table built from the manifest. |
| `public/images/CREDITS.md` | The text record, including the Pexels/Pixabay section the sync writes. |

## 2. Get the keys (free)

1. Pexels: <https://www.pexels.com/api/> → create an account → copy the API key.
2. Pixabay: <https://pixabay.com/api/docs/> → log in → copy the API key.
3. Put both in `.env.local` (never commit it):

```bash
PEXELS_API_KEY=...
PIXABAY_API_KEY=...
```

Both licences allow commercial use. Pexels asks for a visible credit, which the
footer and `/image-credits` provide. Neither library requires payment for the
standard API.

## 3. Run the sync

```bash
npm run sync:media            # search, download, write manifest + credits
npm run sync:media -- --dry   # search and print only
npm run media:manifest        # refresh sizes/blur after adding files by hand
npm run build                 # verify the site still compiles
```

With no keys the script prints the two steps above and changes nothing — the
site keeps the photographs already in the manifest.

## 4. Searches it uses

Fixed queries, one category each (edit `QUERIES` in `scripts/sync-media.ts`):

| Category | Search |
| --- | --- |
| rings | gold ring jewellery close up |
| necklaces | gold necklace indian jewellery |
| bridal | indian bridal jewellery gold |
| bangles | gold bangles jewellery |
| earrings | gold earrings jewellery |
| mangalsutra | mangalsutra black beads gold |
| anklets | silver anklet jewellery |
| silver | silver jewellery |
| diamond | diamond ring jewellery |
| gemstones | gemstone jewellery ring |
| showroom | jewellery showroom display |
| coins | gold coins bullion |
| hero | gold jewellery dark background (photos + 2 short videos) |

Results whose tags or alt text mention a model, bride or person are skipped on
purpose: no identifiable faces. Videos are limited to 16 seconds and 20 MB, and
the smallest usable rendition is stored (there is no ffmpeg here, so nothing is
re-encoded).

## 5. File naming

`public/media/<category>/<provider>-<id>.webp` (or `.mp4` / `.webm` for video,
`-poster.webp` for a video poster). The manifest key is
`<category>-<provider>-<id>`. Do not rename a file without updating its manifest
entry; the build script drops entries whose file is missing.

Owner photographs go in the same tree (`public/media/products/…`) but are normally
uploaded through admin, which stores a direct URL — those need no manifest entry.

## 6. The hero video

The manifest accepts `"kind": "video"` entries with an optional `poster`. A hero
video entry is any video asset with `"category": "hero"`. Until one exists, the
hero uses its photograph with the warm gradient overlay — never a broken frame.
Videos are muted, looped, `playsInline`, and paused for `prefers-reduced-motion`.

## 7. Replacing stock with the showroom's own photography

See [PHOTO_GUIDE.md](PHOTO_GUIDE.md) for shooting and bulk upload. When a real
photo replaces a stock file:

1. Upload it in admin (or drop it in `public/media/products/`).
2. Delete the stock file and its manifest entry.
3. Delete its row from `public/images/CREDITS.md` (the sync section rewrites
   itself on the next run).
4. `npm run build`.

No stock image may ever be presented as an item in stock, carry a product code, a
weight or a price.
