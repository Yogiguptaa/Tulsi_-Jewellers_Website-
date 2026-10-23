/**
 * catalogue/jewel-types.ts — the /jewellery/<slug> landing pages.
 *
 * Each entry is either a physical item `type`, a `gender` group or an `occasion`
 * group; `kind` tells the selector which field to match on.
 */

import type { LocalizedText } from "@/lib/config";

export type JewelTypeKind = "type" | "gender" | "occasion";

export type JewelTypePage = {
  slug: string;
  kind: JewelTypeKind;
  name: LocalizedText;
  /** Shown under the page title — a factual description of the category. */
  description: LocalizedText;
  /** Chrome label used on chips/breadcrumbs. */
  chip: LocalizedText;
};

export const JEWEL_TYPES: JewelTypePage[] = [
  {
    slug: "rings",
    kind: "type",
    name: { en: "Rings", hi: "अंगूठी" },
    chip: { en: "Rings", hi: "अंगूठी" },
    description: {
      en: "Gold, silver and gemstone rings from the showroom collection.",
      hi: "शोरूम संग्रह से सोने, चांदी और रत्नों की अंगूठियाँ।",
    },
  },
  {
    slug: "necklaces",
    kind: "type",
    name: { en: "Necklaces", hi: "हार" },
    chip: { en: "Necklaces", hi: "हार" },
    description: {
      en: "Necklaces and haar styles for daily wear and occasions.",
      hi: "रोज़ और अवसरों के लिए हार व हार शैलियाँ।",
    },
  },
  {
    slug: "earrings",
    kind: "type",
    name: { en: "Earrings", hi: "कान की बालियाँ" },
    chip: { en: "Earrings", hi: "बालियाँ" },
    description: {
      en: "Studs, jhumka and traditional earring styles.",
      hi: "स्टड, झुमके और पारंपरिक बालियाँ।",
    },
  },
  {
    slug: "bangles",
    kind: "type",
    name: { en: "Bangles", hi: "चूड़ियाँ" },
    chip: { en: "Bangles", hi: "चूड़ियाँ" },
    description: {
      en: "Bangle sets and pairs in gold, silver and fashion ranges.",
      hi: "सोने, चांदी और फैशन रेंज में चूड़ियाँ।",
    },
  },
  {
    slug: "bracelets",
    kind: "type",
    name: { en: "Bracelets", hi: "ब्रेसलेट" },
    chip: { en: "Bracelets", hi: "ब्रेसलेट" },
    description: {
      en: "Bracelets and kada styles for everyday and gifting.",
      hi: "रोज़ और उपहार के लिए ब्रेसलेट व कड़े।",
    },
  },
  {
    slug: "chains",
    kind: "type",
    name: { en: "Chains", hi: "चेन" },
    chip: { en: "Chains", hi: "चेन" },
    description: {
      en: "Gold and silver chains in a range of link styles.",
      hi: "विभिन्न लिंक शैलियों में सोने-चांदी की चेन।",
    },
  },
  {
    slug: "pendants",
    kind: "type",
    name: { en: "Pendants", hi: "पेंडेंट" },
    chip: { en: "Pendants", hi: "पेंडेंट" },
    description: {
      en: "Pendants and lockets, with or without a chain.",
      hi: "चेन सहित या बिना, पेंडेंट और लॉकेट।",
    },
  },
  {
    slug: "mangalsutra",
    kind: "type",
    name: { en: "Mangalsutra", hi: "मंगलसूत्र" },
    chip: { en: "Mangalsutra", hi: "मंगलसूत्र" },
    description: {
      en: "Mangalsutra styles in traditional and light-weight designs.",
      hi: "पारंपरिक और हल्के डिज़ाइन के मंगलसूत्र।",
    },
  },
  {
    slug: "bridal-jewellery",
    kind: "occasion",
    name: { en: "Bridal Jewellery", hi: "ब्राइडल ज्वेलरी" },
    chip: { en: "Bridal", hi: "ब्राइडल" },
    description: {
      en: "Bridal sets and occasion jewellery for wedding functions.",
      hi: "शादी के कार्यक्रमों के लिए ब्राइडल सेट व गहने।",
    },
  },
  {
    slug: "mens-jewellery",
    kind: "gender",
    name: { en: "Men's Jewellery", hi: "पुरुषों के गहने" },
    chip: { en: "Men's", hi: "पुरुष" },
    description: {
      en: "Rings, chains and bracelets styled for men.",
      hi: "पुरुषों के लिए अंगूठी, चेन और ब्रेसलेट।",
    },
  },
  {
    slug: "womens-jewellery",
    kind: "gender",
    name: { en: "Women's Jewellery", hi: "महिलाओं के गहने" },
    chip: { en: "Women's", hi: "महिला" },
    description: {
      en: "Daily-wear and occasion jewellery for women.",
      hi: "महिलाओं के लिए रोज़ाना और अवसर के गहने।",
    },
  },
  {
    slug: "kids-jewellery",
    kind: "gender",
    name: { en: "Kids' Jewellery", hi: "बच्चों के गहने" },
    chip: { en: "Kids'", hi: "बच्चे" },
    description: {
      en: "Small-size bangles and chains for children.",
      hi: "बच्चों के लिए छोटे आकार की चूड़ियाँ व चेन।",
    },
  },
  {
    slug: "gemstones",
    kind: "type",
    name: { en: "Gemstones / Ratna", hi: "रत्न" },
    chip: { en: "Ratna", hi: "रत्न" },
    description: {
      en: "Ruby, pukhraj, emerald, neelam, moti and amethyst pieces.",
      hi: "माणिक्य, पुखराज, पन्ना, नीलम, मोती और अमेथिस्ट।",
    },
  },
];

export const JEWEL_TYPE_BY_SLUG: Record<string, JewelTypePage> = Object.fromEntries(
  JEWEL_TYPES.map((entry) => [entry.slug, entry]),
);

/** Short chips used on the catalogue toolbar (subset of the full list). */
export const CATALOGUE_CHIP_SLUGS = [
  "rings",
  "necklaces",
  "earrings",
  "bangles",
  "chains",
  "pendants",
  "mangalsutra",
  "bridal-jewellery",
];
