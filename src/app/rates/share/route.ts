/**
 * GET /rates/share — the branded "today's rate" card, as an SVG image.
 *
 * Served only when a verified rate exists. Each line carries its source, date
 * and time (IST), unit and purity, and the mandatory wording for the active feed,
 * because an image forwarded on WhatsApp has to be every bit as honest as the
 * page it came from. With nothing recorded it returns 404 rather than a card with
 * a blank or zero value.
 *
 * WHY SVG, NOT A PNG
 * ──────────────────
 * This route used to draw the card with `next/og` (Satori + resvg). That library
 * ships its own font and a WASM rasteriser, which the Cloudflare Workers bundle
 * turns into binary modules this host cannot deploy. SVG needs neither: every
 * string here is text laid out by the reader's own browser, so the card stays a
 * real image (it opens and saves as one) while the Worker stays text-only. The
 * numbers, sources, timestamps and disclaimer are unchanged.
 */

import { getRatesSnapshot } from "@/lib/rates/service";
import { formatDateTime } from "@/lib/rates/format";
import { SITE, RATE_DISCLAIMER, CONTACT, telDisplay } from "@/lib/config";

const WIDTH = 1080;
const HEIGHT = 1350;

/** Escape text for XML: an ampersand in a shop name must not break the document. */
function xml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Keep one long source name from running into the amount column. */
function clip(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

export async function GET() {
  const snapshot = await getRatesSnapshot();
  const rows = snapshot.lines.filter((line) => line.latest && line.latest.rate > 0);

  if (snapshot.status === "unavailable" || rows.length === 0 || !snapshot.asOf) {
    return new Response(
      "No verified rate is recorded right now, so there is no card to share. Check the rates page.",
      { status: 404, headers: { "content-type": "text/plain; charset=utf-8" } },
    );
  }

  const shown = rows.slice(0, 5);
  const unit = (line: (typeof shown)[number]) =>
    line.row.unit === "INR_PER_KG" ? "per kg" : "per 10 g";
  const rupees = (value: number) =>
    new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(value);

  const rowTop = 430;
  const rowHeight = 132;
  const rowGap = 18;

  const cards = shown
    .map((line, index) => {
      const y = rowTop + index * (rowHeight + rowGap);
      return `
    <g>
      <rect x="56" y="${y}" width="${WIDTH - 112}" height="${rowHeight}" fill="#fffdf8" stroke="#b8923a" stroke-opacity="0.45" />
      <text x="86" y="${y + 56}" font-size="34" fill="#1f1b16">${xml(line.row.purityLabel)}</text>
      <text x="86" y="${y + 92}" font-size="20" fill="#1f1b16" fill-opacity="0.7">${xml(
        `${unit(line)} · ${line.latest?.source ?? ""}`,
      )}</text>
      <text x="${WIDTH - 86}" y="${y + 72}" font-size="38" fill="#5a0f1b" text-anchor="end">₹ ${rupees(
        line.latest!.rate,
      )}</text>
    </g>`;
    })
    .join("");

  const footerTop = rowTop + shown.length * (rowHeight + rowGap) + 24;
  const note = snapshot.customerNote
    ? `<text x="56" y="${footerTop + 24}" font-size="20" fill="#1f1b16" fill-opacity="0.85">${xml(
        clip(snapshot.customerNote, 84),
      )}</text>`
    : "";

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" role="img" aria-label="${xml(
    "Today's gold and silver rates",
  )}">
  <rect width="${WIDTH}" height="${HEIGHT}" fill="#faf6ee" />
  <rect x="56" y="56" width="76" height="76" rx="14" fill="#5a0f1b" />
  <text x="94" y="108" font-size="40" fill="#e8d9ae" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif">Tj</text>
  <text x="152" y="96" font-size="40" fill="#5a0f1b" font-family="Georgia, 'Times New Roman', serif">${xml(
    SITE.name.hi,
  )}</text>
  <text x="152" y="126" font-size="22" letter-spacing="4" fill="#7a5c1c">${xml(
    SITE.name.en.toUpperCase(),
  )}</text>

  <text x="56" y="268" font-size="30" letter-spacing="2" fill="#7a5c1c">TODAY&apos;S RATES</text>
  <text x="56" y="310" font-size="26" fill="#1f1b16" fill-opacity="0.7">${xml(
    `${snapshot.spotConverted ? "Latest available rate" : "Latest published rate"} · ${formatDateTime(
      snapshot.asOf,
      "en",
    )}`,
  )}</text>
  <line x1="56" y1="352" x2="${WIDTH - 56}" y2="352" stroke="#b8923a" stroke-opacity="0.4" />
  ${cards}
  ${note}
  <text x="56" y="${footerTop + 72}" font-size="18" fill="#1f1b16" fill-opacity="0.7">${xml(
    clip(RATE_DISCLAIMER, 96),
  )}</text>
  <text x="56" y="${footerTop + 118}" font-size="22" fill="#5a0f1b">${xml(
    `${SITE.baseUrl.replace(/^https?:\/\//, "")} · ${telDisplay(CONTACT.primaryPhone)}`,
  )}</text>
</svg>`;

  return new Response(svg, {
    headers: {
      "content-type": "image/svg+xml; charset=utf-8",
      // A card is only as fresh as the value on it, so it is never cached.
      "cache-control": "no-store",
    },
  });
}
