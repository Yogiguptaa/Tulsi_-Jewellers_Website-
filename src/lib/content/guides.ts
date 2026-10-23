/**
 * content/guides.ts — jewellery education.
 *
 * These are general, factual explanations of how gold purity, hallmarking,
 * gemstones and care work. Nothing here describes Tulsi Jewellers' own policies,
 * certifications or stock — those are owner-supplied facts and live in
 * config.ts / trust.ts. Educational content never implies a certification the
 * showroom has not confirmed.
 */

import type { LocalizedText } from "@/lib/config";

export type GuideSection = {
  heading: LocalizedText;
  body: LocalizedText;
};

export type Guide = {
  slug: string;
  title: LocalizedText;
  summary: LocalizedText;
  /** Reading-friendly emoji-free kicker used on the index. */
  topic: LocalizedText;
  sections: GuideSection[];
};

export const GUIDES: Guide[] = [
  {
    slug: "gold-purity",
    title: { en: "Understanding gold purity", hi: "सोने की शुद्धता को समझें" },
    topic: { en: "Gold", hi: "सोना" },
    summary: {
      en: "What 24K, 22K, 18K and 916 actually mean — and why jewellery is usually not pure gold.",
      hi: "24K, 22K, 18K और 916 का वास्तविक अर्थ क्या है — और गहने सामान्यतः शुद्ध सोने के क्यों नहीं होते।",
    },
    sections: [
      {
        heading: { en: "Karat and fineness", hi: "कैरेट और फाइननेस" },
        body: {
          en: "Karat measures purity out of 24 parts. 24K is about 99.9% gold, 22K about 91.6%, 20K about 83.3% and 18K about 75%. Fineness is the same idea written per 1000 parts, so 22K is 916 fineness and 18K is 750 fineness.",
          hi: "कैरेट 24 भागों में शुद्धता बताता है। 24K लगभग 99.9% सोना, 22K लगभग 91.6%, 20K लगभग 83.3% और 18K लगभग 75% होता है। फाइननेस यही बात 1000 भागों में लिखी जाती है, इसलिए 22K यानी 916 और 18K यानी 750।",
        },
      },
      {
        heading: { en: "Why alloys are added", hi: "मिश्रण क्यों जोड़ा जाता है" },
        body: {
          en: "Pure gold is soft. Alloying it with other metals makes jewellery harder and keeps its shape, which is why most everyday pieces are 22K or 18K rather than 24K. 18K is common in stone-set jewellery because the alloy holds settings better.",
          hi: "शुद्ध सोना मुलायम होता है। अन्य धातुओं के साथ मिश्रण करने से गहने कठोर होते हैं और आकार बनाए रखते हैं, इसलिए रोज़ पहने जाने वाले अधिकतर गहने 24K के बजाय 22K या 18K के होते हैं। पत्थर जड़े गहनों में 18K आम है क्योंकि मिश्रण जड़ाई को बेहतर थामता है।",
        },
      },
      {
        heading: { en: "What you should check", hi: "आपको क्या जाँचना चाहिए" },
        body: {
          en: "Ask which purity the piece is, how it is marked, and whether the bill separates metal value, making charges and taxes. Comparing only the headline weight between two shops without comparing purity and making charges is misleading.",
          hi: "पूछें कि वस्तु किस शुद्धता की है, उस पर क्या अंकित है, और क्या बिल में धातु मूल्य, मेकिंग चार्ज और कर अलग-अलग दिखाए गए हैं। केवल वज़न की तुलना करना — शुद्धता और मेकिंग चार्ज की तुलना किए बिना — भ्रामक होता है।",
        },
      },
    ],
  },
  {
    slug: "hallmark-guide",
    title: { en: "What is hallmarking?", hi: "हॉलमार्किंग क्या है?" },
    topic: { en: "Hallmark", hi: "हॉलमार्क" },
    summary: {
      en: "How BIS hallmarking works in India and what the marks on a piece of gold jewellery tell you.",
      hi: "भारत में BIS हॉलमार्किंग कैसे काम करती है और सोने के गहनों पर अंकित चिह्न क्या बताते हैं।",
    },
    sections: [
      {
        heading: { en: "The purpose", hi: "उद्देश्य" },
        body: {
          en: "Hallmarking is an independent assay of a metal item. The assaying centre tests a sample and, if it matches the declared purity, marks the item so a buyer can see the declared purity without testing it themselves.",
          hi: "हॉलमार्किंग धातु की वस्तु की स्वतंत्र जाँच है। परीक्षण केंद्र नमूना जाँचता है और घोषित शुद्धता मिलने पर वस्तु पर चिह्न लगाता है, जिससे खरीदार बिना जाँच कराए घोषित शुद्धता देख सके।",
        },
      },
      {
        heading: { en: "The marks", hi: "चिह्न" },
        body: {
          en: "A BIS hallmark usually carries the BIS logo, the purity in karat and fineness (for example 22K 916), and the assaying centre's mark. Jewellery hallmarking has also introduced a unique ID for each piece in recent years.",
          hi: "BIS हॉलमार्क में सामान्यतः BIS लोगो, कैरेट और फाइननेस में शुद्धता (जैसे 22K 916), और परीक्षण केंद्र का चिह्न होता है। हाल के वर्षों में ज्वेलरी हॉलमार्किंग में प्रत्येक वस्तु के लिए विशिष्ट आईडी भी जोड़ी गई है।",
        },
      },
      {
        heading: { en: "Questions worth asking", hi: "पूछने योग्य प्रश्न" },
        body: {
          en: "Ask what documentation comes with the piece, whether the item is hallmarked, and how the purity is shown on the invoice. This website publishes hallmark details only once the showroom confirms exactly what it provides.",
          hi: "पूछें कि वस्तु के साथ कौन-से दस्तावेज़ मिलते हैं, वस्तु हॉलमार्क है या नहीं, और बिल पर शुद्धता कैसे दिखाई जाती है। यह वेबसाइट हॉलमार्क विवरण तभी प्रकाशित करती है जब शोरूम पुष्ट करता है कि वह क्या प्रदान करता है।",
        },
      },
    ],
  },
  {
    slug: "gemstone-basics",
    title: { en: "Gemstone basics", hi: "रत्नों की मूल बातें" },
    topic: { en: "Gems", hi: "रत्न" },
    summary: {
      en: "Ruby, pukhraj, emerald, neelam, moti and amethyst — what matters when you buy a stone set piece.",
      hi: "माणिक्य, पुखराज, पन्ना, नीलम, मोती और अमेथिस्ट — पत्थर जड़ी वस्तु खरीदते समय क्या महत्वपूर्ण है।",
    },
    sections: [
      {
        heading: { en: "Natural, treated or synthetic", hi: "प्राकृतिक, ट्रीटेड या सिंथेटिक" },
        body: {
          en: "Stones reach the market in three broad forms: untreated natural, treated natural (heat, oil or filling) and lab-created. Each has a different price and should be disclosed at the time of sale — always ask which one you are being shown.",
          hi: "पत्थर बाज़ार में मुख्यतः तीन रूपों में आते हैं: बिना ट्रीटमेंट प्राकृतिक, ट्रीटेड प्राकृतिक (हीट, ऑयल या फिलिंग) और लैब-निर्मित। तीनों का मूल्य अलग होता है और इसे बिक्री के समय बताया जाना चाहिए — सदैव पूछें कि आपको कौन-सा रूप दिखाया जा रहा है।",
        },
      },
      {
        heading: { en: "Colour and clarity", hi: "रंग और स्पष्टता" },
        body: {
          en: "Colour depth, hue and visible inclusions drive the value of most coloured stones. A photograph (even a good one) can flatter a stone, so compare stones side by side in person where possible.",
          hi: "अधिकांश रंगीन पत्थरों का मूल्य रंग की गहराई, रंग-छटा और दिखने वाली अशुद्धियों से तय होता है। तस्वीर (अच्छी तस्वीर भी) पत्थर को बेहतर दिखा सकती है, इसलिए संभव हो तो पत्थरों की सीधी तुलना करें।",
        },
      },
      {
        heading: { en: "Certification", hi: "प्रमाणन" },
        body: {
          en: "A recognised lab certificate states what the stone is and what treatment, if any, was detected. If a stone is sold with a certificate, check that the certificate number matches the item. This site never claims a certification that the showroom has not confirmed.",
          hi: "मान्यता प्राप्त प्रयोगशाला का प्रमाणपत्र बताता है कि पत्थर क्या है और कौन-सा ट्रीटमेंट पाया गया। यदि पत्थर प्रमाणपत्र के साथ बेचा जाता है, तो प्रमाणपत्र संख्या वस्तु से मिलान करें। यह साइट वह प्रमाणन कभी नहीं बताती जिसे शोरूम ने पुष्ट न किया हो।",
        },
      },
    ],
  },
  {
    slug: "jewellery-care",
    title: { en: "Caring for your jewellery", hi: "गहनों की देखभाल" },
    topic: { en: "Care", hi: "देखभाल" },
    summary: {
      en: "Simple habits that keep gold, silver, diamond and stone-set jewellery looking its best.",
      hi: "सोने, चांदी, हीरे और पत्थर जड़े गहनों को चमकदार बनाए रखने की सरल आदतें।",
    },
    sections: [
      {
        heading: { en: "Everyday habits", hi: "रोज़ की आदतें" },
        body: {
          en: "Wear jewellery last when dressing and remove it first at night. Keep it away from perfume, hair spray, chlorine and cleaning chemicals, which dull the surface and can loosen settings over time.",
          hi: "कपड़े पहनने के बाद गहने पहनें और रात में सबसे पहले उतारें। इत्र, हेयर स्प्रे, क्लोरीन और सफ़ाई के रसायनों से दूर रखें — ये सतह को मंद करते हैं और समय के साथ जड़ाई ढीली कर सकते हैं।",
        },
      },
      {
        heading: { en: "Gold", hi: "सोना" },
        body: {
          en: "Warm water with a drop of mild soap and a soft brush is enough for plain gold. Dry with a soft cloth. Avoid abrasive polishes, which remove metal from the surface.",
          hi: "सादे सोने के लिए गुनगुने पानी में हल्के साबुन की एक बूँद और मुलायम ब्रश पर्याप्त है। मुलायम कपड़े से सुखाएँ। घर्षणकारी पॉलिश से बचें, वे सतह से धातु हटा देती हैं।",
        },
      },
      {
        heading: { en: "Silver", hi: "चांदी" },
        body: {
          en: "Silver tarnishes naturally. A silver polishing cloth used gently restores shine. Store silver in a dry pouch or an airtight box, and separate pieces so they do not scratch each other.",
          hi: "चांदी स्वाभाविक रूप से काली पड़ती है। चांदी की पॉलिश कपड़े से हल्का रगड़ने पर चमक लौट आती है। चांदी को सूखे पाउच या वायुरोधी डिब्बे में रखें और वस्तुएँ अलग-अलग रखें ताकि एक-दूसरे को खरोंच न लगे।",
        },
      },
      {
        heading: { en: "Diamond and stone-set pieces", hi: "हीरे और पत्थर जड़ी वस्तुएँ" },
        body: {
          en: "A soft brush with mild soap and water cleans the stone area; rinse and pat dry. Check prongs for looseness before and after cleaning, and take the piece to a jeweller for a professional check periodically.",
          hi: "मुलायम ब्रश, हल्का साबुन और पानी से पत्थर के हिस्से की सफ़ाई करें; धोकर थपथपाकर सुखाएँ। सफ़ाई से पहले और बाद में जड़ाई के पंजों को जाँचें, और समय-समय पर पेशेवर जाँच के लिए ज्वेलर को दिखाएँ।",
        },
      },
    ],
  },
  {
    slug: "buying-guide",
    title: { en: "Jewellery buying checklist", hi: "गहने खरीदने की चेकलिस्ट" },
    topic: { en: "Buying", hi: "खरीदारी" },
    summary: {
      en: "What to ask and what to check before you pay — in the showroom or online.",
      hi: "भुगतान से पहले क्या पूछें और क्या जाँचें — शोरूम में या ऑनलाइन।",
    },
    sections: [
      {
        heading: { en: "Before you decide", hi: "निर्णय से पहले" },
        body: {
          en: "Decide the metal, purity, approximate weight and budget first. Ask for the weight, purity and making charges separately so you can compare two quotes fairly.",
          hi: "पहले धातु, शुद्धता, अनुमानित वज़न और बजट तय करें। वज़न, शुद्धता और मेकिंग चार्ज अलग-अलग पूछें ताकि दो बोलियों की निष्पक्ष तुलना हो सके।",
        },
      },
      {
        heading: { en: "On the bill", hi: "बिल पर" },
        body: {
          en: "Read the invoice: metal value, making charges, stone charges if any, discounts if any, and applicable taxes should be shown. Keep the bill — it is needed for exchanges, buy-back and service later.",
          hi: "बिल पढ़ें: धातु मूल्य, मेकिंग चार्ज, पत्थर शुल्क (यदि कोई), छूट (यदि कोई) और लागू कर दिखाई देने चाहिए। बिल सुरक्षित रखें — आगे एक्सचेंज, बाय-बैक और सर्विस के लिए आवश्यक होता है।",
        },
      },
      {
        heading: { en: "Returns and exchanges", hi: "रिटर्न और एक्सचेंज" },
        body: {
          en: "Ask about the exchange and return window, whether making charges are refundable, and what documents are required. Get the terms in writing rather than relying on a verbal assurance.",
          hi: "एक्सचेंज और रिटर्न की अवधि पूछें, क्या मेकिंग चार्ज वापस मिलते हैं, और कौन-से दस्तावेज़ चाहिए। ज़ुबानी भरोसे के बजाय शर्तें लिखित में लें।",
        },
      },
      {
        heading: { en: "Delivery", hi: "डिलीवरी" },
        body: {
          en: "Confirm delivery terms before paying. Tulsi Jewellers does not offer home delivery outside Nagpur, and local delivery terms are confirmed by the showroom directly.",
          hi: "भुगतान से पहले डिलीवरी की शर्तें पुष्ट करें। तुलसी ज्वेलर्स नागपुर के बाहर होम डिलीवरी नहीं देता, और स्थानीय डिलीवरी की शर्तें शोरूम स्वयं पुष्ट करता है।",
        },
      },
    ],
  },
];

export const GUIDE_BY_SLUG: Record<string, Guide> = Object.fromEntries(
  GUIDES.map((guide) => [guide.slug, guide]),
);
