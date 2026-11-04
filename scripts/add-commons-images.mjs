#!/usr/bin/env node
/**
 * scripts/add-commons-images.mjs
 *
 * The reviewed half of the Commons pipeline: an exact file title per key, a
 * licence check against Commons' own metadata, a download, and a manifest entry
 * with alt text written for a customer rather than copied from a filename.
 *
 * Every title here was chosen by eye from the search output of
 * `scripts/fetch-commons-media.mjs`; nothing is added that is not clearly a
 * photograph of real gold, silver, diamond or gem-set jewellery.
 *
 * Usage: node scripts/add-commons-images.mjs [--dry]
 */

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const API = "https://commons.wikimedia.org/w/api.php";
const UA =
  "TulsiJewellersMediaFetcher/1.0 (https://tulsijewellerswebsite.vercel.app; contact via site)";
const DRY = process.argv.includes("--dry");
const OUT_DIR = join(process.cwd(), "public", "media", "stock");
const MANIFEST = join(process.cwd(), "public", "media", "manifest.json");

const ITEMS = [
  {
    key: "jhumkaGold",
    title: "File:Jhumkas.jpg",
    category: "earrings",
    alt: { en: "Pair of traditional jhumka earrings", hi: "पारंपरिक झुमका के जोड़े" },
  },
  {
    key: "mangalsutraBeads",
    title: "File:Mangalsutra.png",
    category: "necklaces",
    alt: {
      en: "Mangalsutra of black beads with a gold pendant",
      hi: "सोने के पेंडेंट के साथ काले दानों का मंगलसूत्र",
    },
  },
  {
    key: "silverAnklets",
    title: "File:Anklet from India, 19th century, silver with gold wash, HAA.JPG",
    category: "silver",
    alt: {
      en: "Antique Indian silver anklet with a gold wash",
      hi: "सोने की परत वाली पुरानी भारतीय चांदी की पायल",
    },
  },
  {
    key: "diamondRingWhite",
    title: "File:Diamond ring by Ernst Vikne.jpg",
    category: "rings",
    alt: { en: "Gold ring set with a solitaire diamond", hi: "एक सॉलिटेयर हीरे जड़ी सोने की अंगूठी" },
  },
  {
    key: "emeraldRingGold",
    title: "File:Emerald and diamond ring.jpg",
    category: "gemstones",
    alt: {
      en: "Gold ring set with an emerald and diamonds",
      hi: "पन्ना और हीरे जड़ी सोने की अंगूठी",
    },
  },
  {
    key: "goldBiscuit",
    title: "File:Gold bullion 1.jpg",
    category: "coins",
    alt: { en: "Fine gold bullion bars", hi: "शुद्ध सोने की बिस्किट" },
  },
  {
    key: "bridalJewelleryIndia",
    title: "File:Bride by prakhar.jpg",
    category: "bridal",
    alt: {
      en: "Bride wearing traditional Indian gold jewellery",
      hi: "पारंपरिक भारतीय सोने के गहनों में दुल्हन",
    },
  },
  {
    key: "costumeJewellery1",
    title: "File:Vintage costume jewellery 01.jpg",
    category: "fancy",
    alt: {
      en: "Vintage costume jewellery necklace set with coloured stones",
      hi: "रंगीन पत्थरों वाला पुराना कॉस्ट्यूम ज्वेलरी नेकलेस सेट",
    },
  },
  {
    key: "costumeJewellery2",
    title: "File:Vintage costume jewellery 02.jpg",
    category: "fancy",
    alt: {
      en: "Vintage costume jewellery piece with a gold-tone setting",
      hi: "सुनहरी जड़ाई वाला पुराना कॉस्ट्यूम ज्वेलरी टुकड़ा",
    },
  },
  {
    key: "costumeJewellery3",
    title: "File:Vintage costume jewellery 03.jpg",
    category: "fancy",
    alt: {
      en: "Vintage costume jewellery earrings and pendant set",
      hi: "पुराना कॉस्ट्यूम ज्वेलरी झुमका और पेंडेंट सेट",
    },
  },
  {
    key: "toeRingsSilver",
    title: "File:Toe Rings (1800s) Unkown India 1916.229.jpg",
    category: "silver",
    alt: {
      en: "Set of Indian silver toe rings from the 1800s",
      hi: "1800 के दशक की भारतीय चांदी की बिछिया",
    },
  },
  {
    key: "kundanNecklaceMuseum",
    title: "File:British Museum The Islamic world Necklace Kundan India 21022019 7703.jpg",
    category: "necklaces",
    alt: {
      en: "Kundan-set Indian necklace with coloured stones",
      hi: "रंगीन पत्थरों से जड़ा भारतीय कुंदन हार",
    },
  },
  {
    key: "hansliNecklace",
    title:
      "File:Hansli (necklace), India, possibly Bikaner, Rajasthan, Mughal period, 18th century, gold, diamonds, pearls, enamel - Royal Ontario Museum - DSC04553.JPG",
    category: "necklaces",
    alt: {
      en: "Hansli necklace in gold with diamonds, pearls and enamel",
      hi: "हीरे, मोती और मीनाकारी वाला सोने का हंसली हार",
    },
  },
  {
    key: "goldNecklaceIndia",
    title:
      "File:Ceremonial welcome necklace given to First Lady Jacqueline Kennedy by Prime Minister Nehru during her state visit to India in 1962 (6).jpg",
    category: "necklaces",
    alt: {
      en: "Traditional Indian ceremonial gold necklace",
      hi: "पारंपरिक भारतीय सोने का औपचारिक हार",
    },
  },
];

