# Collection photography — 100 per section

The site sells **gold, silver and diamonds**. It should never show costume,
imitation, "fashion" alloy or museum pieces, which is what made the first image
pass look artificial.

## What the plan asks for

`src/lib/media/plan.ts` defines the whole library:

| Kind | Sets | Photographs each | Total |
|---|---|---|---|
| Collections | 7 | 100 | 700 |
| Popular designs | 12 | 6 | 72 |
| Occasions | 5 | 6 | 30 |
| **Total** | **24** | | **802** |

Collection sets: gold jewellery, gold coins, gold biscuits, silver jewellery,
diamond jewellery, fancy gold, gems/ratna.

## Every photograph passes a gate

A candidate is rejected when:

- its long edge is under **1200 px** (the largest Pixabay serves for most photos);
- the description mentions **costume, imitation, artificial, plastic, acrylic,
  toy, fake, rhinestone, brass, copper, museum, antique, vintage, painting,
  drawing, illustration, sketch, cartoon, clipart, render, 3D, mannequin**;
- it shows a **person** (bride, woman, girl, model, portrait, hand, wearing) —
  the photograph must show the piece;
- it does not name the **metal the set is about** (gold / silver / diamond /
  gemstone);
- its perceptual hash is within **6 bits** of any other photograph already
  shipped, which is what stops the same shot being reused across sets.

## Running it

```bash
# free keys, from pexels.com/api and pixabay.com/api/docs
# put them in .env.local (never commit it)
PEXELS_API_KEY=...
PIXABAY_API_KEY=...

npm run sync:collections -- --dry              # plan + current coverage
npm run sync:collections                        # fill every set
npm run sync:collections -- --only=gold-jewellery
```

Files are written to `public/media/<set>/<set>-001.webp`, converted to WebP at
1600 px, and appended to `public/media/manifest.json` with their provider,
creator, licence and source page. `/image-credits` renders that record.

The script exits cleanly with a coverage table when no key is present — a build
is never broken by a missing key, and no placeholder photograph is invented.

## Reality check

Free stock libraries do not hold 700 distinct, modern, studio-quality photographs
of Indian gold, silver and diamond jewellery. The plan sets 100 as the target and
stops at whatever passes the gate; the coverage table reports the real number per
set rather than padding it. The reliable route to a full catalogue is the
showroom's own photography: `catalogue/images/<product-id>/1.jpg`, which the
catalogue importer picks up and labels **In showroom**.


## What happened with a real stock key

A Pixabay key was supplied and the pipeline was run against it. The API answered
(200, ~200 candidates per query), but after the realism gate the survivors were
still wrong for this shop: a gold-tone crescent pendant with blue stones, a
fashion bangle on a wooden bowl, and bracelets photographed on jeans and a
camouflage jacket. The 63 survivors were reviewed and all were discarded rather
than published. Two lessons are now enforced in code:

- the description must contain a jewellery object (necklace, ring, bangle,
  chain, pendant, earring, anklet, mangalsutra, brooch);
- clothing and fashion contexts (jeans, denim, jacket, shirt, dress, outfit)
  are rejected, alongside seasonal decorations, watches, clocks and cosmetics.

The site therefore keeps its 33 curated photographs. Reaching 100 per section
still needs the showroom's own photography or a licensed Indian-jewellery
library; a general stock site does not contain it.
