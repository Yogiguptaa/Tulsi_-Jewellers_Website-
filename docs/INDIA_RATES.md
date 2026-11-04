# Indian rate basis — how to keep it correct

The site no longer publishes an international spot price converted to rupees. It
publishes an **Indian market benchmark** and derives every other purity from one
verified 24K figure.

## The one file the owner edits

`content/rates/india-benchmark.json`

```json
{
  "gold24kPer10g": 142024,
  "silverPerKg": 195719,
  "observedAt": "2026-10-26T18:00:00+05:30",
  "source": "MCX",
  "note": "…"
}
```

- `gold24kPer10g` — the Indian 24K (999) rate for **10 grams**, in rupees.
- `silverPerKg` — the Indian silver 999 rate for **one kilogram**, in rupees.
- `observedAt` — when *you* read that figure, with the IST offset (`+05:30`).
  This is the date shown to customers. Never put "now" or a future time.

Everything else is calculated, never typed:

| Purity | Calculation | From ₹1,42,024 |
|---|---|---|
| 24K / 999 | base | ₹1,42,024.00 |
| 22K / 916 | × 0.916 | ₹1,30,094.78 |
| 20K / 833 | × 0.833 | ₹1,18,305.99 |
| 18K / 750 | × 0.750 | ₹1,06,518.00 |
| 14K / 585 | × 0.585 | ₹83,084.04 |
| per gram (24K) | ÷ 10 | ₹14,202.40 |
| silver 999 / kg | base | ₹1,95,719.00 |
| silver 925 / kg | × 0.925 | ₹1,81,040.08 |

## What customers see

- Label, always: **“India market benchmark (MCX), INR. Showroom rates may differ slightly.”**
- The source and the `observedAt` date, in IST.
- If the figure is older than 36 hours: the value is still shown, marked as the
  last verified rate, with *“Please confirm today's rate at the store.”*
- If the file has no valid figure at all: *“Today's rate is being updated. Please
  call or WhatsApp us for the current rate.”* — never a zero, never a spot price.
- The word **“Live”** is never used: this is a published benchmark, not an
  intraday feed.

## Safety checks before anything is published

1. Both numbers must be positive and inside a wide plausible band (this catches a
   decimal-point slip and a pasted foreign-currency figure).
2. `observedAt` must be a real date that is not in the future.
3. The 24K figure is compared with the converted international spot value. If it
   is **more than 3% below** or **more than 30% above** that reference, the record
   is held for review and the previous value stays on the site.

## Daily routine (about 30 seconds)

1. Read the Indian 24K per-10-gram and silver per-kg figure from your bench
   reference (MCX / IBJA sheet).
2. Update the two numbers and `observedAt` in the JSON file.
3. Commit and push. Vercel rebuilds; the rates page and `/api/rates/latest`
   update on the next request.

## Why not an automatic Indian feed?

An Indian/MCX API requires a paid or registered key, and none is configured on
this deployment. Until one is, a single verified figure entered by the showroom
is the only honest source. When a key is available, add a provider under
`src/lib/rates/providers/` and select it with `RATE_PROVIDER` — the derivation,
reference check, labels and tests in `src/lib/rates/india.ts` stay exactly as
they are.

## International spot is still available — deliberately opt-in

Setting `RATE_PROVIDER=spot` (or `metalcharts` / `metalsdev` with their keys)
switches to the international basis. It is labelled as converted spot, carries
the “Indian market rates can differ” note, and is **never** selected by default
or as a fallback.
