/**
 * content/trust.ts — "Why choose Tulsi Jewellers" + services.
 *
 * Every string here is either (a) structurally true (the showroom exists, it has
 * a physical location, enquiries are answered) or (b) a placeholder the owner
 * must confirm. No award, guarantee, certification or rating is invented.
 */

import { SCHEME, type LocalizedText } from "@/lib/config";

export type TrustPoint = {
  id: string;
  title: LocalizedText;
  body: LocalizedText;
  /** True when the fact behind this point still needs owner confirmation. */
  needsConfirmation: boolean;
};

export const TRUST_POINTS: TrustPoint[] = [
  {
    id: "showroom",
    title: { en: "Come and see for yourself", hi: "आइए, खुद देखिए" },
    body: {
      en: "We are a jewellery showroom in Hansapuri, Nagpur. Walk in, see the pieces in your hand and ask us anything — take the time you need.",
      hi: "हम हंसापुरी, नागपुर में एक ज्वेलरी शोरूम हैं। आइए, गहने हाथ में लेकर देखिए और जो भी पूछना हो पूछिए — आप अपना समय ले सकते हैं।",
    },
    needsConfirmation: false,
  },
  {
    id: "collections",
    title: { en: "Gold, silver and gemstones", hi: "सोना, चांदी और रत्न" },
    body: {
      en: "Our counters cover gold jewellery, gold coins and biscuits, silver jewellery, fancy jewellery and a gemstone (ratna) range.",
      hi: "हमारे काउंटर पर सोने के गहने, सोने के सिक्के और बिस्किट, चांदी के गहने, फैंसी ज्वेलरी और रत्न रेंज मिलती है।",
    },
    needsConfirmation: false,
  },
  {
    id: "coins",
    title: { en: "Coins and biscuits", hi: "सिक्के और बिस्किट" },
    body: {
      en: "Gold coins and fine gold biscuits are part of what we keep — for a gift, a wedding in the family, or simply saving in gold.",
      hi: "सोने के सिक्के और फाइन गोल्ड बिस्किट हमारे पास रहते हैं — उपहार के लिए, घर के विवाह के लिए, या सोने में बचत के लिए।",
    },
    needsConfirmation: false,
  },
  {
    id: "scheme",
    title: { en: "Monthly gold savings scheme", hi: "मासिक गोल्ड सेविंग स्कीम" },
    body: {
      en: `${SCHEME.name.en} starts from ₹${SCHEME.startingAmountINR} a month. Full terms are shared at the showroom.`,
      hi: `${SCHEME.name.hi} ₹${SCHEME.startingAmountINR} मासिक से शुरू होती है। पूरी शर्तें शोरूम पर बताई जाती हैं।`,
    },
    needsConfirmation: false,
  },
  {
    id: "transparency",
    title: { en: "Today's rate, in the open", hi: "आज का भाव, खुलकर" },
    body: {
      en: "Today's gold and silver rate is on this site with its date and time, so you know what you are working from before you come in.",
      hi: "आज का सोना-चांदी भाव इस साइट पर दिनांक और समय के साथ है, ताकि आने से पहले आपको पता हो कि भाव क्या चल रहा है।",
    },
    needsConfirmation: false,
  },
  {
    id: "hallmark",
    title: { en: "Hallmarking, answered at the counter", hi: "हॉलमार्क, काउंटर पर जवाब" },
    body: {
      en: "If hallmarking or certification matters for a piece you are considering, ask us. We will show you the papers that come with it and explain what each one covers.",
      hi: "जिस गहने को आप देख रहे हैं, उसके हॉलमार्क या प्रमाणन के बारे में पूछिए। उसके साथ आने वाले कागज़ हम आपको दिखाएँगे और बताएँगे कि कौन-सा क्या बताता है।",
    },
    needsConfirmation: false,
  },
  {
    id: "exchange",
    title: { en: "Exchange and buy-back", hi: "एक्सचेंज और बाय-बैक" },
    body: {
      en: "Thinking of exchanging something? Bring it in. We will look at it with you and explain the terms before you decide.",
      hi: "कुछ बदलना चाहते हैं? उसे साथ लेकर आइए। हम मिलकर देखेंगे और निर्णय से पहले शर्तें बता देंगे।",
    },
    needsConfirmation: false,
  },
];

export type ServiceItem = {
  id: string;
  name: LocalizedText;
  /** `true` → shown as available; `false` → shown as "confirm with showroom". */
  confirmed: boolean;
};

/**
 * Services. Everything starts unconfirmed: the site must never advertise a
 * service the showroom has not agreed to provide.
 */
export const SERVICES: ServiceItem[] = [
  { id: "custom", name: { en: "Custom / bespoke jewellery", hi: "कस्टम / बेस्पोक ज्वेलरी" }, confirmed: false },
  { id: "repair", name: { en: "Repair & polishing", hi: "मरम्मत और पॉलिश" }, confirmed: false },
  { id: "exchange", name: { en: "Old gold exchange", hi: "पुराने सोने का एक्सचेंज" }, confirmed: false },
  { id: "scheme", name: { en: "Gold saving scheme", hi: "गोल्ड सेविंग स्कीम" }, confirmed: true },
  { id: "gems", name: { en: "Gemstone / ratna guidance", hi: "रत्न परामर्श" }, confirmed: false },
  { id: "delivery-local", name: { en: "Delivery within Nagpur", hi: "नागपुर में डिलीवरी" }, confirmed: false },
];
