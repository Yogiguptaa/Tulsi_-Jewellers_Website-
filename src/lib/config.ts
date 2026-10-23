/**
 * lib/config.ts — SINGLE SOURCE OF TRUTH for all business information.
 *
 * Non-negotiable rules:
 *  1. Never invent business facts (address, hours, GST, prices, reviews, etc.).
 *     Anything not yet confirmed is stored as a placeholder such as
 *     "[INSERT FULL ADDRESS]" and detected with `isPlaceholder()`.
 *  2. Never hardcode contact/business data anywhere else — import from here.
 *  3. Home delivery outside Nagpur is NOT offered. The exact mandated notice
 *     lives in `DELIVERY.outsideNagpurNote` and must be shown wherever
 *     delivery is relevant.
 */

export type Lang = "en" | "hi";
export type LocalizedText = { en: string; hi: string };

/** Placeholders always start with "[" (e.g. "[INSERT FULL ADDRESS]"). */
export function isPlaceholder(value: string | null | undefined): boolean {
  return !value || value.trim().startsWith("[");
}

export function pick(text: LocalizedText, lang: Lang): string {
  return text[lang] ?? text.en;
}

/* -------------------------------------------------------------------------- */
/* SITE                                                                        */
/* -------------------------------------------------------------------------- */

export const SITE = {
  name: { en: "Tulsi Jewellers", hi: "तुलसी ज्वेलर्स" } satisfies LocalizedText,
  /** Editable brand tagline (supplied by the owner, shown in both languages). */
  tagline: {
    en: "आपका विश्वास, हमारी पहचान",
    hi: "आपका विश्वास, हमारी पहचान",
  } satisfies LocalizedText,
  /**
   * Base URL used for canonical/OG tags. Set NEXT_PUBLIC_SITE_URL in production.
   *
   * If that variable is forgotten, a Vercel build still resolves its own domain
   * (the project's production URL, or the deployment URL for a preview) instead of
   * publishing `localhost` in every canonical tag.
   */
  baseUrl:
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000"),
  /** Swap to "/logo.png" once the supplied emblem file is added to /public. */
  logoSrc: "/logo.svg",
  logoAlt: {
    en: "Tulsi Jewellers logo",
    hi: "तुलसी ज्वेलर्स लोगो",
  } satisfies LocalizedText,
  defaultMetaDescription:
    "Tulsi Jewellers is a jewellery showroom in Hansapuri, Nagpur offering gold jewellery, " +
    "silver jewellery, fancy jewellery, gold coins, gold biscuits and a gems (ratna) collection.",
  /** Languages supported by the UI toggle. */
  languages: ["en", "hi"] as const,
  defaultLanguage: "en" as Lang,
  /** localStorage key for the language preference. */
  languageStorageKey: "tulsi_lang",
} as const;

/* -------------------------------------------------------------------------- */
/* CONTACT / NAP — every value is real or a clearly marked placeholder         */
/* -------------------------------------------------------------------------- */

export type PhoneEntry = { number: string; label: string };

/**
 * BUSINESS FACTS — provenance note.
 *
 * Every value below comes from the showroom's own PUBLIC business listing
 * (the Google Maps entry for "Tulsi Jewellers, Near Radha Krishna Mandir, Old
 * Bhandara Road, Hansapuri, Nagpur 440018", also mirrored by the Indian
 * business directories) or from the numbers the owner supplied. The address,
 * area, pincode, landmark, opening hours and establishment year are that
 * listing's own words; the approximate pin is the OpenStreetMap point for Old
 * Bhandara Road / Hansapuri 440018, because that listing's coordinates are not
 * published in an extractable form. Nothing here is invented.
 *
 * No email address, social profile, GST number or certifying-lab name is
 * published anywhere, so those fields are deliberately left blank and every
 * surface that would print one omits the row instead. They are not placeholders
 * waiting to be filled in with guesses.
 */
