/**
 * festivals/data.ts — the festival calendar for 2026.
 *
 * RULES THIS FILE FOLLOWS
 *  1. A date is only here if it was read on a panchang page, and those pages are
 *     listed in `sources`. Two independent sources must agree before `verified`
 *     is true — the test suite and `scripts/check-festivals.mjs` enforce that.
 *  2. Dates are Asia/Kolkata calendar dates. They are not instants, and they are
 *     not "the nearest Sunday".
 *  3. No offer, discount, price, stock claim or urgency is written here. The strip
 *     carries a date and a factual line; anything commercial is the owner's own.
 *  4. Only categories the showroom actually sells are linked.
 *
 * HOW TO ADD NEXT YEAR
 *  Read the dates on Drik Panchang (and one other panchang) for the year, add the
 *  entries below with both URLs, run `npm run check:festivals` and the tests, and
 *  ship. An entry without two agreeing sources stays out (or ships with
 *  `verified: false`, which renders nothing).
 *
 * KNOWN AMBIGUITY — Bhai Dooj 2026
 *  Drik Panchang and Prokerala both give Wednesday 11 November 2026: the Dwitiya
 *  tithi only begins at 2:00 pm on the 10th, so it does not prevail during the
 *  morning when the tilak is done. A minority reading names 10 November; that
 *  reading is not supported by a page that was actually read, so 11 November is
 *  the entry here.
 */

import type { Festival } from "./types";

const GOLD_JEWELLERY = {
  label: { en: "Gold jewellery", hi: "सोने के गहने" },
  href: "/collections/gold-jewellery",
} as const;

const GOLD_COINS = {
  label: { en: "Gold coins", hi: "सोने के सिक्के" },
  href: "/collections/gold-coins",
} as const;

const SILVER = {
  label: { en: "Silver jewellery", hi: "चांदी के गहने" },
  href: "/collections/silver-jewellery",
} as const;

const DRIK = "Drik Panchang";
const DRIK_CALENDAR = "https://www.drikpanchang.com/calendars/hindu/hinducalendar.html";

