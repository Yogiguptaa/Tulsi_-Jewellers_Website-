/**
 * content/faq.ts — bilingual FAQ.
 *
 * Rules honoured here:
 *  • Only facts the owner has supplied or that are structurally true appear.
 *  • Delivery answers use the exact mandatory wording from config.DELIVERY.
 *  • Anything unknown points to the placeholder in config.ts rather than a guess.
 *  • No claim about certifications, guarantees, prices or awards is made.
 */

import { CONTACT, DELIVERY, RATE_DISCLAIMER, ROUTES, SCHEME, SITE } from "@/lib/config";

export type FaqItem = {
  id: string;
  question: { en: string; hi: string };
  answer: { en: string; hi: string };
  /** Grouping used on the FAQ page. */
  group: "store" | "products" | "delivery" | "rates" | "scheme";
};

export const FAQ_GROUP_LABELS: Record<FaqItem["group"], { en: string; hi: string }> = {
  store: { en: "Store & visiting", hi: "शोरूम और विज़िट" },
  products: { en: "Products", hi: "उत्पाद" },
  delivery: { en: "Delivery & service", hi: "डिलीवरी और सेवा" },
  rates: { en: "Rates & pricing", hi: "भाव और कीमत" },
  scheme: { en: "Gold saving scheme", hi: "गोल्ड सेविंग स्कीम" },
};

