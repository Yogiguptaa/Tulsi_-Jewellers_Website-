import type { Dictionary } from "./en";

/** Hindi UI dictionary — must implement every key of `en` (enforced by TS). */
export const hi: Dictionary = {
  /* Common actions */
  "common.call": "कॉल करें",
  "common.whatsapp": "व्हाट्सएप",
  "common.close": "बंद करें",
  "common.menu": "मेन्यू",
  "common.loading": "लोड हो रहा है…",
  "common.share": "साझा करें",
  "common.copyLink": "लिंक कॉपी करें",
  "common.linkCopied": "लिंक कॉपी हो गई",
  "common.backToHome": "होम पर वापस जाएँ",
  "common.viewAll": "सभी देखें",
  "common.enquire": "पूछताछ करें",
  "common.visitStore": "हमारा स्टोर देखें",
  "common.notAvailable": "उपलब्ध नहीं",
  "common.yes": "हाँ",
  "common.no": "नहीं",

  /* Navigation */
  "nav.home": "होम",
  "nav.collections": "संग्रह",
  "nav.designs": "लोकप्रिय डिज़ाइन",
  "nav.rates": "सोना और चांदी भाव",
  "nav.scheme": "गोल्ड सेविंग स्कीम",
  "nav.gems": "रत्न संग्रह",
  "nav.visit": "हमसे मिलें",
  "visit.openNow": "अभी खुला है",
  "visit.closedNow": "अभी बंद है",
  "visit.closesAt": "{time} पर बंद होता है",
  "visit.opensAt": "{when} {time} पर खुलता है",
  "visit.today": "आज",
  "visit.tomorrow": "कल",
  "visit.hoursNote": "आज का समय पक्का करने के लिए शोरूम को फ़ोन करें।",
  "visit.bookTitle": "शोरूम विज़िट बुक करें",
  "visit.bookBody": "दिन और समय चुनें — हम व्हाट्सएप या फ़ोन पर पुष्टि करेंगे। हमारे उत्तर देने तक कोई विज़िट पक्की नहीं होती।",
  "visit.bookDay": "पसंदीदा दिन",
  "visit.bookSlot": "पसंदीदा समय",
  "visit.bookSubmit": "विज़िट अनुरोध भेजें",
  "visit.bookWhatsapp": "इसके बजाय व्हाट्सएप पर भेजें",
  "visit.bookConfirm": "हम व्हाट्सएप/फ़ोन पर पुष्टि करेंगे",
  "visit.bookClosed": "रविवार को शोरूम बंद रहता है — कोई और दिन चुनें।",
  "visit.bookPlaceholder": "अभी उपलब्ध नहीं — समय तय करने के लिए शोरूम को फ़ोन या व्हाट्सएप करें।",
  "search.paletteTitle": "खोजें या सीधे जाएँ",
  "search.paletteHint": "गहने, संग्रह, गाइड और पेज खोजने के लिए टाइप करें।",
  "search.recent": "हाल की खोजें",
  "search.noResults": "कुछ नहीं मिला। दूसरा शब्द आज़माएँ या व्हाट्सएप पर पूछें।",
  "search.open": "खोजें",
  "compare.title": "तुलना",
  "compare.add": "तुलना में जोड़ें",
  "compare.remove": "तुलना से हटाएँ",
  "compare.selected": "{count} चुने गए (अधिकतम 3)",
  "compare.hint": "शुद्धता, वज़न और कीमत की तुलना के लिए तीन तक वस्तुएँ चुनें।",
  "compare.clear": "तुलना हटाएँ",
  "compare.field": "विवरण",
  "compare.availability": "उपलब्धता",
  "compare.price": "कीमत",
  "wishlist.share": "यह सूची व्हाट्सएप पर भेजें",
  "wishlist.shareNote": "आपकी सहेजी वस्तुओं के नाम के साथ व्हाट्सएप खुलेगा। भेजने तक कुछ नहीं जाता।",
  "rates.shareImage": "आज का भाव साझा करें",
  "rates.shareText": "व्हाट्सएप पर भेजें",
  "scheme.calcTitle": "किश्तों का कुल",
  "scheme.calcBody": "अपनी मासिक राशि को किश्तों की संख्या से गुणा करके देखें कि कुल कितना जमा होगा। यहाँ कोई बोनस, लाभ या छूट की राशि नहीं दिखाई जाती।",
  "scheme.calcMonthly": "मासिक राशि (₹)",
  "scheme.calcMonths": "किश्तों की संख्या",
  "scheme.calcTotal": "कुल किश्तें",
  "scheme.calcBenefitNote": "लाभ की जानकारी स्टोर पर उपलब्ध — भुनाई पर क्या मिलेगा, यह आपके स्कीम कार्ड पर लिखा होता है।",
  "product.askWhatsapp": "इस गहने के बारे में पूछें",
  "nav.contact": "संपर्क",
  "nav.about": "हमारे बारे में",
  "nav.faq": "अक्सर पूछे जाने वाले प्रश्न",
  "nav.wishlist": "विशलिस्ट",

  /* Header */
  "header.searchPlaceholder": "सोना, चांदी, रत्न खोजें…",
  "header.search": "खोजें",
  "header.wishlist": "विशलिस्ट",
  "header.language": "भाषा बदलें",
  "header.themeToNight": "रात की थीम चुनें",
  "header.themeToDay": "दिन की थीम चुनें",
  "intro.skip": "इंट्रो छोड़ें",
  "header.switchToHindi": "हिंदी",
  "header.switchToEnglish": "English",
  "header.skipToContent": "मुख्य सामग्री पर जाएँ",
  "header.openMenu": "मेन्यू खोलें",
  "header.closeMenu": "मेन्यू बंद करें",

  /* Mega menu */
  "mega.title": "संग्रह",
  "mega.viewAll": "सभी संग्रह देखें",

  /* Footer */
  "footer.contact": "संपर्क",
  "footer.hours": "खुलने का समय",
  "footer.address": "पता",
  "footer.email": "ईमेल",
  "footer.quickLinks": "त्वरित लिंक",
  "footer.policies": "नीतियाँ",
  "footer.guides": "गहना गाइड",
  "footer.follow": "हमें फॉलो करें",
  "footer.deliveryTitle": "डिलीवरी",
  "footer.rights": "© {year} तुलसी ज्वेलर्स। सर्वाधिकार सुरक्षित।",
  "footer.photoCredits": "तस्वीरें और वीडियो",
  "footer.areaNote": "हंसापुरी, नागपुर में ज्वेलरी शोरूम",
  "footer.tagline": "आपका विश्वास, हमारी पहचान",

  /* Mobile bottom bar */
  "mobile.home": "होम",
  "mobile.collections": "संग्रह",
  "mobile.rates": "भाव",
  "mobile.whatsapp": "व्हाट्सएप",
  "mobile.visit": "पता",

  /* Floating widgets */
  "rates.viewRates": "भाव देखें",
  "whatsapp.fab": "व्हाट्सएप पर बात करें",

  /* Errors / 404 */
  "notFound.title": "पेज नहीं मिला",
  "notFound.body": "आप जिस पेज को खोज रहे हैं वह मौजूद नहीं है या कहीं और चला गया है।",
  "error.title": "कुछ गड़बड़ हो गई",
  "error.body": "कृपया फिर से प्रयास करें। समस्या बनी रहे तो तुलसी ज्वेलर्स से संपर्क करें।",
  "error.retry": "फिर से प्रयास करें",

  /* Common — extended */
  "common.submit": "पूछताछ भेजें",
  "common.sending": "भेजा जा रहा है…",
  "common.required": "आवश्यक",
  "common.optional": "वैकल्पिक",
  "common.readMore": "और पढ़ें",
  "common.showAll": "सभी दिखाएँ",
  "common.showLess": "कम दिखाएँ",
  "common.name": "आपका नाम",
  "common.phone": "फ़ोन नंबर",
  "common.email": "ईमेल (वैकल्पिक)",
  "common.message": "संदेश",
  "common.directions": "रास्ता देखें",
  "common.callNow": "अभी कॉल करें",
  "common.home": "होम",
  "common.price": "कीमत",
  "common.from": "से",
  "common.thankYou": "धन्यवाद",
  "common.back": "वापस",
  "common.next": "आगे",
  "common.filteredBy": "फ़िल्टर",

  /* Home page */
  "home.heroKicker": "ज्वेलरी शोरूम • हंसापुरी, नागपुर",
  "home.explore": "संग्रह देखें",
  "home.viewRates": "सोना और चांदी भाव देखें",
  "home.whatsapp": "हमें व्हाट्सएप करें",
  "home.heroTitle": "हंसापुरी, नागपुर में सोना, चांदी और रत्न",
  "home.heroBody":
    "हंसापुरी, नागपुर का ज्वेलरी शोरूम — सोने के गहने, सोने के सिक्के व बिस्किट, चांदी, फैंसी ज्वेलरी और रत्न संग्रह, साथ ही ₹499 से शुरू होने वाली मासिक गोल्ड सेविंग स्कीम।",
  "home.trustTitle": "तुलसी ज्वेलर्स क्यों",
  "home.trustSubtitle": "आने से पहले कुछ बातें जान लें।",
  "home.collectionsTitle": "हमारे संग्रह",
  "home.collectionsSubtitle": "सोने के गहनों से लेकर रत्न संग्रह तक छह सूचीबद्ध संग्रह।",
  "home.featuredKicker": "काउंटर से",
  "home.featuredTitle": "विशेष वस्तुएँ",
  "home.featuredSubtitle": "शोरूम में उपलब्ध वस्तुओं की शैलियों की झलक।",
  "home.ratesTitle": "आज का सोना-चांदी भाव",
  "home.ratesSubtitle": "आज का भाव, स्रोत और अपडेट के समय सहित।",
  "home.schemeTitle": "गोल्ड सेविंग स्कीम",
  "home.schemeBody":
    "अपनी पसंद के गहनों के लिए हर महीने निश्चित राशि जमा करें। स्कीम ₹499 से शुरू होती है और पूरी शर्तें शोरूम पर बताई जाती हैं। इस वेबसाइट पर कोई ऑनलाइन भुगतान नहीं लिया जाता।",
  "home.schemeCta": "स्कीम कैसे काम करती है",
  "home.visitTitle": "शोरूम पर आएँ",
  "home.visitBody":
    "आकर गहने स्वयं देखें और सीधे हमसे बात करें। आने से पहले कॉल या संदेश करें — जो वस्तुएँ देखना चाहते हैं, हम तैयार रखेंगे।",
  "home.faqTitle": "अक्सर पूछे जाने वाले प्रश्न",
  "home.faqSubtitle": "शोरूम, संग्रह, डिलीवरी और भाव से जुड़े सीधे उत्तर।",
  "home.guidesTitle": "गहना गाइड",
  "home.guidesSubtitle": "शुद्धता, हॉलमार्क, रत्न और देखभाल की सरल भाषा में जानकारी।",
  "home.deliveryTitle": "डिलीवरी",
  "home.reviewsTitle": "ग्राहक क्या कहते हैं",
  "home.reviewsSubtitle":
    "मोहल्ले के शोरूम से खरीदारी का अनुभव, हमारे पास आने वाले लोगों की ज़ुबानी।",

  /* Catalogue */
  "catalogue.searchPlaceholder": "सोना, चांदी, रत्न खोजें…",
  "catalogue.searchLabel": "कैटलॉग में खोजें",
  "catalogue.clearSearch": "खोज हटाएँ",
  "catalogue.filters": "फ़िल्टर",
  "catalogue.showResults": "{count} वस्तुएँ दिखाएँ",
  "catalogue.quickView": "झलक देखें",
  "catalogue.quickViewClose": "झलक बंद करें",
  "catalogue.sortBy": "क्रम",
  "catalogue.clearAll": "सभी हटाएँ",
  "catalogue.any": "कोई भी",
  "catalogue.filterMetal": "धातु",
  "catalogue.filterPurity": "शुद्धता",
  "catalogue.filterFor": "किसके लिए",
  "catalogue.filterOccasion": "अवसर",
  "catalogue.filterAvailability": "उपलब्धता",
  "catalogue.filterStone": "रत्न",
  "catalogue.browseByType": "प्रकार से देखें",
  "catalogue.itemSingular": "वस्तु",
  "catalogue.itemPlural": "वस्तुएँ",
  "catalogue.noResultsTitle": "इन फ़िल्टर से कोई वस्तु नहीं मिली",
  "catalogue.noResultsBody":
    "कोई फ़िल्टर हटाकर देखें, या सीधे हमसे पूछें — शोरूम में इस सूची से अधिक वस्तुएँ हैं।",
  "catalogue.emptyTitle": "नए डिज़ाइन आ रहे हैं",
  "catalogue.emptyBody":
    "हमारे नए डिज़ाइन देखने के लिए शोरूम आएं या व्हाट्सएप पर संपर्क करें।",
  "catalogue.emptyCta": "व्हाट्सएप पर संपर्क करें",
  "catalogue.priceOnEnquiry": "कीमत पूछें",
  "catalogue.purity": "शुद्धता",
  "catalogue.weight": "अनुमानित वज़न",
  "catalogue.itemCode": "आइटम कोड",
  "catalogue.viewDetails": "विवरण देखें",
  "catalogue.enquireShort": "पूछें",
  "catalogue.enquireWhatsapp": "व्हाट्सएप पर पूछें",
  "catalogue.enquireCall": "शोरूम को कॉल करें",
  "catalogue.wishlistAdd": "विशलिस्ट में जोड़ें",
  "catalogue.wishlistRemove": "विशलिस्ट से हटाएँ",
  "catalogue.availability": "उपलब्धता",
  "catalogue.description": "विवरण",
  "catalogue.specifications": "जानकारी",
  "catalogue.related": "ये भी देखें",
  "catalogue.backToCollections": "संग्रह पर वापस जाएँ",
  "catalogue.notFoundTitle": "वस्तु नहीं मिली",
  "catalogue.notFoundBody": "यह वस्तु अब सूचीबद्ध नहीं है। संग्रह देखें या व्हाट्सएप पर हमसे पूछें।",
  "catalogue.shareItem": "यह वस्तु साझा करें",
  "catalogue.galleryLabel": "फ़ोटो {index} / {total}",
  "catalogue.stoneDetails": "रत्न विवरण",
  "catalogue.allItems": "सभी वस्तुएँ",
  "catalogue.typeChipsLabel": "गहनों के प्रकार",
  "catalogue.viewTypeAll": "सभी {type} देखें",

  /* Collections */
  "collections.title": "संग्रह",
  "collections.kicker": "शोरूम में क्या उपलब्ध है",
  "collections.subtitle":
    "सोने के गहने, सोने के सिक्के व बिस्किट, चांदी के गहने, फैंसी ज्वेलरी और रत्न संग्रह।",
  "collections.count": "{count} लिस्टिंग",
  "collections.explore": "संग्रह देखें",

  /* Wishlist */
  "wishlist.title": "विशलिस्ट",
  "wishlist.subtitle": "इस ब्राउज़र में सहेजी गई वस्तुएँ।",
  "wishlist.emptyTitle": "आपकी विशलिस्ट खाली है",
  "wishlist.emptyBody": "किसी भी वस्तु पर दिल का निशान दबाएँ — वह यहाँ सहेज ली जाएगी। ये केवल इसी डिवाइस पर रहती हैं।",
  "wishlist.localNote":
    "आपकी विशलिस्ट केवल इस ब्राउज़र में रखी जाती है — हमें नहीं भेजी जाती और इसके लिए खाता नहीं चाहिए।",
  "wishlist.clear": "विशलिस्ट खाली करें",
  "wishlist.cleared": "विशलिस्ट खाली कर दी गई",
  "wishlist.itemCount": "{count} सहेजी गई",
  "wishlist.missing": "कुछ सहेजी गई वस्तुएँ अब सूचीबद्ध नहीं हैं, इसलिए छोड़ दी गईं।",

  /* Rates */
  "home.trendingKicker": "डिज़ाइन प्रेरणा",
  "home.trendingTitle": "लोकप्रिय स्टाइल",
  "home.trendingNote":
    "लोकप्रिय डिज़ाइन। काउंटर पर क्या है यह अक्सर बदलता है: नवीनतम देखने के लिए हमें संदेश करें।",
  "home.trendingAsk": "व्हाट्सऐप पर पूछें",
  "home.designsSeeAll": "लोकप्रिय डिज़ाइन देखें",

  /* Bangles */
  "bangles.kicker": "चूड़ी-कक्ष",
  "bangles.title": "कड़े, मीनाकारी और जड़ाऊ सोना",
  "bangles.note":
    "चार डिज़ाइन जिनके नाम ग्राहक खुद लेकर आते हैं। काउंटर पर हर हफ़्ते कुछ बदलता है, इसलिए आने से पहले हमसे पूछ लें।",
  "bangles.cta": "सोने का संग्रह देखें",
  "bangles.ask": "चूड़ियों के बारे में पूछें",
  "bangles.footnote":
    "लोकप्रिय डिज़ाइन। काउंटर पर क्या है यह अक्सर बदलता है: नवीनतम देखने के लिए हमें संदेश करें। हर तस्वीर का श्रेय image-credits पेज पर दर्ज है।",

  "rates.title": "सोना और चांदी भाव",
  "rates.kicker": "आज का सोना-चांदी भाव",
  "rates.subtitle":
    "आज का भाव, स्रोत और अपडेट के समय के साथ। मेकिंग चार्ज डिज़ाइन और गुणवत्ता के अनुसार बदलता है और दुकान पर तय होता है।",
  "rates.spotSource": "स्पॉट भाव स्रोत:",
  "rates.asOn": "दिनांक",
  "rates.source": "स्रोत",
  "rates.sources": "स्रोत",
  "rates.sourceUnavailable": "स्रोत घोषित नहीं",
  "rates.ratePendingApproval": "भाव अद्यतन शोरूम की स्वीकृति की प्रतीक्षा में",
  "rates.session": "सत्र",
  "rates.change": "बदलाव",
  "rates.makingUnstated": "मेकिंग चार्ज शामिल नहीं",
  "rates.unavailable": "भाव उपलब्ध नहीं",
  "rates.disclaimerTitle": "इस भाव में क्या शामिल है और क्या नहीं",
  "rates.historyTitle": "भाव इतिहास",
  "rates.historySubtitle": "दिन-प्रतिदिन, हमारा प्रकाशित सोना-चांदी भाव।",
  "rates.calculatorTitle": "धातु मूल्य कैलकुलेटर",
  "rates.calculatorSubtitle":
    "आज के प्रकाशित भाव से किसी वस्तु का धातु मूल्य अनुमानित करें। यह अनुमान है, कोई कोटेशन नहीं।",
  "rates.viewHistory": "भाव इतिहास देखें",
  "rates.openCalculator": "कैलकुलेटर खोलें",
  "rates.tickerLabel": "आज का भाव",
  "rates.staleNotice": "नवीनतम सत्यापित भाव अस्थायी रूप से अनुपलब्ध",
  "rates.noData":
    "आज का भाव अपडेट हो रहा है। कृपया आज का भाव जानने के लिए कॉल या व्हाट्सएप करें।",
  "rates.staleConfirm": "कृपया आज का भाव दुकान पर पुष्टि करें।",
  "rates.notConfiguredNote":
    "अगर आज का भाव पेज पर नहीं है, तो हमें कॉल या व्हाट्सएप करें — हम मौजूदा भाव बता देंगे।",
  "rates.noValue": "—",
  "rates.unitPer10g": "प्रति 10 ग्राम",
  "rates.unitPerKg": "प्रति किलोग्राम",
  "rates.historyEmpty": "अभी कोई भाव इतिहास दर्ज नहीं हुआ है।",
  "rates.historyEmptyBody":
    "हर दिन प्रकाशित होते ही भाव यहाँ दिखेंगे। तब तक मौजूदा भाव के लिए कृपया कॉल या व्हाट्सएप करें।",
  "rates.historyRange": "पिछले {days} दिन",
  "rates.date": "दिनांक",
  "rates.seriesGold999": "सोना 999 / 24K (प्रति 10 ग्राम)",
  "rates.seriesGold916": "सोना 916 / 22K (प्रति 10 ग्राम)",
  "rates.seriesGold833": "सोना 833 / 20K (प्रति 10 ग्राम)",
  "rates.seriesGold750": "सोना 750 / 18K (प्रति 10 ग्राम)",
  "rates.seriesGold585": "सोना 585 / 14K (प्रति 10 ग्राम)",
  "rates.seriesSilver999": "चांदी 999 (प्रति किलोग्राम)",

  /* Calculator */
  "calc.title": "धातु मूल्य कैलकुलेटर",
  "calc.kicker": "केवल अनुमान",
  "calc.subtitle":
    "आज के भाव से किसी वस्तु का धातु मूल्य निकालें। मेकिंग चार्ज और कर यहाँ अनुमानित नहीं किए जाते — वे वस्तु पर निर्भर हैं और दुकान पर तय होते हैं।",
  "calc.metal": "धातु",
  "calc.purity": "शुद्धता",
  "calc.weight": "वज़न (ग्राम)",
  "calc.weightPlaceholder": "जैसे 8.5",
  "calc.metalValue": "धातु मूल्य",
  "calc.estimatedMetalValue": "अनुमानित धातु मूल्य",
  "calc.makingCharges": "मेकिंग चार्ज",
  "calc.wastage": "वेस्टेज",
  "calc.stoneCharges": "पत्थर शुल्क",
  "calc.total": "अनुमानित कुल",
  "calc.notPublished": "शोरूम द्वारा प्रकाशित नहीं",
  "calc.unpublishedNote":
    "शोरूम ने ये घटक अभी प्रकाशित नहीं किए, इसलिए इन्हें अनुमान लगाकर जोड़ने के बजाय छोड़ दिया गया है: {items}।",
  "calc.noRateTitle": "आज का भाव अपडेट हो रहा है",
  "calc.noRateBody": "कृपया आज का भाव जानने के लिए कॉल या व्हाट्सएप करें।",
  "calc.estimateNote":
    "दिखाए गए भाव सांकेतिक हैं। अंतिम कीमत वस्तु, मेकिंग चार्ज और लागू करों पर निर्भर करती है, जो तुलसी ज्वेलर्स पर तय होती है।",
  "calc.reset": "रीसेट",
  "calc.rateUsed": "उपयोग किया गया भाव",
  "calc.perGram": "प्रति ग्राम समतुल्य",
  "calc.invalidWeight": "शून्य से अधिक वज़न दर्ज करें।",

  /* Enquiry form */
  "enquiry.title": "पूछताछ भेजें",
  "enquiry.subtitle":
    "आपको क्या चाहिए बताएँ — शोरूम आपसे संपर्क करेगा। इस वेबसाइट पर कोई भुगतान नहीं लिया जाता।",
  "enquiry.subject": "पूछताछ विषय",
  "enquiry.consent": "मैं इस पूछताछ के संबंध में संपर्क किए जाने से सहमत हूँ।",
  "enquiry.success": "धन्यवाद — आपकी पूछताछ शोरूम तक पहुँच गई है।",
  "enquiry.successNote": "हम आपके दिए नंबर पर उत्तर देंगे। अत्यावश्यक हो तो कृपया कॉल या संदेश करें।",
  "enquiry.errorGeneric":
    "अभी पूछताछ भेजी नहीं जा सकी। कृपया शोरूम को कॉल या व्हाट्सएप करें ताकि हम आपसे जुड़े रहें।",
  "enquiry.rateLimited":
    "इस डिवाइस से बहुत अधिक पूछताछ भेजी गई है। कृपया कॉल या व्हाट्सएप करें।",
  "enquiry.callInstead": "बात करना चाहें?",
  "enquiry.orWhatsapp": "या व्हाट्सएप पर संदेश भेजें",
  "enquiry.requiredMark": "आवश्यक फ़ील्ड चिह्नित हैं।",
  "enquiry.optionalMark": "बाकी सभी वैकल्पिक हैं।",
  "enquiry.messagePlaceholder": "आप क्या जानना चाहते हैं?",
  "enquiry.schemeAmount": "मासिक बचत राशि (₹)",
  "enquiry.preferredVisit": "विज़िट का पसंदीदा दिन / समय",

  /* Visit us */
  "visit.title": "हमसे मिलें",
  "visit.kicker": "आकर गहने स्वयं देखें",
  "visit.subtitle":
    "शोरूम हंसापुरी, नागपुर में है। आने से पहले कॉल या संदेश करें — जो वस्तुएँ देखना चाहते हैं, हम तैयार रखेंगे।",
  "visit.mapTitle": "शोरूम का स्थान",
  "visit.mapNote":
    "शोरूम को मैप पर देखने के लिए ‘मैप लोड करें’ दबाइए। फिर रास्ता देखने के लिए ‘दिशा-निर्देश’ इस्तेमाल कीजिए।",
  "visit.loadMap": "मैप लोड करें",
  "visit.addressTitle": "पता",
  "visit.hoursTitle": "खुलने का समय",
  "visit.phoneTitle": "फ़ोन",
  "visit.distanceTitle": "आपसे दूरी",
  "visit.distanceBody":
    "आप शोरूम से अनुमानित सीधी दूरी देखने के लिए ब्राउज़र से अपनी लोकेशन माँग सकते हैं। गणना इसी पेज पर होती है — आपके निर्देशांक हमें नहीं भेजे जाते और संग्रहित नहीं होते।",
  "visit.findDistance": "मेरी दूरी दिखाएँ",
  "visit.distanceResult": "लगभग {km} किमी दूर (सीधी रेखा में)।",
  "visit.distanceDenied": "लोकेशन की अनुमति नहीं मिली, इसलिए दूरी नहीं दिखाई गई।",
  "visit.distanceUnsupported": "यह डिवाइस लोकेशन उपलब्ध नहीं कराता।",
  "visit.distanceUnavailable": "शोरूम के सटीक निर्देशांक अभी प्रकाशित नहीं हुए, इसलिए दूरी की गणना संभव नहीं है।",
  "visit.beforeYouCome": "आने से पहले",
  "visit.directionsNote": "‘रास्ता देखें’ लिंक गूगल मैप्स में तुलसी ज्वेलर्स को गंतव्य के रूप में खोलता है — इसमें कोई API कुंजी या शुल्क नहीं लगता।",

  /* Contact */
  "contact.title": "संपर्क करें",
  "contact.kicker": "शोरूम से बात करें",
  "contact.subtitle":
    "कॉल करें, व्हाट्सएप पर संदेश भेजें या फ़ॉर्म से पूछताछ करें। पूछताछ का उत्तर शोरूम देता है; इस वेबसाइट पर कोई भुगतान नहीं लिया जाता।",
  "contact.phonesTitle": "फ़ोन नंबर",
  "contact.formTitle": "हमें संदेश भेजें",
  "contact.primaryPending":
    "दोनों नंबरों पर शोरूम से बात होती है। जल्दी पूछने के लिए कॉल करें, या तस्वीर भेजनी हो तो व्हाट्सएप कीजिए।",

  /* FAQ */
  "faq.title": "अक्सर पूछे जाने वाले प्रश्न",
  "faq.kicker": "सीधे उत्तर",
  "faq.subtitle": "शोरूम, संग्रह, डिलीवरी, भाव और सेविंग स्कीम से जुड़े उत्तर।",
  "faq.stillQuestions": "अभी भी कोई प्रश्न है?",
  "faq.stillQuestionsBody": "शोरूम को कॉल या संदेश करें — हम सीधे उत्तर देंगे।",

  /* Scheme */
  "scheme.kicker": "हर महीने बचत",
  "scheme.title": "गोल्ड सेविंग स्कीम",
  "scheme.subtitle":
    "अपनी पसंद के गहनों के लिए सरल मासिक बचत योजना। कोई ऑनलाइन भुगतान नहीं — जुड़ाव और भुगतान शोरूम पर।",
  "scheme.howItWorks": "यह कैसे काम करती है",
  "scheme.step": "चरण {index}",
  "scheme.termsTitle": "स्कीम की शर्तें",
  "scheme.enrolTitle": "अपनी रुचि दर्ज करें",
  "scheme.enrolBody":
    "पूछताछ भेजें — शोरूम स्कीम, मासिक राशि और शर्तें समझाएगा। इस वेबसाइट पर कोई ऑनलाइन भुगतान नहीं है।",

  /* Gems */
  "gems.kicker": "रत्न संग्रह",
  "gems.title": "रत्न संग्रह",
  "gems.subtitle":
    "माणिक्य, पुखराज, पन्ना, नीलम, मोती और अमेथिस्ट की वस्तुएँ।",
  "gems.disclaimerTitle": "रत्नों के बारे में",
  "gems.disclaimerBody":
    "रत्न की उत्पत्ति, ट्रीटमेंट और प्रमाणन की जानकारी तभी प्रकाशित की जाती है जब शोरूम सत्यापित जानकारी देता है। सदैव पूछें कि आपको कौन-सा रत्न दिखाया जा रहा है और क्या प्रमाणपत्र मिलता है।",

  /* About */
  "about.title": "हमारे बारे में",
  "about.kicker": "तुलसी ज्वेलर्स, हंसापुरी",
  "about.subtitle":
    "हंसापुरी, नागपुर का पारिवारिक ज्वेलरी शोरूम — हम कहाँ हैं, हमारे पास क्या है, और काउंटर पर हम कैसे काम करते हैं।",
  "about.ownerInput": "शोरूम पर पूछें",
  "about.servicesTitle": "और भी मदद",
  "about.servicesSubtitle": "इनके बारे में काउंटर पर पूछिए — क्या संभव है, हम बता देंगे।",
  "about.serviceConfirmed": "उपलब्ध",
  "about.serviceUnconfirmed": "काउंटर पर पूछें",
  "about.establishedTitle": "{year} से सेवा में",
  "about.establishedBody":
    "तुलसी ज्वेलर्स {year} से हंसापुरी का हिस्सा है। काउंटर पर आज भी परिवार स्वयं बैठता है, इसलिए जो आपसे बात करता है वही स्टॉक भी जानता है।",
  "about.collectionsLine":
    "छह संग्रह: सोने के गहने, सोने के सिक्के, फाइन गोल्ड बुलियन बिस्किट, चांदी के गहने, फैंसी ज्वेलरी और रत्न।",

  /* Guides */
  "guides.title": "गहना गाइड",
  "guides.kicker": "खरीदने से पहले जानें",
  "guides.subtitle":
    "सोने की शुद्धता, हॉलमार्किंग, रत्न, देखभाल और खरीदारी की सामान्य, तथ्यात्मक जानकारी। ये हमारी नीतियों या स्टॉक के बारे में कथन नहीं हैं।",
  "guides.readGuide": "गाइड पढ़ें",
  "guides.minutes": "{count} मिनट पढ़ें",
  "guides.otherGuides": "अन्य गाइड",
  "guides.backToGuides": "सभी गाइड पर वापस जाएँ",

  /* Policies */
  "policy.kicker": "नीतियाँ",
  "policy.contactTitle": "इस नीति के लिए किससे संपर्क करें",
  "policy.bindingTitle": "कौन-सा दस्तावेज़ मान्य है",
  "policy.bindingBody":
    "शोरूम पर आपको दिया गया लिखित बिल या स्कीम कार्ड ही वह दस्तावेज़ है जिसमें आपकी वास्तविक शर्तें लिखी होती हैं। यदि यहाँ लिखी कोई बात और वह दस्तावेज़ भिन्न हों, तो आपको दिया गया दस्तावेज़ मान्य होगा — इसलिए भुगतान से पहले उसे लिखित में माँग लें।",
  "policy.otherPolicies": "अन्य नीतियाँ",

  /* Image credits */
  "credits.title": "चित्र श्रेय",
  "credits.kicker": "लाइसेंस और श्रेय",
  "credits.subtitle":
    "इस साइट की तस्वीरें और छोटे वीडियो या तो शोरूम के अपने हैं या ऐसी लाइब्रेरी से हैं जिनका लाइसेंस व्यावसायिक उपयोग की अनुमति देता है। प्रत्येक स्टॉक फ़ाइल का श्रेय और लाइसेंस यहाँ दर्ज है।",
  "credits.body":
    "डिज़ाइन-प्रेरणा चित्र शैली दिखाते हैं, स्टॉक में रखी वस्तु नहीं। आज क्या उपलब्ध है, शोरूम से पूछें।",
  "credits.work": "कृति",
  "credits.credit": "श्रेय",
  "credits.license": "लाइसेंस",
  "credits.source": "स्रोत",
  "credits.sourcePage": "स्रोत पेज",
  "credits.empty": "कोई स्टॉक तस्वीर प्रयोग में नहीं है — सारे चित्र शोरूम के अपने हैं।",

  /* Share */
  "share.title": "साझा करें",
  "share.whatsapp": "व्हाट्सएप पर साझा करें",
  "share.native": "साझा करें…",

  /* Festival strip */
  "festival.today": "आज",
  "festival.tomorrow": "कल",
  "festival.inDays": "{days} दिन बाकी",
  "festival.greeting": "{name} की हार्दिक शुभकामनाएँ",
  "festival.cta": "व्हाट्सऐप पर पूछें",

  /* Structured / misc */
  "seo.guideSuffix": "गाइड",
  "misc.pageNotFound": "पेज नहीं मिला",
};
