# Google Business Profile — setup and reviews

Most customers looking for a jeweller in Nagpur start on Google Maps, not on the
website. A complete, consistent profile is worth more than any on-page keyword.

The name, address and phone below are the only ones the site publishes
(`src/lib/config.ts`). Use exactly the same spelling and spacing everywhere: a
mismatch between the site, the profile and the directories splits your local
ranking.

| Field | Value |
| --- | --- |
| Name | Tulsi Jewellers |
| Address | Plot No. 410, Near Radha Krishna Mandir, Old Bhandara Road, Hansapuri, Nagpur, Maharashtra 440018 |
| Phone | 7558220117 |
| WhatsApp | 8766693614 |
| Hours | Monday–Saturday 10:30 am – 9:00 pm; Sunday closed |
| Website | your live domain (from `NEXT_PUBLIC_SITE_URL`) |
| Category | Jewellery store |
| Established | 1990 |

⚠️ Confirm the address, hours and established year against the signboard and your
own records before publishing. If any of them is different, change
`src/lib/config.ts` and the Google profile together — the site's "Open now"
indicator reads the same hours.

## 1. Claim or create the profile

1. Go to <https://business.google.com> and sign in with the shop's Google account
   (not a personal one you might lose access to).
2. Search for "Tulsi Jewellers, Hansapuri, Nagpur".
   - **Found it** → *Claim this business* → verification by postcard, phone or video.
   - **Not found** → *Add your business* and enter the table above exactly.
3. Verification: Google usually offers a video recording of the shopfront, the
   signboard and the interior. Have the signboard clean and lit; record in daylight.
4. Wait for "Verified". Do not create a second profile while waiting — duplicates
   are the most common reason a profile gets suspended.

## 2. Complete every section

- **Category**: primary *Jewellery store*. Add secondary categories only if true:
  *Gold dealer*, *Jewellery designer*, *Diamond dealer*, *Watch store* (only if you
  sell watches).
- **Attributes**: "In-store shopping", "Delivery" only if you truly deliver inside
  Nagpur, "Wheelchair-accessible entrance" only if the entrance is step-free.
- **Hours**: the same as above, including Sunday closed. Add special hours for
  festivals rather than changing the regular hours.
- **From the business**: a short, factual description — gold, silver, fancy
  jewellery, gold coins and biscuits, gemstones, a monthly saving scheme from
  ₹499, in Hansapuri since 1990. No superlatives.
- **Photos** (upload at least 10, replace seasonally):
  - exterior with the signboard (daylight, straight on)
  - interior wide shot and 2–3 display counters
  - 5–8 close-ups of real pieces (your own photos, not stock)
  - the owner or staff at the counter, if they consent
  - a short video (10–20 s) panning the showroom
- **Products**: add a few real categories with a photo and "Price on enquiry" —
  never a price you cannot honour.
- **Services**: gold saving scheme, gold/silver buy-back if offered, repairs if
  offered.
- **Website**: the live domain. Add the WhatsApp link as the messaging option.
- **Booking**: leave off unless you actually take appointments.

## 3. Reviews — the honest way

The site does not publish invented reviews, and neither should the profile.

- Ask a customer at the counter after a purchase: "If you were happy, a Google
  review helps other families find us."
- Show a QR code of the review link at the counter (Google Business Profile →
  **Ask for reviews** gives a short link). The site's own QR
  (`public/qr/site.svg`) opens the home page, not the review form.
- Never offer a discount, gift or entry into a draw for a review — Google removes
  such reviews and can suspend the profile.
- Reply to every review, positive or not, within a few days. Keep replies short and
  factual; do not argue.
- Do not buy reviews or ask staff and relatives to post them.

## 4. Posts and updates

Post once or twice a month: a new collection, festival timings, the scheme, a
behind-the-counter photo. Each post should be true on the day it is published and
should link to the website page that answers the question (rates → `/rates`,
scheme → `/gold-saving-scheme`, visit → `/visit-us`).

## 5. Keep it consistent

Update these whenever the phone, hours or address changes:

1. `src/lib/config.ts` (phone, address, hours, `HOURS_SCHEDULE`)
2. Google Business Profile
3. The site's footer, `/contact`, `/visit-us` (all read from config)
4. Any printed board or bill

Run `npm run check:placeholders` and `npm run build` after a config change.
