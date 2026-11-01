/**
 * lib/designs.ts — the "Popular designs" catalogue.
 *
 * WHAT THIS IS
 * ────────────
 * Style information, not inventory. Every entry describes a well-known Indian
 * jewellery style: what it is, when people wear it, which metals it is usually
 * made in and how to look after it. None of it claims that a particular piece is
 * on the counter today, none of it carries a price or a weight, and none of it
 * says anything about certification, hallmarking or stock that the showroom has
 * not confirmed.
 *
 * PHOTOGRAPHS
 * ───────────
 * `images` holds keys from `public/media/manifest.json` only. That file records
 * each photographer, source page and licence, and `/image-credits` prints them.
 * Every licence there allows commercial use (CC0, public domain, CC BY, CC BY-SA);
 * NC and ND are refused by `scripts/check-designs.mjs`. A style with no suitable
 * photograph has an empty list and the page says so plainly instead of showing a
 * borrowed picture of something else.
 *
 * A style's first image is its title picture on the index and the WhatsApp card.
 */

import type { LocalizedText } from "@/lib/config";

export type DesignStyle = {
  slug: string;
  name: LocalizedText;
  /** Short label above the name, for the index card. */
  kicker: LocalizedText;
  /** One sentence, used on cards, metadata and search. */
  summary: LocalizedText;
  /** Two or three sentences of factual description. */
  description: LocalizedText;
  /** Occasions people usually buy the style for. */
  occasions: LocalizedText[];
  /** Which metals and purities the style is normally made in. */
  metals: LocalizedText;
  /** One practical care tip. */
  care: LocalizedText;
  /** Manifest image keys. Empty when the showroom has no photograph of the style. */
  images: string[];
  /** Slug from `lib/content/guides.ts`. */
  guideSlug: string;
  /** English phrase used to open a WhatsApp message about this style. */
  enquiry: string;
};

