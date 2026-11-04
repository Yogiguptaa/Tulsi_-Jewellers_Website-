/**
 * scripts/lib/catalogue-import.mjs — CSV → validated catalogue products.
 *
 * Plain JavaScript on purpose: the owner runs this with `node`, before any build,
 * on whatever Node version is installed. No app bundle, no network, no TypeScript
 * toolchain.
 *
 * WHAT IT REFUSES (each becomes a numbered error, and nothing is written)
 *   • a missing required column or an empty required value
 *   • a duplicate product id or slug (case-insensitive)
 *   • a duplicate supplier reference (the same design entered twice)
 *   • an unknown category, jewellery type, metal, purity, availability, gemstone
 *     or catalogue type — no silent fallback, because a fallback here would show
 *     the piece in the wrong place on the site
 *   • an image path that does not exist in /public, or a remote image host other
 *     than Cloudinary over https
 *   • an inspiration or supplier entry marked in stock, or carrying a fixed price
 *   • a supplier entry with no supplier name
 *   • a value still starting with "EXAMPLE" (a sample row left unedited)
 *
 * It never invents a fact: a blank Hindi field falls back to the English text, a
 * blank weight stays null.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const PROJECT_ROOT = path.resolve(HERE, "../..");
export const PUBLIC_DIR = path.join(PROJECT_ROOT, "public");

const VOCABULARY = JSON.parse(
  fs.readFileSync(path.join(PROJECT_ROOT, "src/lib/catalogue/vocabulary.json"), "utf8"),
);

export const REQUIRED_COLUMNS = [
  "product_id",
  "name_en",
  "description_en",
  "category",
  "type",
  "metal",
  "catalogue_type",
  "image_1",
];

const IMAGE_COLUMNS = ["image_1", "image_2", "image_3", "image_4", "image_5", "image_6"];
const ALLOWED_IMAGE_EXTENSIONS = [".webp", ".jpg", ".jpeg", ".png", ".avif"];
const MAX_IMAGE_BYTES = 600 * 1024;

const OPTIONAL_COLUMNS = [
  "name_hi",
  "description_hi",
  "slug",
  "style",
  "purity",
  "weight_grams",
  "stone_detail",
  "gemstone",
  "gender",
  "occasion",
  ...IMAGE_COLUMNS,
  "availability",
  "supplier_name",
  "supplier_ref",
  "supplier_url",
  "price_inr",
  "featured",
  "last_updated",
  "created_at",
];

/* -------------------------------------------------------------------------- */
/* CSV parsing                                                                */
/* -------------------------------------------------------------------------- */

/**
 * RFC 4180-style parser: quoted fields, commas and newlines inside quotes, and
 * "" as an escaped quote. Lines whose first cell starts with `#` are comments,
 * which is how the sample file explains itself.
 */