export const FAQ_ITEMS: FaqItem[] = [
  {
    id: "where",
    group: "store",
    question: {
      en: "Where is Tulsi Jewellers located?",
      hi: "तुलसी ज्वेलर्स कहाँ स्थित है?",
    },
    answer: {
      en: `We are at ${CONTACT.address.en}. The Visit Us page has the map, directions and our phone numbers.`,
      hi: `हम ${CONTACT.address.hi} पर हैं। विज़िट पेज पर मैप, रास्ता और फ़ोन नंबर दिए गए हैं।`,
    },
  },
  {
    id: "timings",
    group: "store",
    question: {
      en: "What are your store timings?",
      hi: "आपके स्टोर का समय क्या है?",
    },
    answer: {
      en: `We are open ${CONTACT.hours.en}. If you are planning a visit around a festival, call us first and we will confirm the timings.`,
      hi: `हम ${CONTACT.hours.hi} खुले रहते हैं। त्योहार के आसपास आने से पहले कॉल कर लें — हम समय बता देंगे।`,
    },
  },
  {
    id: "visit",
    group: "store",
    question: { en: "How can I visit the showroom?", hi: "मैं शोरूम कैसे आ सकता/सकती हूँ?" },
    answer: {
      en: "Call or message us on WhatsApp and we will share directions and confirm when it is convenient for you to visit. The Visit Us page has the map, our phone numbers and a Get Directions button.",
      hi: "कॉल करें या व्हाट्सएप पर संदेश भेजें — हम रास्ता बताएँगे और आपकी सुविधा का समय तय करेंगे। विज़िट पेज पर मैप, फ़ोन नंबर और ‘रास्ता देखें’ बटन उपलब्ध है।",
    },
  },
  {
    id: "directions",
    group: "store",
    question: { en: "How do I get directions?", hi: "रास्ता कैसे पता करें?" },
    answer: {
      en: "Open the Visit Us page and use the Get Directions button — it opens Google Maps with Tulsi Jewellers as the destination. You can also allow the location permission once to see your approximate distance from the showroom.",
      hi: "विज़िट पेज खोलें और ‘रास्ता देखें’ बटन दबाएँ — यह गूगल मैप्स में तुलसी ज्वेलर्स तक का रास्ता खोल देगा। आप एक बार लोकेशन की अनुमति देकर शोरूम से अनुमानित दूरी भी देख सकते हैं।",
    },
  },
  {
    id: "what-sell",
    group: "products",
    question: { en: "What jewellery do you sell?", hi: "आप कौन-से गहने बेचते हैं?" },    answer: {
      en: "Gold jewellery, gold coins, gold biscuits, silver jewellery, fancy jewellery and a gems (ratna) range. Each collection has its own page; for anything you do not see there, WhatsApp us and we will tell you what is on the counter.",
      hi: "सोने के गहने, सोने के सिक्के, सोने की बिस्किट, चांदी के गहने, फैंसी ज्वेलरी और रत्न रेंज। हर संग्रह का अपना पेज है; जो वहाँ नहीं दिखे, उसके लिए व्हाट्सएप करें — काउंटर पर क्या है, बता देंगे।",
    },
  },
  {
    id: "gold",
    group: "products",
    question: { en: "Do you sell gold jewellery?", hi: "क्या आप सोने के गहने बेचते हैं?" },
    answer: {
      en: "Yes. We keep gold jewellery, gold coins and fine gold biscuits, in 24K, 22K and 20K. For a particular design, WhatsApp us or ask at the counter.",
      hi: "हाँ। हमारे पास सोने के गहने, सोने के सिक्के और फाइन गोल्ड बिस्किट हैं, 24K, 22K और 20K में। किसी खास डिज़ाइन के लिए व्हाट्सएप करें या काउंटर पर पूछिए।",
    },
  },
  {
    id: "silver",
    group: "products",
    question: { en: "Do you sell silver jewellery?", hi: "क्या आप चांदी के गहने बेचते हैं?" },
    answer: {
      en: "Yes. Ask us for the silver range — if it is not on the Silver Jewellery page yet, we will tell you what is in the showroom.",
      hi: "हाँ। चांदी की रेंज के लिए पूछिए — अगर वह अभी चांदी के गहनों के पेज पर नहीं है, तो हम बता देंगे कि शोरूम में क्या है।",
    },
  },
  {
    id: "gems",
    group: "products",
    question: { en: "Do you sell gemstones (ratna)?", hi: "क्या आप रत्न बेचते हैं?" },
    answer: {
      en: "The gems collection includes ruby, citrine/topaz (pukhraj), emerald, sapphire, pearl and amethyst. Tell us the stone you have in mind and we will show you what we have.",
      hi: "रत्न संग्रह में माणिक्य, पुखराज, पन्ना, नीलम, मोती और अमेथिस्ट शामिल हैं। जिस रत्न की तलाश है, बताइए — जो हमारे पास है, दिखा देंगे।",
    },
  },
  {
    id: "custom",
    group: "products",
    question: { en: "Do you offer custom jewellery?", hi: "क्या आप कस्टम ज्वेलरी बनाते हैं?" },
    answer: {
      en: "Bring a photo, a sketch or a family piece to the showroom and ask us. We will tell you honestly what is possible for that design and what it would involve.",
      hi: "कोई तस्वीर, स्केच या परिवार का कोई गहना लेकर शोरूम आइए और पूछिए। हम ईमानदारी से बताएँगे कि उस डिज़ाइन में क्या संभव है और उसमें क्या लगेगा।",
    },
  },
  {
    id: "enquire-online",
    group: "products",
    question: { en: "Can I enquire about a product online?", hi: "क्या मैं ऑनलाइन उत्पाद के बारे में पूछ सकता/सकती हूँ?" },
    answer: {
      en: "Yes. Every product page has Enquire on WhatsApp, Call and a contact form. Enquiries reach the showroom for a reply; this website does not take payments online.",
      hi: "हाँ। हर उत्पाद पेज पर ‘व्हाट्सएप पर पूछें’, ‘कॉल करें’ और संपर्क फ़ॉर्म है। पूछताछ शोरूम तक पहुँचती है; यह वेबसाइट ऑनलाइन भुगतान नहीं लेती।",
    },
  },
  {
    id: "whatsapp",
    group: "products",
    question: { en: "Can I contact you on WhatsApp?", hi: "क्या मैं व्हाट्सएप पर संपर्क कर सकता/सकती हूँ?" },
    answer: {
      en: "Yes. The WhatsApp buttons open a chat with us and put your message in the box, so you only have to press send.",
      hi: "हाँ। व्हाट्सएप बटन हमारे साथ चैट खोलते हैं और आपका संदेश पहले से भर देते हैं — आपको सिर्फ़ भेजना है।",
    },
  },
  {
    id: "delivery-outside",
    group: "delivery",
    question: { en: "Do you deliver outside Nagpur?", hi: "क्या आप नागपुर के बाहर डिलीवरी करते हैं?" },
    answer: { en: DELIVERY.outsideNagpurNote, hi: DELIVERY.outsideNagpurNote },
  },
  {
    id: "delivery-nagpur",
    group: "delivery",
    question: { en: "Do you provide home delivery in Nagpur?", hi: "क्या नागपुर में होम डिलीवरी उपलब्ध है?" },
    answer: {
      en: `Within Nagpur, call us with your address and we will tell you the current position before you buy. ${DELIVERY.outsideNagpurNote}`,
      hi: `नागपुर के भीतर, अपने पते के साथ हमें कॉल करें — खरीदने से पहले हम मौजूदा स्थिति बता देंगे। ${DELIVERY.outsideNagpurNote}`,
    },
  },
  {
    id: "rates",
    group: "rates",
    question: { en: "How are your gold and silver rates shown?", hi: "सोने-चांदी के भाव कैसे दिखाए जाते हैं?" },
    answer: {
      en:
        "The Gold & Silver Rates page shows today's rate with its date and time, and the making-charge note that applies to it. " +
        RATE_DISCLAIMER,
      hi:
        "सोना-चांदी भाव पेज आज का भाव दिनांक और समय के साथ दिखाता है, और उस पर लागू मेकिंग चार्ज की बात भी। " +
        RATE_DISCLAIMER,
    },
  },
  {
    id: "price",
    group: "rates",
    question: { en: "Why is a price missing on some products?", hi: "कुछ उत्पादों पर कीमत क्यों नहीं दी गई?" },
    answer: {
      en: "A jewellery price depends on the day's metal rate, making charges, wastage and applicable taxes. Where we have not set a firm price, the piece reads Price on Enquiry. The calculator estimates metal value only.",
      hi: "गहने की कीमत उस दिन के धातु भाव, मेकिंग चार्ज, वेस्टेज और लागू करों पर निर्भर करती है। जहाँ निश्चित कीमत तय नहीं है, वहाँ ‘कीमत पूछें’ लिखा रहता है। कैलकुलेटर केवल धातु मूल्य का अनुमान देता है।",
    },
  },
  {
    id: "scheme",
    group: "scheme",
    question: { en: "How does the Gold Saving Scheme work?", hi: "गोल्ड सेविंग स्कीम कैसे काम करती है?" },
    answer: {
      en: `${SCHEME.name.en} starts from ₹${SCHEME.startingAmountINR} with monthly savings. Scheme terms are given in writing at the showroom. There are no online payments — the scheme is enquiry and visit based.`,
      hi: `${SCHEME.name.hi} ₹${SCHEME.startingAmountINR} से शुरू होती है और मासिक बचत पर आधारित है। स्कीम की पूरी शर्तें शोरूम पर लिखित रूप में दी जाती हैं। कोई ऑनलाइन भुगतान नहीं है — स्कीम पूछताछ और विज़िट आधारित है।`,
    },
  },
  {
    id: "reviews",
    group: "store",
    question: { en: "Where can I read customer reviews?", hi: "ग्राहक समीक्षाएँ कहाँ पढ़ सकते हैं?" },
    answer: {
      en: "We do not write reviews ourselves. Customers leave their own on our Google listing, and you are always welcome to ask us at the counter.",
      hi: "हम अपनी समीक्षाएँ खुद नहीं लिखते। ग्राहक अपनी बात हमारी गूगल लिस्टिंग पर लिखते हैं, और आप काउंटर पर हमसे कभी भी पूछ सकते हैं।",
    },
  },
  {
    id: "certification",
    group: "products",
    question: {
      en: "Do you provide hallmarking or diamond certification?",
      hi: "क्या आप हॉलमार्किंग या हीरा प्रमाणपत्र देते हैं?",
    },
    answer: {
      en: "If hallmarking or certification matters for the piece you are considering, ask us at the counter. We will show you the papers that come with it and explain what each one covers.",
      hi: "जिस गहने को आप देख रहे हैं, उसके हॉलमार्क या प्रमाणन के बारे में काउंटर पर पूछिए। उसके साथ आने वाले कागज़ हम दिखाएँगे और बताएँगे कि कौन-सा क्या बताता है।",
    },
  },
];

export const FAQ_ROUTE = ROUTES.faq;
export const FAQ_SITE_NAME = SITE.name.en;