export const DESIGNS: DesignStyle[] = [
  {
    slug: "bridal-necklace-sets",
    name: { en: "Bridal necklace sets", hi: "ब्राइडल नेकलेस सेट" },
    kicker: { en: "Wedding", hi: "शादी" },
    summary: {
      en: "A necklace with matching earrings, chosen as one set for the wedding day.",
      hi: "शादी के दिन के लिए मिलते-जुलते झुमकों के साथ चुना जाने वाला हार सेट।",
    },
    description: {
      en: "A bridal set is a necklace and a matching pair of earrings designed together, so the motifs, the stone work and the finish agree. The necklace usually sits high on the neck or falls in layers, and many families add a maang tikka and bangles from the same design. Because the set is worn once or twice in a lifetime, brides often choose heavier gold and more elaborate stone work than their everyday jewellery.",
      hi: "ब्राइडल सेट में एक हार और उससे मिलता-जुलता झुमकों का जोड़ा एक साथ बनाया जाता है, ताकि नक्काशी, पत्थर की जड़ाई और फिनिश एक जैसी दिखे। हार सामान्यतः गले के पास बैठता है या कई परतों में गिरता है, और कई परिवार उसी डिज़ाइन से मांग टीका और चूड़ियाँ भी जोड़ते हैं। यह सेट जीवन में एक-दो बार पहना जाता है, इसलिए दुल्हनें अक्सर रोज़ के गहनों से भारी सोना और अधिक कारीगरी वाली जड़ाई चुनती हैं।",
    },
    occasions: [
      { en: "Wedding and reception", hi: "शादी और रिसेप्शन" },
      { en: "Engagement", hi: "सगाई" },
      { en: "A family wedding where the set is passed on", hi: "पारिवारिक शादी, जहाँ सेट आगे दिया जाता है" },
    ],
    metals: {
      en: "Usually 22K gold, sometimes 18K when the set is heavily stone-set.",
      hi: "सामान्यतः 22K सोना, और भारी जड़ाई वाले सेट में कभी-कभी 18K।",
    },
    care: {
      en: "Store the set flat in its own box and have the stone settings checked at the showroom before a wedding season.",
      hi: "सेट को उसके अलग डिब्बे में सपाट रखें और शादी के सीज़न से पहले शोरूम पर जड़ाई की जाँच करा लें।",
    },
    images: ["bridePortrait", "bridalJewelleryIndia", "brideDetail", "goldNecklaceAncient"],
    guideSlug: "gold-purity",
    enquiry: "a bridal necklace set",
  },
  {
    slug: "temple-jewellery",
    name: { en: "Temple jewellery", hi: "टेम्पल ज्वेलरी" },
    kicker: { en: "Heritage", hi: "परंपरा" },
    summary: {
      en: "Gold work in the old South Indian temple style: motifs of deities, coins and repeated beads.",
      hi: "पुरानी दक्षिण भारतीय मंदिर शैली का सोना: देवताओं की आकृतियाँ, सिक्के और दानों की पंक्तियाँ।",
    },
    description: {
      en: "Temple jewellery takes its motifs from temple architecture and iconography — a deity, a coin, a lotus, a row of beads — and builds the piece from repoussé gold rather than from a plain sheet. The look is deliberately antique: matte gold, deeper colour, visible tooling. Antique and temple-style pieces are popular for weddings and for photographs, and they pair well with silk sarees.",
      hi: "टेम्पल ज्वेलरी की नक्काशी मंदिर की वास्तुकला और प्रतिमाओं से आती है — देवता, सिक्का, कमल, दानों की पंक्ति — और टुकड़ा सादी चादर के बजाय उभरे हुए सोने से बनाया जाता है। रूप जानबूझकर पुराना रखा जाता है: मैट सोना, गहरा रंग, दिखती कारीगरी। एंटीक और टेम्पल शैली के गहने शादी और फोटोशूट के लिए लोकप्रिय हैं और रेशमी साड़ी के साथ अच्छे लगते हैं।",
    },
    occasions: [
      { en: "Weddings and family functions", hi: "शादी और पारिवारिक समारोह" },
      { en: "Festivals", hi: "त्योहार" },
      { en: "Photographs and heirloom handovers", hi: "फोटोशूट और पुराने गहनों का हस्तांतरण" },
    ],
    metals: {
      en: "Usually 22K gold. The antique finish is a surface treatment on the gold, not another metal.",
      hi: "सामान्यतः 22K सोना। एंटीक फिनिश सोने पर की गई सतह की कारीगरी है, कोई दूसरी धातु नहीं।",
    },
    care: {
      en: "Do not polish an antique finish with a cloth meant for bright gold — it removes the deliberate matte look.",
      hi: "चमकदार सोने के कपड़े से एंटीक फिनिश को न रगड़ें — इससे जानबूझकर रखी गई मैट चमक हट जाती है।",
    },
    images: ["goldNecklaceAncient", "goldNecklaceIndia", "goldChain", "earringsGold"],
    guideSlug: "hallmark-guide",
    enquiry: "temple or antique-style gold",
  },
  {
    slug: "kundan-and-polki",
    name: { en: "Kundan and polki", hi: "कुंदन और पोल्की" },
    kicker: { en: "Stone-set", hi: "पत्थर जड़ा" },
    summary: {
      en: "Flat-cut uncut diamonds and coloured stones set in gold with gold foil behind them.",
      hi: "सोने में जड़े चपटे कटे हुए हीरे और रंगीन पत्थर, जिनके पीछे सोने की पन्नी लगती है।",
    },
    description: {
      en: "In kundan work, gemstones are seated in a gold framework and the gaps are filled with thin gold foil, so the setting itself becomes part of the design. Polki is the uncut diamond usually set this way; the stones keep their natural, slightly irregular shape rather than being faceted. The result is a soft glow rather than a sharp sparkle, which is why kundan suits traditional clothing and photographs so well.",
      hi: "कुंदन कारीगरी में रत्नों को सोने के ढाँचे में बैठाया जाता है और बीच की जगह पतली सोने की पन्नी से भरी जाती है, इसलिए जड़ाई खुद डिज़ाइन का हिस्सा बन जाती है। पोल्की वह अपरिष्कृत हीरा है जो सामान्यतः इसी तरह जड़ा जाता है; पत्थर अपना प्राकृतिक, थोड़ा असमान आकार रखते हैं और उन पर कोई तराश नहीं होती। परिणाम तेज़ चमक के बजाय नरम आभा होता है, इसलिए कुंदन पारंपरिक कपड़ों और फोटो में बहुत अच्छा लगता है।",
    },
    occasions: [
      { en: "Weddings and receptions", hi: "शादी और रिसेप्शन" },
      { en: "Festive wear", hi: "त्योहारों के कपड़े" },
      { en: "Gifts to a daughter or daughter-in-law", hi: "बेटी या बहू को उपहार" },
    ],
    metals: {
      en: "Usually 22K gold for the frame, with settings fine enough for the stones.",
      hi: "ढाँचे के लिए सामान्यतः 22K सोना, जड़ाई पत्थरों के अनुकूल बारीक होती है।",
    },
    care: {
      en: "Keep kundan away from water and perfume; the foil behind a stone is the part that suffers first.",
      hi: "कुंदन को पानी और इत्र से दूर रखें; पत्थर के पीछे की पन्नी सबसे पहले प्रभावित होती है।",
    },
    images: ["bridePortrait", "bangleRubyDiamond", "earringsGold"],
    guideSlug: "gemstone-basics",
    enquiry: "a kundan or polki piece",
  },
  {
    slug: "jhumka-earrings",
    name: { en: "Jhumka earrings", hi: "झुमका" },
    kicker: { en: "Earrings", hi: "कान के गहने" },
    summary: {
      en: "A domed bell of gold that hangs from a stud, often with beads below it.",
      hi: "स्टड से लटकती सोने की घंटी जैसी गोलाई, नीचे अक्सर दाने।",
    },
    description: {
      en: "A jhumka is built as a hemisphere of gold that hangs from the ear, with a row of small beads along its lower edge. Size changes the whole look: a small jhumka reads as everyday wear, a broad one as wedding jewellery. Weight on the ear matters more than weight on the scale, so a light domed pair is usually the more comfortable choice for a long function.",
      hi: "झुमका सोने का आधा गोला होता है जो कान से लटकता है, और उसके निचले किनारे पर छोटे दानों की एक पंक्ति होती है। आकार से पूरा रूप बदल जाता है: छोटा झुमका रोज़ के पहनावे जैसा लगता है, चौड़ा झुमका शादी जैसा। कान पर वज़न तराज़ू के वज़न से अधिक मायने रखता है, इसलिए लंबे समारोह के लिए हल्का गोलाकार जोड़ा अधिक आरामदायक रहता है।",
    },
    occasions: [
      { en: "Festivals and family functions", hi: "त्योहार और पारिवारिक समारोह" },
      { en: "Wedding wear, in a larger size", hi: "शादी, बड़े आकार में" },
      { en: "Everyday wear, in a small size", hi: "रोज़, छोटे आकार में" },
    ],
    metals: {
      en: "Mostly 22K gold; 18K is used when the dome carries stones.",
      hi: "अधिकतर 22K सोना; गोलाई पर पत्थर होने पर 18K।",
    },
    care: {
      en: "Check the screw or hook before every wear, and take them off before sleeping.",
      hi: "हर बार पहनने से पहले स्क्रू या हुक जाँचें, और सोने से पहले उतार दें।",
    },
    images: ["earringsGold", "jhumkaGold", "earringsGoldPair", "brideDetail"],
    guideSlug: "jewellery-care",
    enquiry: "jhumka earrings",
  },
  {
    slug: "kada-and-bangles",
    name: { en: "Kadas and bangles", hi: "कड़े और चूड़ियाँ" },
    kicker: { en: "Wrists", hi: "कलाई" },
    summary: {
      en: "Rigid gold bangles, plain, enamel-decorated or stone-set, worn alone or in stacks.",
      hi: "सोने की कठोर चूड़ियाँ — सादी, मीनाकारी वाली या पत्थर जड़ी — अकेली या ढेर में।",
    },
    description: {
      en: "A kada is a single rigid band, usually a little wider than a bangle and closed with a hinge or screw. Meenakari enamel adds colour on the outside or inside of the band; stone-set bands carry the weight further. Fitting matters: a bangle should pass over the hand without force, and a hinged kada should close without pressing on the wrist.",
      hi: "कड़ा एक कठोर छल्ला होता है, सामान्यतः चूड़ी से थोड़ा चौड़ा और हिंज या स्क्रू से बंद होता है। मीनाकारी छल्ले के बाहर या अंदर रंग जोड़ती है; पत्थर जड़ी पट्टियाँ भार बढ़ा देती हैं। नाप मायने रखता है: चूड़ी हाथ से बिना ज़ोर के निकलनी चाहिए, और हिंज वाला कड़ा कलाई पर दबाव डाले बिना बंद होना चाहिए।",
    },
    occasions: [
      { en: "Wedding sets with a saree", hi: "साड़ी के साथ शादी का सेट" },
      { en: "Everyday wear in a plain design", hi: "रोज़, सादे डिज़ाइन में" },
      { en: "Gifts at a birth or anniversary", hi: "जन्म या सालगिरह पर उपहार" },
    ],
    metals: {
      en: "Usually 22K gold; enamel and stone-set kadas are also made in 18K.",
      hi: "सामान्यतः 22K सोना; मीनाकारी और पत्थर जड़े कड़े 18K में भी बनते हैं।",
    },
    care: {
      en: "Have a hinged kada's screw checked once a year — it is the part that loosens first.",
      hi: "हिंज वाले कड़े का स्क्रू साल में एक बार जाँच कराएँ — ढीला सबसे पहले वही होता है।",
    },
    images: ["kadaMeenakari", "bangleRubyDiamond", "bangleGoldEnamel", "bangleBlueEnamel"],
    guideSlug: "jewellery-care",
    enquiry: "gold kadas or bangles",
  },
  {
    slug: "mangalsutra",
    name: { en: "Mangalsutra", hi: "मंगलसूत्र" },
    kicker: { en: "Married wear", hi: "सुहाग" },
    summary: {
      en: "The black-bead and gold chain worn after marriage, in a short, long or pendant style.",
      hi: "शादी के बाद पहना जाने वाला काले दानों और सोने की डोर वाला मंगलसूत्र — छोटा, लंबा या पेंडेंट शैली में।",
    },
    description: {
      en: "A mangalsutra pairs black beads with gold, either as a chain of alternating beads or as a gold pendant on a bead strand. The short style sits close to the neck and works with a kurta or a formal shirt; the long style is the traditional version worn over a saree. Because it is worn every day, the clasp and the thread are the parts to look at first when you buy.",
      hi: "मंगलसूत्र में काले दाने और सोना साथ होते हैं — या तो बारी-बारी दानों की डोर, या दानों की लड़ी पर सोने का पेंडेंट। छोटी शैली गले के पास रहती है और कुर्ते या औपचारिक कमीज़ के साथ अच्छी लगती है; लंबी शैली पारंपरिक है और साड़ी के ऊपर पहनी जाती है। यह रोज़ पहना जाता है, इसलिए खरीदते समय क्लैप और धागे को सबसे पहले देखें।",
    },
    occasions: [
      { en: "Worn daily after marriage", hi: "शादी के बाद रोज़" },
      { en: "Given at a wedding", hi: "शादी में दिया जाता है" },
      { en: "A shorter version for work", hi: "काम के लिए छोटा रूप" },
    ],
    metals: {
      en: "Usually 22K gold with black beads; diamond-pendant versions are set in 18K.",
      hi: "सामान्यतः काले दानों के साथ 22K सोना; हीरे वाले पेंडेंट 18K में जड़े जाते हैं।",
    },
    care: {
      en: "Replace the thread before it frays, and never pull a mangalsutra off by the pendant.",
      hi: "धागा घिसने से पहले बदलवाएँ, और मंगलसूत्र को पेंडेंट से खींचकर न उतारें।",
    },
    images: ["mangalsutraBeads"],
    guideSlug: "buying-guide",
    enquiry: "a mangalsutra",
  },
  {
    slug: "chains-and-pendants",
    name: { en: "Chains and pendants", hi: "चेन और पेंडेंट" },
    kicker: { en: "Everyday gold", hi: "रोज़ का सोना" },
    summary: {
      en: "Light gold chains, with or without a pendant, for everyday wear.",
      hi: "हल्की सोने की चेन, पेंडेंट के साथ या बिना, रोज़ पहनने के लिए।",
    },
    description: {
      en: "A daily-wear chain is chosen for how it hangs and how it wears, not for weight: a hollow or machine-made link gives more length and presence for less gold. Pendants are usually a separate choice, so the same chain can carry a deity, an initial or a stone. Ask which link type the chain is — a fine cable link and a box link wear very differently over years of daily use.",
      hi: "रोज़ पहनने वाली चेन वज़न से अधिक इस बात से चुनी जाती है कि वह कैसे लटकती है और कैसे टिकती है: खोखला या मशीन से बना लिंक कम सोने में अधिक लंबाई और रूप देता है। पेंडेंट सामान्यतः अलग चुना जाता है, इसलिए वही चेन देवता, नाम का अक्षर या पत्थर संभाल सकती है। पूछें कि चेन किस प्रकार के लिंक की है — महीन केबल लिंक और बॉक्स लिंक सालों के रोज़ के इस्तेमाल में बहुत अलग तरह से टिकते हैं।",
    },
    occasions: [
      { en: "Everyday wear", hi: "रोज़ पहनना" },
      { en: "A first gold piece for a child", hi: "बच्चे का पहला सोना" },
      { en: "A pendant for a birthday", hi: "जन्मदिन पर पेंडेंट" },
    ],
    metals: {
      en: "22K gold for traditional chains, 18K for finer or stone-set pendants.",
      hi: "पारंपरिक चेन में 22K सोना, महीन या पत्थर जड़े पेंडेंट में 18K।",
    },
    care: {
      en: "Take a chain off before sleeping — a kink in a fine link is hard to straighten without stretching it.",
      hi: "सोने से पहले चेन उतार दें — महीन लिंक में पड़ी गाँठ को खींचे बिना सीधा करना कठिन होता है।",
    },
    images: ["goldChain"],
    guideSlug: "buying-guide",
    enquiry: "a light gold chain or pendant",
  },
  {
    slug: "diamond-and-gemstone-rings",
    name: { en: "Diamond and gemstone rings", hi: "हीरा और रत्न की अंगूठियाँ" },
    kicker: { en: "Rings", hi: "अंगूठियाँ" },
    summary: {
      en: "Solitaire, three-stone and single-stone rings set with diamonds or coloured gems.",
      hi: "सॉलिटेयर, तीन-पत्थर और एक-पत्थर की अंगूठियाँ, हीरे या रंगीन रत्नों के साथ।",
    },
    description: {
      en: "A diamond's price depends on carat, cut, colour, clarity and certification; a coloured stone's price depends on the species, its colour and how it is treated. Two rings that look alike on the hand can differ widely for those reasons, so a ring is quoted piece by piece rather than from a chart. Ask to see the stone under a loupe and ask for the certification details before deciding.",
      hi: "हीरे का दाम कैरेट, कट, रंग, स्पष्टता और प्रमाणन पर निर्भर करता है; रंगीन पत्थर का दाम उसकी किस्म, रंग और उपचार पर। हाथ में एक जैसी दिखने वाली दो अंगूठियाँ इन्हीं कारणों से बहुत अलग कीमत की हो सकती हैं, इसलिए अंगूठी की कीमत चार्ट से नहीं, हर टुकड़े के हिसाब से बताई जाती है। तय करने से पहले पत्थर को लूप में देखें और प्रमाणन का विवरण पूछें।",
    },
    occasions: [
      { en: "Engagement and wedding", hi: "सगाई और शादी" },
      { en: "Anniversary", hi: "सालगिरह" },
      { en: "A stone for a birth month", hi: "जन्म महीने का रत्न" },
    ],
    metals: {
      en: "18K gold is usual for diamond settings; gemstones are set in gold or silver depending on the piece.",
      hi: "हीरे की जड़ाई में सामान्यतः 18K सोना; रत्न टुकड़े के अनुसार सोने या चांदी में जड़े जाते हैं।",
    },
    care: {
      en: "Have the claws checked twice a year; a loose claw is what loses a stone, not the setting metal.",
      hi: "साल में दो बार कांटों की जाँच कराएँ; पत्थर कांटा ढीला होने से गिरता है, जड़ाई की धातु से नहीं।",
    },
    images: ["diamondRingWhite", "emeraldRingGold", "ringDiamond", "ringBlackDiamond", "rubyRing", "sapphireRing", "opalRing", "goldRingClassic"],
    guideSlug: "gemstone-basics",
    enquiry: "a diamond or gemstone ring",
  },
  {
    slug: "silver-and-pearls",
    name: { en: "Silver and pearls", hi: "चांदी और मोती" },
    kicker: { en: "Silver", hi: "चांदी" },
    summary: {
      en: "Silver jewellery and pearl strands, for everyday wear and gifting.",
      hi: "चांदी के गहने और मोती की लड़ियाँ, रोज़ पहनने और उपहार के लिए।",
    },
    description: {
      en: "Silver is the practical metal for large everyday pieces — anklets, oxidised chains, broad bands — because it costs a fraction of gold at the same size. Pearls are graded on shape, lustre, surface and size, and a strand is matched by eye, so no two strands are identical. Silver tarnishes naturally; that is a surface layer, not damage, and it comes off with a silver cloth.",
      hi: "बड़े रोज़ के गहनों के लिए चांदी व्यावहारिक धातु है — पायल, ऑक्सीडाइज़्ड चेन, चौड़ी पट्टियाँ — क्योंकि उसी आकार में सोने से उसकी कीमत बहुत कम होती है। मोतियों की ग्रेडिंग आकार, चमक, सतह और नाप से होती है, और लड़ी आँख से मिलाई जाती है, इसलिए दो लड़ियाँ एक जैसी नहीं होतीं। चांदी पर स्वाभाविक रूप से कालापन आता है; वह सतह की परत है, खराबी नहीं, और चांदी के कपड़े से हट जाती है।",
    },
    occasions: [
      { en: "Everyday wear", hi: "रोज़ पहनना" },
      { en: "Gifting a child or a sibling", hi: "बच्चे या भाई-बहन को उपहार" },
      { en: "Festive and traditional wear", hi: "त्योहार और पारंपरिक पहनावा" },
    ],
    metals: {
      en: "Silver (often 925 sterling) and cultured pearls; some pieces are gilt-silver.",
      hi: "चांदी (अक्सर 925 स्टर्लिंग) और कल्चर्ड मोती; कुछ टुकड़े गिल्ट-सिल्वर के हैं।",
    },
    care: {
      en: "Keep pearls away from perfume and hairspray, and wipe them with a soft cloth after wearing.",
      hi: "मोतियों को इत्र और हेयर स्प्रे से दूर रखें, और पहनने के बाद मुलायम कपड़े से पोंछें।",
    },
    images: ["silverDisplay", "silverAnklets", "pearls2", "pearls3"],
    guideSlug: "jewellery-care",
    enquiry: "silver jewellery or pearls",
  },
  {
    slug: "gold-coins-and-biscuits",
    name: { en: "Gold coins and biscuits", hi: "सोने के सिक्के और बिस्किट" },
    kicker: { en: "Saving", hi: "बचत" },
    summary: {
      en: "Fine gold in coin and biscuit form, for saving or gifting.",
      hi: "सिक्के और बिस्किट के रूप में शुद्ध सोना, बचत या उपहार के लिए।",
    },
    description: {
      en: "Coins and biscuits are sold by weight at the day's rate for their purity, with the making charge on a coin being much smaller than on a piece of jewellery. They are the usual choice for a wedding gift, a first gold purchase for a child, or for saving over time. The coin's weight, purity and any packaging certificate are recorded on the bill — check them before you leave the counter.",
      hi: "सिक्के और बिस्किट अपनी शुद्धता के उस दिन के भाव पर वज़न के हिसाब से बेचे जाते हैं, और सिक्के पर मेकिंग चार्ज गहने से बहुत कम होता है। शादी के उपहार, बच्चे की पहली सोने की खरीद, या समय के साथ बचत के लिए यही सामान्य विकल्प है। सिक्के का वज़न, शुद्धता और पैकेजिंग का प्रमाणपत्र बिल पर दर्ज होता है — काउंटर से निकलने से पहले उन्हें जाँच लें।",
    },
    occasions: [
      { en: "Wedding gifts", hi: "शादी के उपहार" },
      { en: "A child's first gold", hi: "बच्चे का पहला सोना" },
      { en: "Regular saving", hi: "नियमित बचत" },
    ],
    metals: {
      en: "Fine gold, usually 24K / 999, in the weights kept at the counter.",
      hi: "शुद्ध सोना, सामान्यतः 24K / 999, काउंटर पर रखे वज़नों में।",
    },
    care: {
      en: "Keep coins in their sealed pack; an opened pack is harder to exchange later.",
      hi: "सिक्के उनके सीलबंद पैक में ही रखें; खुला पैक बाद में बदलने में कठिनाई देता है।",
    },
    images: ["goldCoins", "goldBiscuit"],
    guideSlug: "gold-purity",
    enquiry: "gold coins or biscuits",
  },
  {
    slug: "mens-chains",
    name: { en: "Men's chains", hi: "पुरुषों की चेन" },
    kicker: { en: "For him", hi: "उनके लिए" },
    summary: {
      en: "Heavier gold chains and bracelets in the link styles men usually ask for.",
      hi: "पुरुषों के लिए सामान्यतः माँगे जाने वाले लिंक वाली भारी सोने की चेन और ब्रेसलेट।",
    },
    description: {
      en: "Men's chains are chosen by link and by length: a curb or rope link in 22K reads as traditional, a flatter box or Figaro link in 18K reads as modern. Length matters as much as weight — a chain should sit where you want it with the clasp at the back, not creep forward through the day. Ask for the weight and the purity on the bill, as with any gold piece.",
      hi: "पुरुषों की चेन लिंक और लंबाई से चुनी जाती है: 22K में कर्ब या रोप लिंक पारंपरिक लगता है, 18K में सपाट बॉक्स या फिगारो लिंक आधुनिक। लंबाई का महत्व वज़न जितना ही है — चेन वहीं बैठनी चाहिए जहाँ आप चाहते हैं, क्लैप पीछे रहे, और दिन भर आगे न सरके। किसी भी सोने के गहने की तरह बिल पर वज़न और शुद्धता अवश्य पूछें।",
    },
    occasions: [
      { en: "Wedding gift for a groom", hi: "वर को शादी का उपहार" },
      { en: "Everyday wear", hi: "रोज़ पहनना" },
      { en: "A milestone birthday", hi: "महत्वपूर्ण जन्मदिन" },
    ],
    metals: {
      en: "22K gold is usual; 18K is common for flatter, more detailed links.",
      hi: "सामान्यतः 22K सोना; सपाट और बारीक लिंक में 18K आम है।",
    },
    care: {
      en: "Open the clasp, not the chain, when taking it off — pulling a heavy link chain stretches it.",
      hi: "उतारते समय चेन नहीं, क्लैप खोलें — भारी लिंक वाली चेन खींचने से लंबी हो जाती है।",
    },
    images: [],
    guideSlug: "buying-guide",
    enquiry: "a men's chain",
  },
];

export const DESIGN_BY_SLUG: Record<string, DesignStyle> = Object.fromEntries(
  DESIGNS.map((design) => [design.slug, design]),
);

/** The photograph shown on a card, or null when the style has no photo yet. */
export function primaryImage(design: DesignStyle): string | null {
  return design.images[0] ?? null;
}

/** Styles with at least one photograph — used by the home page preview strip. */
export function designsWithPhotos(limit: number): DesignStyle[] {
  return DESIGNS.filter((design) => design.images.length > 0).slice(0, limit);
}