const ALLOWED = /^(cc0|cc by(-sa)? \d|public domain|pd)/i;
const REFUSED = /\b(nc|nd)\b|non-?commercial|no-?deriv|fair use|copyright/i;

const text = (value) =>
  String(value ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();

async function imageInfo(title) {
  const url = `${API}?${new URLSearchParams({
    format: "json",
    action: "query",
    titles: title,
    prop: "imageinfo",
    iiprop: "url|size|extmetadata",
    iiurlwidth: "1600",
  })}`;
  const response = await fetch(url, { headers: { "User-Agent": UA } });
  if (!response.ok) throw new Error(`Commons answered ${response.status}`);
  const data = await response.json();
  const page = Object.values(data?.query?.pages ?? {})[0];
  if (!page || page.missing !== undefined) throw new Error("file not found on Commons");
  const info = page.imageinfo?.[0];
  if (!info) throw new Error("no image info");

  const meta = info.extmetadata ?? {};
  const license = text(meta.LicenseShortName?.value);
  if (!license || !ALLOWED.test(license) || REFUSED.test(license)) {
    throw new Error(`licence "${license}" is not usable commercially`);
  }
  return {
    info,
    page,
    license,
    creator: text(meta.Artist?.value) || "Unknown (Wikimedia Commons)",
    licenseUrl: meta.LicenseUrl?.value ? String(meta.LicenseUrl.value) : null,
  };
}

mkdirSync(OUT_DIR, { recursive: true });
const manifest = JSON.parse(readFileSync(MANIFEST, "utf8"));
let added = 0;

for (const item of ITEMS) {
  try {
    const { info, page, license, creator, licenseUrl } = await imageInfo(item.title);
    const thumb = info.thumburl ?? info.url;
    const ext = (thumb.match(/\.(jpe?g|png|webp)$/i)?.[1] ?? "jpg").toLowerCase().replace("jpeg", "jpg");
    const file = `${item.key}.${ext}`;

    console.log(`✓ ${item.key}: ${license} — ${creator}`);

    if (!DRY) {
      const response = await fetch(thumb, { headers: { "User-Agent": UA } });
      if (!response.ok) throw new Error(`download answered ${response.status}`);
      const bytes = Buffer.from(await response.arrayBuffer());
      writeFileSync(join(OUT_DIR, file), bytes);

      const entry = {
        key: item.key,
        src: `/media/stock/${file}`,
        width: info.thumbwidth ?? info.width,
        height: info.thumbheight ?? info.height,
        category: item.category,
        alt: item.alt,
        credit: {
          provider: "Wikimedia Commons",
          title: page.title,
          creator,
          license,
          licenseUrl,
          page: info.descriptionurl,
          sourceUrl: info.url,
        },
      };
      const index = manifest.assets.findIndex((asset) => asset.key === item.key);
      if (index >= 0) manifest.assets[index] = entry;
      else manifest.assets.push(entry);
      added += 1;
    }
  } catch (error) {
    console.log(`✗ ${item.key}: ${error.message}`);
  }
}

if (!DRY) {
  writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  console.log(`\nManifest now lists ${manifest.assets.length} assets (${added} from this run).`);
}
