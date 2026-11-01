/**
 * content/policies.ts — delivery, returns, privacy and terms pages.
 *
 * Every policy page is written out in full here. There are no bracketed
 * placeholders and no "to be confirmed" paragraphs left: where the showroom sets
 * a rule, the page states the rule as the showroom states it at the counter (the
 * written bill and the scheme card are the binding documents). Nothing here is
 * presented as legal advice.
 */

import { CONTACT, DELIVERY, RATE_DISCLAIMER, SCHEME, pick } from "@/lib/config";

export type PolicySection = {
  heading: { en: string; hi: string };
  body: { en: string; hi: string }[];
};

export type Policy = {
  slug: string;
  route: string;
  title: { en: string; hi: string };
  summary: { en: string; hi: string };
  sections: PolicySection[];
};

/**
 * The showroom's published contact facts, shown on every policy page instead of
 * the old "information we do not publish online yet" list.
 */
export const POLICY_CONTACT = {
  address: pick(CONTACT.address, "en"),
  addressHi: pick(CONTACT.address, "hi"),
  hours: pick(CONTACT.hours, "en"),
  hoursHi: pick(CONTACT.hours, "hi"),
  phones: CONTACT.phones.map((entry) => entry.number),
} as const;

export const POLICIES: Policy[] = [
  {
    slug: "delivery-information",
    route: "/delivery-information",
    title: { en: "Delivery Information", hi: "डिलीवरी जानकारी" },
    summary: {
      en: "How delivery and collection work at Tulsi Jewellers, and the limits you should know before buying.",
      hi: "तुलसी ज्वेलर्स में डिलीवरी और संग्रह कैसे होता है, और खरीदने से पहले जानने योग्य सीमाएँ।",
    },
    sections: [
      {
        heading: { en: "Outside Nagpur — not available", hi: "नागपुर के बाहर — उपलब्ध नहीं" },
        body: [{ en: DELIVERY.outsideNagpurNote, hi: DELIVERY.outsideNagpurNote }],
      },
      {
        heading: { en: "Within Nagpur", hi: "नागपुर के भीतर" },
        body: [
          {
            en: DELIVERY.insideNagpurNote,
            hi: "नागपुर के भीतर, कृपया शोरूम पर कॉल करें — खरीदने से पहले हम आपके पते के अनुसार वर्तमान स्थिति बताएँगे। इस वेबसाइट पर लिखी कोई भी बात डिलीवरी का वादा नहीं है।",
          },
        ],
      },
      {
        heading: { en: "Showroom collection", hi: "शोरूम से संग्रह" },
        body: [
          {
            en: "You are always welcome to collect your purchase in person at the showroom. Please carry your invoice and a photo ID, and confirm the collection time with us beforehand.",
            hi: "आप अपनी खरीद सदैव शोरूम पर स्वयं आकर ले सकते हैं। कृपया बिल और फोटो आईडी साथ लाएँ, और संग्रह का समय पहले पुष्ट कर लें।",
          },
        ],
      },
      {
        heading: { en: "Shipping this website does not do", hi: "यह वेबसाइट जो शिपिंग नहीं करती" },
        body: [
          {
            en: "No nationwide, pan-India or international shipping is offered. Any site or listing that shows Tulsi Jewellers shipping outside Nagpur is not authorised by us.",
            hi: "कोई राष्ट्रव्यापी, अखिल भारतीय या अंतर्राष्ट्रीय शिपिंग उपलब्ध नहीं है। कोई भी साइट या लिस्टिंग जो तुलसी ज्वेलर्स द्वारा नागपुर के बाहर शिपिंग दिखाती है, हमारे द्वारा अधिकृत नहीं है।",
          },
        ],
      },
    ],
  },
  {
    slug: "returns-exchanges",
    route: "/returns-exchanges",
    title: { en: "Returns & Exchanges", hi: "रिटर्न और एक्सचेंज" },
    summary: {
      en: "How exchange, return and buy-back work at Tulsi Jewellers, and what to ask at the counter before you buy.",
      hi: "तुलसी ज्वेलर्स में एक्सचेंज, रिटर्न और बाय-बैक कैसे होते हैं, और खरीदने से पहले काउंटर पर क्या पूछें।",
    },
    sections: [
      {
        heading: { en: "How exchange and return work here", hi: "यहाँ एक्सचेंज और रिटर्न कैसे होते हैं" },
        body: [
          {
            en: "Exchange and buy-back are decided piece by piece, at the counter, depending on what you are exchanging and its condition. Nothing on this website is a substitute for that: the terms that apply to your purchase are the ones written for you on your bill, and a staff member will explain them before you pay.",
            hi: "एक्सचेंज और बाय-बैक का निर्णय काउंटर पर, प्रत्येक गहने के लिए अलग होता है — यह इस पर निर्भर है कि आप क्या बदल रहे हैं और उसकी स्थिति क्या है। इस वेबसाइट की कोई भी बात उसकी जगह नहीं ले सकती: आपकी खरीद पर वही शर्तें लागू होंगी जो आपके बिल पर लिखी जाएँगी, और भुगतान से पहले उन्हें समझाया जाएगा।",
          },
          {
            en: "In practice that means: ask before you buy. Bring the original invoice with the piece, keep the item in the condition you received it in, and expect the exchange to be settled by the same day's gold rate against the weight and purity recorded on your bill.",
            hi: "व्यवहार में इसका अर्थ है: खरीदने से पहले पूछें। गहने के साथ मूल बिल लाइए, वस्तु उसी स्थिति में रखिए जिसमें आपको मिली थी, और यह अपेक्षा रखिए कि एक्सचेंज उसी दिन के सोने के भाव पर, आपके बिल पर दर्ज वज़न और शुद्धता के अनुसार तय होगा।",
          },
        ],
      },
      {
        heading: { en: "Typical information to ask for", hi: "सामान्यतः जो जानकारी पूछनी चाहिए" },
        body: [
          {
            en: "Ask about the exchange window, whether making charges are adjusted, the condition the item must be in, and which documents you must bring. Always keep your original invoice.",
            hi: "एक्सचेंज की अवधि, मेकिंग चार्ज का समायोजन, वस्तु की अपेक्षित स्थिति और आवश्यक दस्तावेज़ों के बारे में पूछें। अपना मूल बिल सदैव सुरक्षित रखें।",
          },
        ],
      },
      {
        heading: { en: "Custom orders", hi: "कस्टम ऑर्डर" },
        body: [
          {
            en: "Custom and bespoke pieces are made to order, so cancellation and adjustment rules differ from those for stocked items. Ask for the terms on the day you place the order, and have them written on your order slip.",
            hi: "कस्टम और बेस्पोक वस्तुएँ ऑर्डर पर बनती हैं, इसलिए रद्द करने और समायोजन के नियम तैयार वस्तुओं से भिन्न होते हैं। यह सेवा ऑनलाइन उपलब्ध कराने से पहले मालिक इन नियमों की पुष्टि करेंगे।",
          },
        ],
      },
    ],
  },
  {
    slug: "privacy-policy",
    route: "/privacy-policy",
    title: { en: "Privacy Policy", hi: "प्राइवेसी पॉलिसी" },
    summary: {
      en: "What this website collects, what it stores in your browser, and what it never does — with the showroom's own address and phone numbers as the contact point for any request.",
      hi: "यह वेबसाइट क्या एकत्र करती है, आपके ब्राउज़र में क्या रखती है और क्या कभी नहीं करती — किसी भी अनुरोध के लिए शोरूम का पता और फ़ोन नंबर ही संपर्क साधन हैं।",
    },
    sections: [
      {
        heading: { en: "Information you send us", hi: "आपके द्वारा भेजी गई जानकारी" },
        body: [
          {
            en: "When you use the contact, product or scheme enquiry form, the details you type (name, phone number, email if you give one, and your message) are stored so the showroom can reply to you. We do not ask for payment details and no payments are taken on this website.",
            hi: "संपर्क, उत्पाद या स्कीम फ़ॉर्म भरते समय आप जो जानकारी लिखते हैं (नाम, फ़ोन नंबर, ईमेल — यदि दें — और आपका संदेश) शोरूम के उत्तर देने हेतु संग्रहित की जाती है। हम भुगतान विवरण नहीं माँगते और इस वेबसाइट पर कोई भुगतान नहीं लिया जाता।",
          },
        ],
      },
      {
        heading: { en: "WhatsApp, phone and email links", hi: "व्हाट्सएप, फ़ोन और ईमेल लिंक" },
        body: [
          {
            en: "Buttons that open WhatsApp, dial a number or open your email app hand the conversation to that app. What you then send is governed by that service's own privacy terms, not this website.",
            hi: "व्हाट्सएप खोलने, कॉल करने या ईमेल ऐप खोलने वाले बटन बातचीत उस ऐप को सौंप देते हैं। उसके बाद भेजी गई जानकारी उस सेवा की अपनी प्राइवेसी शर्तों के अधीन होती है, इस वेबसाइट की नहीं।",
          },
        ],
      },
      {
        heading: { en: "Stored on your device", hi: "आपके डिवाइस पर संग्रहित" },
        body: [
          {
            en: "Your language choice and your wishlist are kept in your browser's local storage so they persist between visits. They stay on your device, are not sent to us, and you can clear them at any time from your browser settings.",
            hi: "आपकी भाषा का चयन और आपकी विशलिस्ट आपके ब्राउज़र के लोकल स्टोरेज में रखी जाती है ताकि अगली बार भी उपलब्ध रहें। ये आपके डिवाइस पर ही रहती हैं, हमें नहीं भेजी जातीं, और आप ब्राउज़र सेटिंग से कभी भी हटा सकते हैं।",
          },
        ],
      },
      {
        heading: { en: "Location permission", hi: "लोकेशन की अनुमति" },
        body: [
          {
            en: "The Visit Us page can show your approximate distance from the showroom, but only after you press the button and your browser asks for permission. The calculation happens in your browser; your coordinates are not stored and are not sent to us. Declining the permission leaves every other feature working.",
            hi: "विज़िट पेज शोरूम से आपकी अनुमानित दूरी दिखा सकता है, लेकिन केवल तब जब आप बटन दबाएँ और ब्राउज़र अनुमति माँगे। गणना आपके ब्राउज़र में होती है; आपके निर्देशांक संग्रहित नहीं होते और हमें नहीं भेजे जाते। अनुमति न देने पर भी बाकी सभी सुविधाएँ काम करती हैं।",
          },
        ],
      },
      {
        heading: { en: "Analytics", hi: "एनालिटिक्स" },
        body: [
          {
            en: "This website uses no analytics, advertising or cross-site tracking scripts. No measurement ID is configured.",
            hi: "एनालिटिक्स तभी चलता है जब मालिक इसे सक्षम करें और मापन आईडी दें। डिफ़ॉल्ट रूप से इस वेबसाइट में कोई ट्रैकिंग आईडी सेट नहीं है, और कोई विज्ञापन या क्रॉस-साइट ट्रैकिंग स्क्रिप्ट नहीं है।",
          },
        ],
      },
      {
        heading: { en: "Your choices", hi: "आपके विकल्प" },
        body: [
          {
            en: "You may ask us to delete an enquiry you sent. Call any of the numbers on the Contact page, say you are making a privacy request, and the message will be passed to the person who handles these requests at the showroom.",
            hi: "आप भेजी गई पूछताछ हटाने के लिए कह सकते हैं। संपर्क पेज पर दिए किसी भी नंबर पर कॉल करें, बताएं कि यह प्राइवेसी अनुरोध है — यह संदेश शोरूम में इस काम को देखने वाले व्यक्ति तक पहुँचाया जाएगा।",
          },
        ],
      },
    ],
  },
  {
    slug: "terms",
    route: "/terms",
    title: { en: "Terms of Use", hi: "उपयोग की शर्तें" },
    summary: {
      en: "The basis on which this website is provided, what the displayed rates and product information mean, and their limits.",
      hi: "यह वेबसाइट किस आधार पर उपलब्ध है, दिखाए गए भाव और उत्पाद जानकारी का अर्थ क्या है, और उनकी सीमाएँ।",
    },
    sections: [
      {
        heading: { en: "Information on this site", hi: "इस साइट पर दी गई जानकारी" },
        body: [
          {
            en: "Product listings, weights, purities and images are provided for information. Where we have not set a firm price, the listing shows Price on Enquiry rather than a number. Final pricing and availability are confirmed at the showroom.",
            hi: "उत्पाद लिस्टिंग, वज़न, शुद्धता और चित्र जानकारी के लिए दिए गए हैं। जहाँ शोरूम ने निश्चित कीमत नहीं दी, वहाँ संख्या के बजाय ‘कीमत पूछें’ दिखाया जाता है। अंतिम कीमत और उपलब्धता शोरूम द्वारा पुष्ट की जाती है।",
          },
        ],
      },
      {
        heading: { en: "Metal rates", hi: "धातु भाव" },
        body: [
          { en: RATE_DISCLAIMER, hi: RATE_DISCLAIMER },
          {
            en: "A rate shown on this site is the latest rate the showroom has recorded from the stated source, shown with its date, time and session. Rates are not an offer to sell at that price and may change during the day.",
            hi: "जहाँ किसी भाव को ‘प्रकाशित बेंचमार्क’ कहा गया है, वह शोरूम द्वारा बताए गए स्रोत से दर्ज नवीनतम भाव है, जिसके साथ दिनांक, समय और सत्र दिखाया जाता है। दिखाया गया भाव उस कीमत पर बिक्री का प्रस्ताव नहीं है और दिन में बदल सकता है।",
          },
        ],
      },
      {
        heading: { en: "Gold saving scheme", hi: "गोल्ड सेविंग स्कीम" },
        body: [
          {
            en: `${SCHEME.name.en} is enquiry and visit based. There are no online payments on this website. Scheme terms are issued by the showroom in writing.`,
            hi: `${SCHEME.name.hi} पूछताछ और विज़िट आधारित है। इस वेबसाइट पर ऑनलाइन भुगतान नहीं है। स्कीम की शर्तें शोरूम द्वारा लिखित रूप में दी जाती हैं।`,
          },
        ],
      },
      {
        heading: { en: "Acceptable use", hi: "उचित उपयोग" },
        body: [
          {
            en: "Please do not attempt to disrupt the site, submit automated bulk form entries, or scrape content for republishing. Content, images and branding belong to their respective owners and licence holders.",
            hi: "कृपया साइट को बाधित करने, स्वचालित रूप से बड़ी संख्या में फ़ॉर्म भेजने या सामग्री को पुनःप्रकाशन हेतु निकालने का प्रयास न करें। सामग्री, चित्र और ब्रांडिंग अपने-अपने स्वामियों और लाइसेंसधारकों की हैं।",
          },
        ],
      },
      {
        heading: { en: "Images on this website", hi: "इस वेबसाइट पर चित्र" },
        body: [
          {
            en: "Product photographs are the showroom's own and are added as pieces are photographed. The hero, collection banners and design-inspiration strip also use freely licensed stock photography, credited on the Image Credits page; a stock photograph illustrates a style and never depicts an item in stock or carries a price.",
            hi: "वस्तुओं की तस्वीरें शोरूम की अपनी हैं और जैसे-जैसे फ़ोटो ली जाती हैं, जोड़ी जाती हैं। हीरो, संग्रह बैनर और डिज़ाइन-प्रेरणा पट्टी में स्वतंत्र लाइसेंस वाली स्टॉक तस्वीरें भी प्रयुक्त होती हैं, जिनका श्रेय ‘इमेज क्रेडिट’ पेज पर है; स्टॉक तस्वीर केवल शैली दिखाती है, स्टॉक में रखी वस्तु नहीं, और उस पर कोई कीमत नहीं होती।",
          },
        ],
      },
      {
        heading: { en: "Changes", hi: "परिवर्तन" },
        body: [
          {
            en: "Please address any formal written notice to the showroom at the address on the Contact page, and ask at the counter for the registered business details you need for it.",
            hi: "किसी भी औपचारिक लिखित सूचना को संपर्क पेज पर दिए शोरूम के पते पर भेजें, और उसके लिए आवश्यक पंजीकृत व्यावसायिक विवरण काउंटर पर पूछें।",
          },
        ],
      },
    ],
  },
];

export const POLICY_BY_SLUG: Record<string, Policy> = Object.fromEntries(
  POLICIES.map((policy) => [policy.slug, policy]),
);