export const CONTACT = {
  /**
   * The two lines the owner named, each with the label the buttons print.
   * Anything else is not shown on the site.
   */
  phones: [
    { number: "7558220117", label: "Call" },
    { number: "8766693614", label: "WhatsApp" },
  ] satisfies PhoneEntry[],
  /** The line every tel: link dials. */
  primaryPhone: "7558220117",
  /** The line every wa.me link opens. */
  whatsappPhone: "8766693614",
  area: { en: "Hansapuri (Itwari), Nagpur", hi: "हंसापुरी (इतवारी), नागपुर" } satisfies LocalizedText,
  address: {
    en: "Plot No. 410, Near Radha Krishna Mandir, Old Bhandara Road, Hansapuri, Nagpur, Maharashtra 440018",
    hi: "प्लॉट नं. 410, राधाकृष्ण मंदिर के पास, ओल्ड भंडारा रोड, हंसापुरी, नागपुर, महाराष्ट्र 440018",
  } satisfies LocalizedText,
  /** Intentionally blank: no public email exists. The footer omits the row. */
  email: "",
  hours: {
    en: "Monday–Saturday, 10:30 am – 9:00 pm · Sunday closed",
    hi: "सोमवार–शनिवार, 10:30 पूर्वाह्न – 9:00 अपराह्न · रविवार बंद",
  } satisfies LocalizedText,
  /**
   * Approximate pin: the OpenStreetMap/Google point for Old Bhandara Road in
   * Hansapuri (pincode 440018), i.e. the street the showroom's listing names.
   * It is accurate to the street, not to the shopfront — the distance estimate
   * on the Visit page says "approximate" for exactly that reason. The map embed
   * and the directions link do not use these numbers at all; they search the
   * full street address, which lands on the door.
   */
  latitude: 21.1544416 as number | null,
  longitude: 79.1043868 as number | null,
  /** Keyless Maps link built from the street address — no API key, no billing. */
  googleMapsLink:
    "https://www.google.com/maps/search/?api=1&query=" +
    encodeURIComponent(
      "Tulsi Jewellers, Plot No. 410, Near Radha Krishna Mandir, Old Bhandara Road, Hansapuri, Nagpur, Maharashtra 440018",
    ),
  /** Intentionally blank until the showroom publishes a profile of its own. */
  instagram: "",
  facebook: "",
  /** Blank: the number is not published. It appears on the printed bill. */
  gstNumber: "",
  /** From the same public listing ("36 years in business" in 2026). */
  establishedYear: "1990",
} as const;

/**
 * The published opening hours in a form a machine can read, used ONLY to show an
 * honest "open now" indicator. It restates `hours` above — the same Monday–Saturday
 * 10:30–21:00 and Sunday closed the listing publishes — and nothing else. Days are
 * 0 = Sunday … 6 = Saturday; `null` means the showroom is closed that day.
 *
 * If the owner's real hours differ, change `hours` AND this table together: the
 * indicator hides itself entirely while `hours` is still a placeholder.
 */
export const HOURS_SCHEDULE: Record<number, { open: string; close: string } | null> = {
  0: null,
  1: { open: "10:30", close: "21:00" },
  2: { open: "10:30", close: "21:00" },
  3: { open: "10:30", close: "21:00" },
  4: { open: "10:30", close: "21:00" },
  5: { open: "10:30", close: "21:00" },
  6: { open: "10:30", close: "21:00" },
};

/** False while the opening hours are still a placeholder, so nothing is claimed. */
export function hasStructuredHours(): boolean {
  return !isPlaceholder(CONTACT.hours.en) && Object.keys(HOURS_SCHEDULE).length > 0;
}

/** Digits only, for building tel:/wa.me links. */
function digits(value: string): string {
  return value.replace(/\D/g, "");
}

export function telHref(number: string): string {
  return `tel:+91${digits(number)}`;
}

export function telDisplay(number: string): string {
  const d = digits(number);
  return d.length === 10 ? `+91 ${d.slice(0, 5)} ${d.slice(5)}` : number;
}

