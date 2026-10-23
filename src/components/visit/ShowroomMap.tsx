"use client";

import { useState } from "react";
import { MapPin, Navigation, Ruler } from "lucide-react";
import { CONTACT, SITE, hasMapCoordinates, isPlaceholder, pick } from "@/lib/config";
import { useLanguage } from "@/components/providers/LanguageProvider";
import Notice from "@/components/ui/Notice";

/**
 * Showroom location block.
 *
 * NO GOOGLE API KEY IS USED ANYWHERE. The embed is the classic keyless
 * `maps.google.com/maps?q=…&output=embed` frame and the directions link is the
 * keyless `google.com/maps/dir/?api=1&destination=…` deep link, so there is no
 * billing account, no key to leak and nothing to configure.
 *
 * Nothing is loaded from Google until the visitor presses "Load map", and the
 * distance calculation runs entirely in the browser — coordinates are never sent
 * to this server or stored anywhere. That is exactly what the privacy page says.
 */
export default function ShowroomMap() {
  const { lang, t } = useLanguage();
  const [mapLoaded, setMapLoaded] = useState(false);
  const [distance, setDistance] = useState<string | null>(null);
  const [distanceError, setDistanceError] = useState<string | null>(null);

  // Search phrase used for both the embed and the directions deep link. Now that
  // the street address is published it is used in full, so the pin lands on the
  // shop rather than the middle of the locality; name + area stays as the
  // fallback for a deployment where the address has not been supplied.
  const query = isPlaceholder(pick(CONTACT.address, "en"))
    ? `${SITE.name.en} ${CONTACT.area.en}`
    : `${SITE.name.en}, ${pick(CONTACT.address, "en")}`;
  const embedSrc = `https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=14&output=embed`;
  const directionsHref = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`;

  const computeDistance = () => {
    setDistanceError(null);
    setDistance(null);

    if (!hasMapCoordinates()) {
      setDistanceError(t("visit.distanceUnavailable"));
      return;
    }
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setDistanceError(t("visit.distanceUnsupported"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const km = haversineKm(
          position.coords.latitude,
          position.coords.longitude,
          CONTACT.latitude as number,
          CONTACT.longitude as number,
        );
        setDistance(t("visit.distanceResult", { km: km.toFixed(1) }));
      },
      () => setDistanceError(t("visit.distanceDenied")),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300_000 },
    );
  };

  return (
    <div className="space-y-4">
      <div className="relative aspect-[16/10] w-full overflow-hidden border border-gold/25 bg-champagne/25">
        {mapLoaded ? (
          <iframe
            title={t("visit.mapTitle")}
            src={embedSrc}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="h-full w-full border-0"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
            <MapPin className="h-6 w-6 text-gold-600" aria-hidden="true" />
            <p className="max-w-md text-sm text-charcoal/70">{t("visit.mapNote")}</p>
            <button
              type="button"
              onClick={() => setMapLoaded(true)}
              className="rounded-sm bg-maroon px-5 py-2.5 text-sm font-medium text-offwhite hover:bg-maroon-700"
            >
              {t("visit.loadMap")}
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <a
          href={directionsHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-sm border border-gold/50 bg-offwhite px-4 py-2.5 text-sm font-medium text-charcoal hover:bg-champagne/60"
        >
          <Navigation className="h-4 w-4" aria-hidden="true" />
          {t("common.directions")}
        </a>
        <button
          type="button"
          onClick={computeDistance}
          className="inline-flex items-center gap-2 rounded-sm border border-gold/50 bg-offwhite px-4 py-2.5 text-sm font-medium text-charcoal hover:bg-champagne/60"
        >
          <Ruler className="h-4 w-4" aria-hidden="true" />
          {t("visit.findDistance")}
        </button>
      </div>

      <p className="text-xs text-charcoal/70">{t("visit.directionsNote")}</p>

      {distance ? <Notice tone="info">{distance}</Notice> : null}
      {distanceError ? <Notice tone="warning">{distanceError}</Notice> : null}

      {isPlaceholder(pick(CONTACT.address, lang)) ? (
        <Notice tone="placeholder" title={t("visit.addressTitle")}>
          <p>
            The full street address is being confirmed by the showroom. Until it is published, the map
            and the directions link search for {SITE.name.en} in {CONTACT.area.en}.
          </p>
        </Notice>
      ) : null}
    </div>
  );
}

/** Great-circle distance in kilometres. */
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}
