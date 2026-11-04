import type { LocalizedText } from "@/lib/config";

/**
 * The festive women's campaign.
 *
 * Deliberately contains NO percentage, no "upto", no countdown and no promise.
 * A showroom offer is a commercial term the owner must supply; until it is
 * supplied, the panel invites the customer to ask what is running. Edit or
 * disable this in one place — nothing else prints an offer.
 */
export const FESTIVE_CAMPAIGN: {
  enabled: boolean;
  kicker: LocalizedText;
  title: LocalizedText;
  body: LocalizedText;
  note: LocalizedText;
} = {
  enabled: true,
  kicker: { en: "Festive season", hi: "त्योहार का मौसम" },
  title: { en: "Festive styling for women", hi: "महिलाओं के लिए फेस्टिव स्टाइलिंग" },
  body: {
    en: "Gold, silver and diamond sets to try on at the showroom — from light everyday pieces to full bridal sets.",
    hi: "शोरूम पर आज़माने के लिए सोने, चांदी और हीरे के सेट — हल्के रोज़ के गहनों से लेकर पूरे ब्राइडल सेट तक।",
  },
  note: {
    en: "Ask on WhatsApp about the schemes and offers available at the showroom this season.",
    hi: "इस सीज़न शोरूम पर उपलब्ध योजनाओं और ऑफ़र के बारे में WhatsApp पर पूछें।",
  },
};
