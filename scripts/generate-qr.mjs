/**
 * scripts/generate-qr.mjs — branded QR code of the site URL, for the counter,
 * bills and the Google Business Profile.
 *
 *   node scripts/generate-qr.mjs https://your-domain.example
 *   npm run qr -- https://your-domain.example
 *
 * Without an argument it falls back to NEXT_PUBLIC_SITE_URL / SITE_URL from the
 * environment. There is no invented default: a QR pointing at an unconfirmed
 * domain would send customers nowhere.
 *
 * Output: public/qr/site.svg (vector, prints at any size) plus a small README
 * that records which URL the file encodes.
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import QRCode from "qrcode";

const argument = process.argv[2] ?? process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL ?? "";

let url;
try {
  url = new URL(argument.trim().replace(/\/$/, ""));
} catch {
  console.error(
    [
      "Usage: node scripts/generate-qr.mjs https://your-domain.example",
      "",
      "Pass the live site URL (no trailing slash). The script refuses to guess one.",
    ].join("\n"),
  );
  process.exit(1);
}

if (!/^https?:$/.test(url.protocol)) {
  console.error("The site URL must start with http:// or https://.");
  process.exit(1);
}

const dir = path.join(process.cwd(), "public/qr");
await mkdir(dir, { recursive: true });

const svg = await QRCode.toString(url.toString(), {
  type: "svg",
  errorCorrectionLevel: "M",
  margin: 1,
  width: 1024,
  color: { dark: "#4a0f0f", light: "#fffdf8" },
});

await writeFile(path.join(dir, "site.svg"), svg, "utf8");
await writeFile(
  path.join(dir, "README.md"),
  [
    "# QR code",
    "",
    `\`site.svg\` encodes: <${url.toString()}>`,
    "",
    "Regenerate whenever the domain changes:",
    "",
    "```bash",
    `node scripts/generate-qr.mjs ${url.toString()}`,
    "```",
    "",
    "Print it for the counter, the bill book and the Google Business Profile.",
    "It opens the home page; do not encode a product or rate page, which change.",
    "",
  ].join("\n"),
  "utf8",
);

console.log(`public/qr/site.svg → ${url.toString()}`);
