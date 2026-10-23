/**
 * content/about.ts — About Us sections.
 *
 * Rules applied here:
 *  • Nothing is invented. Statements about the business are limited to what the
 *    showroom's own public listing records (the Hansapuri address, the 1990
 *    establishment year in CONTACT) and to the collections the owner confirmed.
 *  • Where the family's own words are still needed (their history, how the pieces
 *    are made), the section says exactly that in plain language — it does not
 *    print a bracketed placeholder and it does not invent a story.
 */

import { CONTACT, DELIVERY, SCHEME, isPlaceholder, type LocalizedText } from "@/lib/config";

export type AboutSection = {
  id: string;
  kicker: LocalizedText;
  heading: LocalizedText;
  body: LocalizedText[];
  /** Shows an “owner input pending” badge. Only used where text is missing. */
  needsOwnerInput: boolean;
};

/** First line of the address, safe to print mid-sentence. */
const addressLine = (lang: "en" | "hi") =>
  isPlaceholder(CONTACT.address[lang]) ? CONTACT.area[lang] : CONTACT.address[lang];

export const ABOUT_SECTIONS: AboutSection[] = [
  {
    id: "story",
    kicker: { en: "Our story", hi: "हमारी कहानी" },
    heading: { en: "A family showroom in Hansapuri", hi: "हंसापुरी का पारिवारिक शोरूम" },
    body: [
      {
        en: `Tulsi Jewellers is a family-run jewellery showroom in Hansapuri, Nagpur, on Old Bhandara Road near the Radha Krishna Mandir. We have been part of the neighbourhood since ${CONTACT.establishedYear}.`,
        hi: `तुलसी ज्वेलर्स हंसापुरी, नागपुर का एक पारिवारिक ज्वेलरी शोरूम है, जो राधाकृष्ण मंदिर के पास ओल्ड भंडारा रोड पर है। हम ${CONTACT.establishedYear} से इस इलाके का हिस्सा हैं।`,
      },
      {
        en: "Behind the counter you meet the family itself — the people who choose the stock, weigh it and price it are the people who speak to you. Ask about weight, purity, making charges or exchanging old gold, and you get a straight answer.",
        hi: "काउंटर पर आपको स्वयं परिवार मिलता है — जो स्टॉक चुनते हैं, तोलते हैं और भाव तय करते हैं, वही आपसे बात करते हैं। वज़न, शुद्धता, मेकिंग चार्ज या पुराने सोने के एक्सचेंज के बारे में पूछें — सीधा जवाब मिलेगा।",
      },
    ],
    needsOwnerInput: false,
  },
  {
    id: "place",
    kicker: { en: "Where we are", hi: "हम कहाँ हैं" },
    heading: { en: "Hansapuri, Nagpur", hi: "हंसापुरी, नागपुर" },
    body: [
      {
        en: "Come in to see gold, silver, gemstone and fashion jewellery, and to talk through what you have in mind with the family at the counter.",
        hi: "सोने, चांदी, रत्न और फैंशन ज्वेलरी देखने आइए, और काउंटर पर परिवार से अपनी ज़रूरत के बारे में बात कीजिए।",
      },
      {
        en: `You will find us at: ${addressLine("en")} — the landmark is the Radha Krishna Mandir.`,
        hi: `पता: ${addressLine("hi")} — निकटतम पहचान राधाकृष्ण मंदिर है।`,
      },
    ],
    needsOwnerInput: false,
  },
  {
    id: "collections",
    kicker: { en: "What we keep", hi: "हमारे पास क्या है" },
    heading: { en: "Our collections", hi: "हमारे संग्रह" },
    body: [
      {
        en: "Gold jewellery, gold coins, fine gold biscuits, silver jewellery, fancy jewellery and a gems (ratna) range. Browse each collection here, or come in and we will show you what is on the counter today.",
        hi: "सोने के गहने, सोने के सिक्के, फाइन गोल्ड बिस्किट, चांदी के गहने, फैंसी ज्वेलरी और रत्न रेंज। यहाँ हर संग्रह देखिए, या आइए — आज काउंटर पर जो है, हम दिखा देंगे।",
      },
    ],
    needsOwnerInput: false,
  },
  {
    id: "craft",
    kicker: { en: "The pieces themselves", hi: "गहने" },
    heading: { en: "Ask about any piece", hi: "किसी भी गहने के बारे में पूछिए" },
    body: [
      {
        en: "Every piece has its own story — where it was made, how it was finished, what it weighs. Pick up anything at the counter and ask. We will tell you what we know and show you the paperwork that comes with it.",
        hi: "हर गहने की अपनी कहानी है — वह कहाँ बना, उसकी फिनिशिंग कैसी है, उसका वज़न क्या है। काउंटर पर कोई भी गहना उठाइए और पूछिए। जो हमें पता है, बताएँगे और उसके साथ आने वाले कागज़ भी दिखाएँगे।",
      },
    ],
    needsOwnerInput: false,
  },
  {
    id: "experience",
    kicker: { en: "In the showroom", hi: "शोरूम में" },
    heading: { en: "What a visit is like", hi: "विज़िट कैसी होती है" },
    body: [
      {
        en: "Come in, tell us the occasion and the budget, and we will show you the options that fit. You can compare weights and purities side by side, ask about making charges, and take your time deciding — with no obligation to buy.",
        hi: "आइए, अवसर और बजट बताइए — हम उसके अनुसार विकल्प दिखाएँगे। आप वज़न और शुद्धता की सीधी तुलना कर सकते हैं, मेकिंग चार्ज के बारे में पूछ सकते हैं, और बिना किसी दबाव के समय लेकर निर्णय ले सकते हैं।",
      },
    ],
    needsOwnerInput: false,
  },
  {
    id: "scheme",
    kicker: { en: "Savings", hi: "बचत" },
    heading: { en: SCHEME.name.en, hi: SCHEME.name.hi },
    body: [
      {
        en: `${SCHEME.tagline} — ${SCHEME.frequency.en} starting from ₹${SCHEME.startingAmountINR}, ending in jewellery of your choice. The scheme is enquiry and visit based, with no online payments.`,
        hi: `${SCHEME.tagline} — ₹${SCHEME.startingAmountINR} से शुरू, ${SCHEME.frequency.hi}, और अंत में आपकी पसंद के गहने। स्कीम पूछताछ और विज़िट आधारित है, ऑनलाइन भुगतान नहीं।`,
      },
      {
        en: "The instalment amount, the number of instalments, the redemption window and what happens if a month is missed are written on the scheme card the showroom gives you when you enrol, and they are set out on the scheme page of this website as well. Read both before the first instalment — the card is what governs your savings.",
        hi: "किस्त की राशि, किस्तों की संख्या, भुनाई की अवधि और किसी महीने की किस्त छूटने पर क्या होगा — यह सब नामांकन के समय शोरूम द्वारा दिए जाने वाले स्कीम कार्ड पर लिखा होता है, और इस वेबसाइट के स्कीम पेज पर भी बताया गया है। पहली किस्त से पहले दोनों पढ़ लें — आपकी बचत पर वही कार्ड लागू होता है।",
      },
    ],
    needsOwnerInput: false,
  },
  {
    id: "responsibility",
    kicker: { en: "How we work", hi: "हम कैसे काम करते हैं" },
    heading: { en: "Fewer claims, more answers", hi: "दावे कम, जवाब ज़्यादा" },
    body: [
      {
        en: "We would rather tell you less and get it right. The rates here carry their date and time, the photographs show styles rather than stock, and the person who answers the phone can help you with the rest.",
        hi: "हम कम बोलकर सही बोलना पसंद करते हैं। यहाँ के भाव के साथ उनकी तारीख़ और समय है, तस्वीरें स्टॉक की जगह डिज़ाइन दिखाती हैं, और फ़ोन उठाने वाला व्यक्ति बाकी बातों में आपकी मदद कर सकता है।",
      },
      { en: DELIVERY.outsideNagpurNote, hi: DELIVERY.outsideNagpurNote },
    ],
    needsOwnerInput: false,
  },
];

/**
 * The milestone timeline.
 *
 * EMPTY ON PURPOSE. A timeline entry has to be a real, dated fact about the
 * family's history, and there is no public record of one. The About page renders
 * no timeline while this list is empty, rather than showing a blank year.
 */
export const TIMELINE_MILESTONES: { year: string; text: LocalizedText }[] = [];