export function parseCsv(text) {
  const clean = text.replace(/^\uFEFF/, "");
  const rows = [];
  let field = "";
  let row = [];
  let inQuotes = false;

  for (let i = 0; i < clean.length; i += 1) {
    const char = clean[i];
    if (inQuotes) {
      if (char === '"') {
        if (clean[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }
    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char !== "\r") {
      field += char;
    }
  }
  row.push(field);
  rows.push(row);

  const records = rows.filter((cells) => cells.some((cell) => cell.trim() !== ""));
  const first = records.shift();
  if (!first) return { header: [], records: [] };

  const header = first.map((cell) => cell.trim().toLowerCase());
  const parsed = records
    .filter((cells) => !cells[0].trim().startsWith("#"))
    .map((cells, index) => {
      const values = {};
      header.forEach((key, position) => {
        values[key] = (cells[position] ?? "").trim();
      });
      return { line: index + 2, values };
    });

  return { header, records: parsed };
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

/** Lowercase a cell and unify separators, so "in stock" and "in-stock" agree. */
const normaliseToken = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");

/**
 * The allowed value matching a cell, treating "-" and "_" as the same
 * separator: "necklace_sets" and "necklace-sets" both resolve to the vocabulary's
 * own spelling, and "in-stock" resolves to "in_stock".
 */
function canonical(value, allowed) {
  const wanted = normaliseToken(value).replace(/_/g, "-");
  return allowed.find((entry) => entry.toLowerCase().replace(/_/g, "-") === wanted) ?? wanted;
}

const slugify = (value) =>
  String(value ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);

const todayIso = (now) => now.toISOString().slice(0, 10);

function isIsoDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function normalisePurity(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  if (/^925$/.test(raw)) return "925";
  if (/^\d{2}k$/i.test(raw)) return raw.toUpperCase();
  return raw.toLowerCase();
}

function truthy(value) {
  return ["true", "1", "yes", "y"].includes(normaliseToken(value));
}

/* -------------------------------------------------------------------------- */
/* Validation                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * @param {string} text raw CSV
 * @param {{ imagesRoot?: string, now?: Date }} [options]
 * @returns {{ products: object[], errors: {line: number|string, message: string}[], warnings: {line: number|string, message: string}[] }}
 */
export function validateRecords(text, options = {}) {
  const imagesRoot = options.imagesRoot ?? PUBLIC_DIR;
  const now = options.now ?? new Date();
  const errors = [];
  const warnings = [];

  const { header, records } = parseCsv(text);
  const fail = (line, message) => errors.push({ line, message });
  const warn = (line, message) => warnings.push({ line, message });

  if (header.length === 0) {
    fail("file", "the file is empty — the first row must be the column headings");
    return { products: [], errors, warnings };
  }

  const missing = REQUIRED_COLUMNS.filter((column) => !header.includes(column));
  if (missing.length > 0) {
    fail("header", `missing required column(s): ${missing.join(", ")}`);
    return { products: [], errors, warnings };
  }

  for (const column of header) {
    if (column && !REQUIRED_COLUMNS.includes(column) && !OPTIONAL_COLUMNS.includes(column)) {
      warn("header", `unknown column "${column}" is ignored (typo?)`);
    }
  }

  const products = [];
  const seenIds = new Set();
  const seenSlugs = new Set();
  const seenSupplierRefs = new Set();

  for (const { line, values } of records) {
    const get = (key) => (values[key] ?? "").trim();
    const rowErrors = [];
    const row = (message) => rowErrors.push(message);

    /* --- identity ------------------------------------------------------- */
    const id = get("product_id");
    if (!id) row("product_id is required");
    else if (!/^[A-Za-z0-9][A-Za-z0-9_-]{1,39}$/.test(id)) {
      row("product_id must be 2–40 letters, digits, hyphens or underscores (e.g. TJ-G-1001)");
    } else if (seenIds.has(id.toLowerCase())) {
      row(`duplicate product_id "${id}" — every piece needs its own id`);
    }

    const nameEn = get("name_en");
    if (!nameEn) row("name_en is required");
    else if (nameEn.length > 120) row("name_en is longer than 120 characters");

    const slug = get("slug") ? slugify(get("slug")) : slugify(nameEn || id);
    if (!slug) row("could not build a URL slug — add a slug column with plain English words");
    else if (seenSlugs.has(slug)) row(`duplicate slug "${slug}" — change the name or add a unique slug`);

    const descriptionEn = get("description_en").replace(/\s+/g, " ");
    if (!descriptionEn) row("description_en is required — describe the piece factually");
    else if (descriptionEn.length < 20) {
      row("description_en is too short to be useful (20 characters minimum)");
    } else if (descriptionEn.length > 700) row("description_en is longer than 700 characters");

    /* --- classification ------------------------------------------------- */
    const category = canonical(get("category"), VOCABULARY.collections);
    if (!VOCABULARY.collections.includes(category)) {
      row(`category must be one of: ${VOCABULARY.collections.join(", ")}`);
    }

    const type = canonical(get("type"), VOCABULARY.types);
    if (!VOCABULARY.types.includes(type)) {
      row(`type must be one of: ${VOCABULARY.types.join(", ")}`);
    }

    const metal = canonical(get("metal"), VOCABULARY.metals);
    if (!VOCABULARY.metals.includes(metal)) {
      row(`metal must be one of: ${VOCABULARY.metals.join(", ")}`);
    }

    const catalogueType = canonical(get("catalogue_type"), VOCABULARY.catalogueTypes);
    if (!VOCABULARY.catalogueTypes.includes(catalogueType)) {
      row(`catalogue_type must be one of: ${VOCABULARY.catalogueTypes.join(", ")}`);
    }

    const style = normaliseToken(get("style")).replace(/_/g, "-");
    if (style && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(style)) {
      row("style must be words joined by hyphens (temple, kundan, daily-wear)");
    }

    let purity = normalisePurity(get("purity"));
    if (purity && !VOCABULARY.purities.includes(purity)) {
      row(`purity must be one of: ${VOCABULARY.purities.join(", ")}`);
    }
    if (!purity && (metal === "gold" || metal === "silver")) {
      row(`purity is required for ${metal} — the showroom must state it, so it cannot be guessed`);
    }
    if (purity === "925" && metal !== "silver") row("purity 925 belongs to silver pieces only");

    const gemstone = canonical(get("gemstone"), VOCABULARY.gemstones);
    if (gemstone && !VOCABULARY.gemstones.includes(gemstone)) {
      row(`gemstone must be one of: ${VOCABULARY.gemstones.join(", ")}`);
    }

    const gender = canonical(get("gender") || "unisex", VOCABULARY.genders);
    if (!VOCABULARY.genders.includes(gender)) {
      row(`gender must be one of: ${VOCABULARY.genders.join(", ")}`);
    }

    const occasion = canonical(get("occasion") || "daily", VOCABULARY.occasions);
    if (!VOCABULARY.occasions.includes(occasion)) {
      row(`occasion must be one of: ${VOCABULARY.occasions.join(", ")}`);
    }

    /* --- measurements --------------------------------------------------- */
    let weightGrams = null;
    if (get("weight_grams")) {
      const parsed = Number(get("weight_grams"));
      if (!Number.isFinite(parsed) || parsed <= 0 || parsed > 100000) {
        row("weight_grams must be a positive number of grams");
      } else {
        weightGrams = Math.round(parsed * 1000) / 1000;
      }
    }

    /* --- images --------------------------------------------------------- */
    const imageKeys = [];
    for (const column of IMAGE_COLUMNS) {
      const value = get(column);
      if (!value) {
        if (column === "image_1") row("image_1 is required");
        continue;
      }
      if (value.startsWith("EXAMPLE")) {
        row(`${column} is still a sample value — point it at a real file`);
        continue;
      }
      if (/^https?:\/\//i.test(value)) {
        let url;
        try {
          url = new URL(value);
        } catch {
          row(`${column} is not a valid URL`);
          continue;
        }
        if (url.protocol !== "https:") {
          row(`${column} must use https (an http image would be blocked by the browser)`);
          continue;
        }
        if (!VOCABULARY.remoteImageHosts.includes(url.hostname)) {
          row(
            `${column} points at ${url.hostname}, which is not an allowed image host ` +
              `(${VOCABULARY.remoteImageHosts.join(", ")}). Download it into public/images/products/ instead.`,
          );
          continue;
        }
        if (
          /\/image\/upload\//.test(url.pathname) &&
          !/f_auto|q_auto/.test(url.search + url.pathname)
        ) {
          warn(line, `${column} has no f_auto/q_auto transformation — Cloudinary will serve a larger file`);
        }
        imageKeys.push(value);
        continue;
      }
      if (value.includes("..") || !value.startsWith("/")) {
        row(`${column} must start with / (e.g. /images/products/gold/TJ-G-1001-1.webp)`);
        continue;
      }
      const extension = path.extname(value).toLowerCase();
      if (!ALLOWED_IMAGE_EXTENSIONS.includes(extension)) {
        row(`${column} must be ${ALLOWED_IMAGE_EXTENSIONS.join(", ")}`);
        continue;
      }
      const absolute = path.join(imagesRoot, value);
      if (!absolute.startsWith(imagesRoot)) {
        row(`${column} escapes the public folder`);
        continue;
      }
      if (!fs.existsSync(absolute)) {
        row(`${column} not found: public${value}`);
        continue;
      }
      const size = fs.statSync(absolute).size;
      if (size > MAX_IMAGE_BYTES) {
        warn(line, `${column} is ${Math.round(size / 1024)} KB — resize it to under 600 KB for mobile`);
      }
      if (!/\.(webp|avif)$/i.test(extension)) {
        warn(line, `${column} is ${extension} — WebP loads faster and is the documented format`);
      }
      imageKeys.push(value);
    }

    /* --- provenance and availability ------------------------------------ */
    let availability = canonical(get("availability") || "on_enquiry", VOCABULARY.availability);
    if (!VOCABULARY.availability.includes(availability)) {
      row(`availability must be one of: ${VOCABULARY.availability.join(", ")}`);
    }
    if (catalogueType !== "showroom") {
      if (availability === "in_stock") {
        row(
          `a ${catalogueType} entry cannot be "in_stock" — only a piece physically in the showroom may say that`,
        );
      }
      availability = "on_enquiry";
    }

    const supplierName = get("supplier_name");
    const supplierRef = get("supplier_ref");
    const supplierUrl = get("supplier_url");
    if (catalogueType === "supplier" && !supplierName) {
      row("supplier_name is required for a supplier design");
    }
    if (catalogueType !== "supplier" && (supplierName || supplierRef)) {
      warn(line, "supplier fields are ignored unless catalogue_type is supplier");
    }
    if (supplierUrl) {
      try {
        if (new URL(supplierUrl).protocol !== "https:") row("supplier_url must use https");
      } catch {
        row("supplier_url is not a valid URL");
      }
    }
    if (catalogueType === "supplier" && supplierRef) {
      const key = `${supplierName.toLowerCase()}::${supplierRef.toLowerCase()}`;
      if (seenSupplierRefs.has(key)) {
        row(`duplicate supplier record ${supplierName} ${supplierRef} — the same design is listed twice`);
      }
      seenSupplierRefs.add(key);
    }

    /* --- price ---------------------------------------------------------- */
    let priceINR = null;
    if (get("price_inr")) {
      const parsed = Number(get("price_inr").replace(/[₹,\s]/g, ""));
      if (!Number.isFinite(parsed) || parsed <= 0) row("price_inr must be a positive number, or blank");
      else if (catalogueType !== "showroom") {
        row("an inspiration or supplier design may not carry a price");
      } else {
        priceINR = Math.round(parsed);
      }
    }

    /* --- dates ---------------------------------------------------------- */
    const lastUpdated = get("last_updated") || todayIso(now);
    if (!isIsoDate(lastUpdated)) row("last_updated must be a real date written as YYYY-MM-DD");
    const createdAtRaw = get("created_at");
    if (createdAtRaw && !isIsoDate(createdAtRaw)) {
      row("created_at must be a real date written as YYYY-MM-DD");
    }

    if (rowErrors.length > 0) {
      for (const message of rowErrors) fail(line, message);
      continue;
    }

    /* --- accept --------------------------------------------------------- */
    seenIds.add(id.toLowerCase());
    seenSlugs.add(slug);

    products.push({
      code: id,
      slug,
      name: { en: nameEn, hi: get("name_hi") || nameEn },
      description: { en: descriptionEn, hi: get("description_hi") || descriptionEn },
      categorySlug: category,
      type,
      style: style || null,
      metal,
      purity: purity || null,
      gender,
      occasion,
      weightGrams,
      gemstone: gemstone || null,
      stoneDetail: get("stone_detail") || null,
      priceType: priceINR !== null ? "fixed" : "on_enquiry",
      priceINR,
      availability,
      isFeatured: truthy(get("featured")),
      createdAt: `${createdAtRaw || lastUpdated}T00:00:00.000Z`,
      imageKeys,
      specs: [],
      catalogueType,
      supplier:
        catalogueType === "supplier"
          ? { name: supplierName, ref: supplierRef || null, url: supplierUrl || null }
          : null,
      lastUpdated,
    });
  }

  if (products.length === 0 && errors.length === 0) {
    warn("file", "no product rows — only an empty catalogue will be written (the site keeps its empty state)");
  }

  return { products, errors, warnings };
}

/** The exact file the site reads. `generatedAt` is bookkeeping, not content. */
export function buildProductFile(products, { source, now = new Date() } = {}) {
  return {
    version: 1,
    generatedAt: now.toISOString(),
    source: source ?? "content/catalogue/products.csv",
    products,
  };
}

/** True when the products in two catalogue files are identical. */
export function sameProducts(a, b) {
  return JSON.stringify(a?.products ?? []) === JSON.stringify(b?.products ?? []);
}