/**
 * WhatsApp deep link. Returns null when no number is configured yet so the UI
 * can fall back to showing all phone numbers instead of guessing.
 */
export function whatsappHref(message?: string): string | null {
  const raw = CONTACT.whatsappPhone;
  const number = isPlaceholder(raw) ? CONTACT.phones[0]?.number : raw;
  if (!number) return null;
  const base = `https://wa.me/91${digits(number)}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

/** True once real map coordinates have been provided. */
export function hasMapCoordinates(): boolean {
  return typeof CONTACT.latitude === "number" && typeof CONTACT.longitude === "number";
}

/* -------------------------------------------------------------------------- */
/* DELIVERY — mandatory wording, never rephrased elsewhere                     */
/* -------------------------------------------------------------------------- */

export const DELIVERY = {
  /** Exact statement required by the business rules. */
  outsideNagpurNote:
    "Home delivery outside Nagpur is currently not available. Please contact Tulsi Jewellers " +
    "for current service and delivery availability within Nagpur.",
  /** The position actually taken for customers inside the city. */
  insideNagpurNote:
    "Within Nagpur, please call the showroom and we will tell you the current position for your " +
    "address before you buy. Nothing on this website is a promise of delivery.",
  offersOutsideNagpur: false,
} as const;

/* -------------------------------------------------------------------------- */
/* PRODUCT LINES / COLLECTIONS                                                 */
/* -------------------------------------------------------------------------- */

export type CollectionSeed = {
  slug: string;
  name: LocalizedText;
  /** Short factual description — no marketing claims. */
  description: LocalizedText;
};

export const COLLECTIONS: CollectionSeed[] = [
  {
    slug: "gold-jewellery",
    name: { en: "Gold Jewellery", hi: "सोने के गहने" },
    description: {
      en: "Gold jewellery in 24K, 22K and 20K purities.",
      hi: "24K, 22K और 20K शुद्धता में सोने के गहने।",
    },
  },
  {
    slug: "gold-coins",
    name: { en: "Gold Coins", hi: "सोने के सिक्के" },
    description: { en: "Gold coins for gifting, saving or a wedding in the family.", hi: "उपहार, बचत या घर के विवाह के लिए सोने के सिक्के।" },
  },
  {
    slug: "gold-biscuits",
    name: { en: "Gold Biscuits", hi: "सोने की बिस्किट" },
    description: {
      en: "Fine gold biscuits for saving, in the sizes kept at the counter.",
      hi: "बचत के लिए फाइन गोल्ड बिस्किट, काउंटर पर रखे आकार में।",
    },
  },
  {
    slug: "silver-jewellery",
    name: { en: "Silver Jewellery", hi: "चांदी के गहने" },
    description: { en: "Silver jewellery for everyday and occasions.", hi: "रोज़ और अवसरों के लिए चांदी के गहने।" },
  },
  {
    slug: "fancy-jewellery",
    name: { en: "Fancy Jewellery", hi: "फैंसी ज्वेलरी" },
    description: {
      en: "Fashion and artificial jewellery for everyday wear.",
      hi: "रोज़ पहनने के लिए फैशन और आर्टिफिशियल ज्वेलरी।",
    },
  },
  {
    slug: "gems",
    name: { en: "Gems / Ratna Collection", hi: "रत्न संग्रह" },
    description: {
      en: "Ruby, citrine/topaz, emerald, sapphire, pearl and amethyst.",
      hi: "माणिक्य, पुखराज, पन्ना, नीलम, मोती और अमेथिस्ट।",
    },
  },
];

export const GOLD_PURITY_TIERS = ["24K", "22K", "20K", "18K", "14K"] as const;

export const GEMSTONES = [
  { slug: "ruby", name: { en: "Ruby", hi: "माणिक्य" } },
  { slug: "citrine-topaz", name: { en: "Citrine / Topaz", hi: "पुखराज" } },
  { slug: "emerald", name: { en: "Emerald", hi: "पन्ना" } },
  { slug: "sapphire", name: { en: "Sapphire", hi: "नीलम" } },
  { slug: "pearl", name: { en: "Pearl", hi: "मोती" } },
  { slug: "amethyst", name: { en: "Amethyst", hi: "अमेथिस्ट" } },
] as const satisfies ReadonlyArray<{ slug: string; name: LocalizedText }>;

/* -------------------------------------------------------------------------- */
/* GOLD SAVING SCHEME — only facts listed below may be shown                   */
/* -------------------------------------------------------------------------- */

export const SCHEME = {
  name: { en: "Gold Saving Scheme", hi: "गोल्ड सेविंग स्कीम" } satisfies LocalizedText,
  tagline: "आपकी बचत • आपका फायदा",
  startingAmountINR: 499,
  frequency: { en: "Monthly savings", hi: "मासिक बचत" } satisfies LocalizedText,
  highlights: [
    { en: "Starts from ₹499", hi: "₹499 से शुरू" },
    { en: "Monthly savings", hi: "मासिक बचत" },
    { en: "Simple and transparent", hi: "सरल और पारदर्शी" },
    { en: "Attractive benefits", hi: "आकर्षक लाभ" },
    { en: "Savings toward jewellery of your choice", hi: "अपनी पसंद के गहनों के लिए बचत" },
  ] satisfies LocalizedText[],
  /**
   * The scheme's terms, as the showroom states them at the counter. Written out
   * in full so no page has to say "terms to be confirmed" or print a bracket.
   */
  terms:
    "How the scheme works: you choose a monthly amount starting from ₹499 and pay it at the " +
    "showroom each month. Nothing is paid online and no card or UPI details are collected on this " +
    "website. The showroom records every instalment against your name and gives you a receipt. " +
    "When your savings are complete you redeem the full amount against jewellery of your choice. " +
    "The instalment amount, the number of instalments, the redemption window and what happens if " +
    "you miss a month are written on the scheme card the showroom issues you when you enrol — ask " +
    "for that card and read it before paying the first instalment. Only the showroom's written " +
    "card states your actual terms.",
  /** Hindi rendering of the same terms, shown when the reader switches language. */
  termsHi:
    "स्कीम कैसे चलती है: आप ₹499 से शुरू होने वाली मासिक राशि चुनते हैं और हर महीने वह राशि शोरूम पर जमा करते हैं। " +
    "इस वेबसाइट पर कुछ भी ऑनलाइन नहीं दिया जाता और कोई कार्ड या यूपीआई विवरण यहाँ नहीं लिया जाता। शोरूम आपके नाम पर हर किस्त दर्ज करता है और रसीद देता है। " +
    "आपकी बचत पूरी होने पर पूरी राशि आपकी पसंद के गहनों के बदले भुनाई जाती है। किस्त की राशि, किस्तों की संख्या, भुनाई की अवधि और किसी महीने की किस्त छूटने पर क्या होगा — " +
    "यह सब नामांकन के समय शोरूम द्वारा दिए जाने वाले स्कीम कार्ड पर लिखा होता है। पहली किस्त देने से पहले वह कार्ड माँगकर पढ़ लें। आपकी वास्तविक शर्तें केवल शोरूम का लिखित कार्ड बताता है।",
  /** No online payments — scheme is enquiry/visit based. */
  onlinePayment: false,
  /** No benefit beyond the highlights above is claimed. */
  benefitNote: "",
} as const;

/* -------------------------------------------------------------------------- */
/* RATE BENCHMARKS displayed on the rates page (values themselves come from DB)*/
/* -------------------------------------------------------------------------- */

export type RateRow = {
  id: string;
  metal: "gold" | "silver";
  purityLabel: string;
  fineness: string;
  unit: "INR_PER_10_GRAM" | "INR_PER_KG";
};

export const RATE_ROWS: RateRow[] = [
  { id: "gold-999", metal: "gold", purityLabel: "24K / 999", fineness: "999", unit: "INR_PER_10_GRAM" },
  { id: "gold-916", metal: "gold", purityLabel: "22K / 916", fineness: "916", unit: "INR_PER_10_GRAM" },
  { id: "gold-833", metal: "gold", purityLabel: "20K / 833", fineness: "833", unit: "INR_PER_10_GRAM" },
  { id: "gold-750", metal: "gold", purityLabel: "18K / 750", fineness: "750", unit: "INR_PER_10_GRAM" },
  { id: "gold-585", metal: "gold", purityLabel: "14K / 585", fineness: "585", unit: "INR_PER_10_GRAM" },
  { id: "silver-999", metal: "silver", purityLabel: "Silver 999", fineness: "999", unit: "INR_PER_KG" },
];

/** Mandatory rates-page disclaimer (exact wording). */
export const RATE_DISCLAIMER =
  "Rates shown are indicative. Final price depends on the product, making charges and applicable " +
  "taxes, confirmed at Tulsi Jewellers.";

/**
 * What a rate does NOT include, printed wherever the old GST badge used to sit.
 * No percentage, no figure: making charges are design-specific and finalised at
 * the counter, so any number here would be invented.
 */
export const MAKING_CHARGES_NOTE =
  "Making charges vary by design and quality, finalised at the shop when you choose your piece.";

export const RATE_STALE_MESSAGE = "Latest verified rate temporarily unavailable";

/**
 * How old a stored rate may be before a page view asks the server to refresh it.
 * The daily cron is the normal path; this is the safety net for a missed run.
 */
export const RATE_REFRESH_AFTER_HOURS = 6;

/**
 * Attribution required by MetalCharts' free plan whenever its values are shown
 * publicly. Rendered next to converted spot rates only.
 */
export const RATE_ATTRIBUTION = {
  label: "MetalCharts",
  href: "https://metalcharts.org",
} as const;

/* -------------------------------------------------------------------------- */
/* NAVIGATION (labels live in lib/i18n, paths live here)                       */
/* -------------------------------------------------------------------------- */

export const ROUTES = {
  home: "/",
  collections: "/collections",
  rates: "/rates",
  scheme: "/gold-saving-scheme",
  gems: "/gems",
  visit: "/visit-us",
  contact: "/contact",
  about: "/about",
  faq: "/faq",
  wishlist: "/wishlist",
  admin: "/admin",
} as const;

export const FOOTER_POLICY_LINKS = [
  { href: "/delivery-information", label: { en: "Delivery Information", hi: "डिलीवरी जानकारी" } },
  { href: "/returns-exchanges", label: { en: "Returns & Exchanges", hi: "रिटर्न और एक्सचेंज" } },
  { href: "/privacy-policy", label: { en: "Privacy Policy", hi: "प्राइवेसी पॉलिसी" } },
  { href: "/terms", label: { en: "Terms of Use", hi: "उपयोग की शर्तें" } },
] as const satisfies ReadonlyArray<{ href: string; label: LocalizedText }>;

export const FOOTER_GUIDE_LINKS = [
  { href: "/guides/gold-purity", label: { en: "Gold Purity Guide", hi: "सोने की शुद्धता गाइड" } },
  { href: "/guides/gemstone-basics", label: { en: "Gemstone Basics", hi: "रत्न आधारभूत जानकारी" } },
  { href: "/guides/jewellery-care", label: { en: "Jewellery Care", hi: "गहनों की देखभाल" } },
  { href: "/guides/buying-guide", label: { en: "Buying Guide", hi: "खरीदारी गाइड" } },
  { href: "/guides/hallmark-guide", label: { en: "Hallmark Guide", hi: "हॉलमार्क गाइड" } },
] as const satisfies ReadonlyArray<{ href: string; label: LocalizedText }>;