export const FESTIVALS: Festival[] = [
  {
    slug: "makar-sankranti-2026",
    name: { en: "Makar Sankranti", hi: "मकर संक्रांति" },
    dateStart: "2026-01-14",
    dateEnd: "2026-01-14",
    leadDays: 10,
    trailDays: 0,
    priority: 40,
    verified: true,
    sources: [
      { label: DRIK, url: "https://www.drikpanchang.com/sankranti/makar-sankranti-date-time.html?year=2026" },
      { label: "Prokerala", url: "https://www.prokerala.com/festivals/makar-sankranti.html" },
    ],
    headline: {
      en: "Makar Sankranti marks the sun's northward turn.",
      hi: "मकर संक्रांति सूर्य के उत्तरायण होने का पर्व है।",
    },
    subline: {
      en: "A traditional day for til-gul and new beginnings. Many families buy gold or silver around this time.",
      hi: "तिल-गुड़ और नई शुरुआत का पारंपरिक दिन। इस समय कई परिवार सोना या चांदी खरीदते हैं।",
    },
    categories: [GOLD_JEWELLERY, GOLD_COINS],
  },
  {
    slug: "gudi-padwa-2026",
    name: { en: "Gudi Padwa", hi: "गुड़ी पड़वा" },
    dateStart: "2026-03-19",
    dateEnd: "2026-03-19",
    leadDays: 10,
    trailDays: 0,
    priority: 40,
    verified: true,
    sources: [
      { label: DRIK, url: DRIK_CALENDAR },
      { label: "Prokerala", url: "https://www.prokerala.com/festivals/gudi-padwa.html" },
    ],
    headline: {
      en: "Gudi Padwa begins the Marathi new year.",
      hi: "गुड़ी पड़वा मराठी नववर्ष की शुरुआत है।",
    },
    subline: {
      en: "A traditional day to start something new. Come in to see gold jewellery, coins and silver.",
      hi: "कुछ नया शुरू करने का पारंपरिक दिन। सोने के गहने, सिक्के और चांदी देखने आइए।",
    },
    categories: [GOLD_JEWELLERY, GOLD_COINS],
  },
  {
    slug: "akshaya-tritiya-2026",
    name: { en: "Akshaya Tritiya", hi: "अक्षय तृतीया" },
    dateStart: "2026-04-19",
    dateEnd: "2026-04-19",
    leadDays: 14,
    trailDays: 0,
    priority: 50,
    verified: true,
    sources: [
      { label: DRIK, url: DRIK_CALENDAR },
      { label: "Prokerala", url: "https://www.prokerala.com/festivals/akshaya-tritiya.html" },
    ],
    headline: {
      en: "Akshaya Tritiya is a traditional day to buy gold.",
      hi: "अक्षय तृतीया सोना खरीदने का पारंपरिक दिन है।",
    },
    subline: {
      en: "Many families buy gold or silver on this day. See what is at the counter, or message us and we will keep pieces ready.",
      hi: "इस दिन कई परिवार सोना या चांदी खरीदते हैं। काउंटर पर जो है वह देखें, या हमें संदेश भेजें और हम गहने तैयार रखेंगे।",
    },
    categories: [GOLD_JEWELLERY, GOLD_COINS, SILVER],
  },
  {
    slug: "raksha-bandhan-2026",
    name: { en: "Raksha Bandhan", hi: "रक्षा बंधन" },
    dateStart: "2026-08-28",
    dateEnd: "2026-08-28",
    leadDays: 14,
    trailDays: 0,
    priority: 40,
    verified: true,
    sources: [
      { label: DRIK, url: DRIK_CALENDAR },
      { label: "Prokerala", url: "https://www.prokerala.com/festivals/raksha-bandhan.html" },
    ],
    headline: {
      en: "Raksha Bandhan is a day for brothers and sisters.",
      hi: "रक्षा बंधन भाई-बहन का पर्व है।",
    },
    subline: {
      en: "Rakhi, a gift and often a piece of jewellery chosen together. Message us and we will keep options ready.",
      hi: "राखी, उपहार और अक्सर साथ चुना गया एक गहना। हमें संदेश भेजें, हम विकल्प तैयार रखेंगे।",
    },
    categories: [GOLD_JEWELLERY, SILVER],
  },
  {
    slug: "ganesh-chaturthi-2026",
    name: { en: "Ganesh Chaturthi", hi: "गणेश चतुर्थी" },
    dateStart: "2026-09-14",
    dateEnd: "2026-09-25",
    leadDays: 14,
    trailDays: 0,
    priority: 45,
    verified: true,
    sources: [
      {
        label: DRIK,
        url: "https://www.drikpanchang.com/festivals/ganesh-chaturthi/ganesh-chaturthi-date-time.html?year=2026",
      },
      { label: "Prokerala", url: "https://www.prokerala.com/festivals/ganesh-chaturthi.html" },
    ],
    headline: {
      en: "Ganesh Chaturthi begins Ganeshotsav.",
      hi: "गणेश चतुर्थी से गणेशोत्सव शुरू होता है।",
    },
    subline: {
      en: "Ten days of celebration in Nagpur. Gold and silver pieces for the festival are on the counter.",
      hi: "नागपुर में दस दिन का उत्सव। त्योहार के लिए सोने और चांदी के गहने काउंटर पर हैं।",
    },
    categories: [GOLD_JEWELLERY, SILVER],
  },
  {
    slug: "navratri-2026",
    name: { en: "Navratri", hi: "नवरात्रि" },
    dateStart: "2026-10-11",
    dateEnd: "2026-10-20",
    leadDays: 14,
    trailDays: 0,
    priority: 30,
    verified: true,
    sources: [
      { label: DRIK, url: "https://www.drikpanchang.com/navratri/ashwin-shardiya-navratri-dates.html?year=2026" },
      { label: "Prokerala", url: "https://www.prokerala.com/festivals/navratri.html" },
    ],
    headline: {
      en: "Navratri is nine nights of celebration.",
      hi: "नवरात्रि नौ रातों का उत्सव है।",
    },
    subline: {
      en: "Many families buy something new during Navratri. See the collections at the showroom.",
      hi: "नवरात्रि में कई परिवार कुछ नया खरीदते हैं। शोरूम में कलेक्शन देखें।",
    },
    categories: [GOLD_JEWELLERY, SILVER],
  },
  {
    slug: "dussehra-2026",
    name: { en: "Dussehra", hi: "दशहरा" },
    dateStart: "2026-10-20",
    dateEnd: "2026-10-20",
    leadDays: 7,
    trailDays: 1,
    priority: 35,
    verified: true,
    sources: [
      { label: DRIK, url: "https://www.drikpanchang.com/navratri/ashwin-shardiya-navratri-dates.html?year=2026" },
      { label: "Prokerala", url: "https://www.prokerala.com/festivals/dussehra.html" },
    ],
    headline: {
      en: "Dussehra closes Navratri.",
      hi: "दशहरे के साथ नवरात्रि समाप्त होती है।",
    },
    subline: {
      en: "A traditional day for a new beginning. Gold coins and silver are bought by many families.",
      hi: "नई शुरुआत का पारंपरिक दिन। कई परिवार सोने के सिक्के और चांदी खरीदते हैं।",
    },
    categories: [GOLD_COINS, SILVER],
  },
  {
    slug: "dhanteras-2026",
    name: { en: "Dhanteras", hi: "धनतेरस" },
    dateStart: "2026-11-06",
    dateEnd: "2026-11-06",
    leadDays: 14,
    trailDays: 0,
    priority: 100,
    verified: true,
    sources: [
      { label: DRIK, url: "https://www.drikpanchang.com/diwali/diwali-puja-calendar.html" },
      { label: "Prokerala", url: "https://www.prokerala.com/festivals/dhanteras.html" },
    ],
    headline: {
      en: "Dhanteras is a traditional day to buy gold and silver.",
      hi: "धनतेरस सोना और चांदी खरीदने का पारंपरिक दिन है।",
    },
    subline: {
      en: "Many families buy gold or silver on Dhanteras. Visit the showroom in Hansapuri, or message us and we will keep pieces ready to see.",
      hi: "धनतेरस पर कई परिवार सोना या चांदी खरीदते हैं। हंसापुरी स्थित शोरूम आइए, या संदेश भेजें और हम गहने तैयार रखेंगे।",
    },
    categories: [GOLD_COINS, GOLD_JEWELLERY, SILVER],
  },
  {
    slug: "diwali-2026",
    name: { en: "Diwali", hi: "दिवाली" },
    dateStart: "2026-11-08",
    dateEnd: "2026-11-08",
    leadDays: 14,
    trailDays: 1,
    priority: 90,
    verified: true,
    sources: [
      { label: DRIK, url: "https://www.drikpanchang.com/diwali/diwali-puja-calendar.html" },
      { label: "Prokerala", url: "https://www.prokerala.com/festivals/diwali.html" },
    ],
    headline: {
      en: "Diwali is the festival of lights.",
      hi: "दिवाली रोशनी का त्योहार है।",
    },
    subline: {
      en: "Gold coins, silver and jewellery for gifting. Come in before the festival to choose, or message us.",
      hi: "उपहार के लिए सोने के सिक्के, चांदी और गहने। त्योहार से पहले आकर चुनें, या हमें संदेश भेजें।",
    },
    categories: [GOLD_COINS, SILVER, GOLD_JEWELLERY],
  },
  {
    slug: "bhai-dooj-2026",
    name: { en: "Bhai Dooj", hi: "भाई दूज" },
    dateStart: "2026-11-11",
    dateEnd: "2026-11-11",
    leadDays: 7,
    trailDays: 0,
    priority: 60,
    verified: true,
    sources: [
      { label: DRIK, url: "https://www.drikpanchang.com/festivals/bhai-dooj/bhai-dooj-date-time.html" },
      { label: "Prokerala", url: "https://www.prokerala.com/festivals/bhai-dooj.html" },
    ],
    headline: {
      en: "Bhai Dooj follows Diwali.",
      hi: "भाई दूज दिवाली के बाद आता है।",
    },
    subline: {
      en: "A day for brothers and sisters, and often a gift of jewellery. Ask us what is ready at the counter.",
      hi: "भाई-बहन का दिन, और अक्सर गहनों का उपहार। काउंटर पर क्या तैयार है, हमसे पूछें।",
    },
    categories: [GOLD_COINS, SILVER],
  },
  {
    slug: "tulsi-vivah-2026",
    name: { en: "Tulsi Vivah", hi: "तुलसी विवाह" },
    dateStart: "2026-11-21",
    dateEnd: "2026-11-21",
    leadDays: 14,
    trailDays: 0,
    priority: 40,
    verified: true,
    sources: [
      { label: DRIK, url: DRIK_CALENDAR },
      { label: "Prokerala", url: "https://www.prokerala.com/festivals/tulsi-vivah.html" },
    ],
    headline: {
      en: "Tulsi Vivah marks the start of the wedding season.",
      hi: "तुलसी विवाह के साथ विवाह का मौसम शुरू होता है।",
    },
    subline: {
      en: "Wedding and bridal jewellery is chosen around this time. Book a visit and we will keep pieces ready.",
      hi: "इस समय विवाह और दुल्हन के गहने चुने जाते हैं। विज़िट तय करें, हम गहने तैयार रखेंगे।",
    },
    categories: [GOLD_JEWELLERY, GOLD_COINS],
  },
];
