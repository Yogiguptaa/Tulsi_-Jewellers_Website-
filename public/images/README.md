# Photography: where files live and what size to shoot

The storefront's editorial photographs and short videos live in
`public/media/` and are listed in `public/media/manifest.json`. Components read
only that manifest; nothing is hotlinked from a stock library and no stock API is
called while a page is being viewed.

- Stock files: `public/media/stock/` (credited in `CREDITS.md` and on
  `/image-credits`).
- Synced Pexels/Pixabay files: `public/media/<category>/` (see
  [docs/MEDIA_GUIDE.md](../../docs/MEDIA_GUIDE.md)).
- The showroom's own product photos are uploaded in admin and served from
  Supabase Storage; they need no manifest entry.

## Sizes to shoot / export

| Where it appears | Recommended size | Notes |
| --- | --- | --- |
| Home hero | **1600 × 2000** (4:5) or 2000 × 1600 | The hero box is 4:5; keep the subject centred. |
| Collections index tiles | **1200 × 900** (4:3) | One per collection. |
| Product cards & product page | **1200 × 1500** (4:5) | Piece centred with margin. |
| Product gallery (extra angles) | 1200 × 1500 each | Up to 5 photos plus one short video. |
| Visit page / map area | 1600 × 1200 | Exterior or entrance, daylight. |

Rules of thumb:

- Portrait 4:5 for jewellery, landscape 4:3 for rooms and collections.
- Keep each photo under 300 KB after export; `next/image` re-encodes it anyway.
- Photograph on a plain warm background (cream cloth, dark wood), in daylight,
  with a clean lens and no filters.
- Alt text is mandatory for every product photo — describe the piece, not the
  file name.

Full instructions: [docs/PHOTO_GUIDE.md](../../docs/PHOTO_GUIDE.md).
