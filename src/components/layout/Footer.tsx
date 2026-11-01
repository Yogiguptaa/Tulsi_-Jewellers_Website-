"use client";

import Link from "next/link";
import { Mail, MapPin, Phone, Clock, MessageCircle } from "lucide-react";
import type { ComponentType } from "react";

/* Brand glyphs (lucide no longer ships social logos) */
function Instagram({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

function Facebook({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M14 8.5V6.8c0-.7.5-1.3 1.2-1.3H17V3h-2.5C12.6 3 11 4.6 11 6.8v1.7H9V11h2v10h3V11h2.2l.5-2.5H14z" />
    </svg>
  );
}

type SocialIcon = ComponentType<{ className?: string }>;
import {
  CONTACT,
  DELIVERY,
  FOOTER_GUIDE_LINKS,
  FOOTER_POLICY_LINKS,
  ROUTES,
  SITE,
  isPlaceholder,
  pick,
  telDisplay,
  telHref,
  whatsappHref,
} from "@/lib/config";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { mediaProviders } from "@/lib/catalogue/images";

export default function Footer({ year }: { year: number }) {
  const { lang, t } = useLanguage();
  const photoProviders = mediaProviders();

  const socials: { label: string; href: string; icon: SocialIcon }[] = [
    { label: "Instagram", href: CONTACT.instagram, icon: Instagram },
    { label: "Facebook", href: CONTACT.facebook, icon: Facebook },
  ].filter((item) => !isPlaceholder(item.href));

  return (
    <footer className="mt-16 border-t border-gold/40 bg-ink text-cream">
      <div className="container-page grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        {/* Brand */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element -- SVG mark */}
            <img src={SITE.logoSrc} alt="" width={44} height={44} className="h-11 w-11" />
            <span className="font-[family-name:var(--font-display)] text-xl text-cream">
              {pick(SITE.name, lang)}
            </span>
          </div>
          <p className="text-sm italic text-cream/70">{pick(SITE.tagline, lang)}</p>
          <p className="text-sm text-cream/70">{t("footer.areaNote")}</p>
          {/* There is no film to replay until the showroom supplies one, so this
              block is omitted rather than advertising a video that does not exist. */}
          {socials.length > 0 ? (
            <div className="flex gap-3">
              {socials.map(({ label, href, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="rounded-sm border border-gold/40 p-2 text-cream transition-colors hover:bg-maroon"
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </a>
              ))}
            </div>
          ) : null}
          {/* No social row at all until a real profile link exists — printing an
              unpublished value here would only be clutter for a customer. */}
        </div>

        {/* Contact / NAP — all values from lib/config.ts */}
        <div className="space-y-3 text-sm">
          {/* h2, not h3: the footer is the last thing on the page and some pages
              only carry an h1 above it — an h3 there skips a heading level. */}
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-gold">
            {t("footer.contact")}
          </h2>
          <p className="flex gap-2 text-cream/80">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden="true" />
            <span>
              {/* Falls back to the locality rather than printing an unpublished
                  address, so the footer is never a blank row. The locality line is
                  only added as a *fallback*: the full address already ends with it,
                  and printing both read as a duplicated address. */}
              {isPlaceholder(pick(CONTACT.address, lang)) ? (
                pick(CONTACT.area, lang)
              ) : (
                pick(CONTACT.address, lang)
              )}
            </span>
          </p>
          <ul className="space-y-2">
            <li className="flex gap-2 text-cream/80">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden="true" />
              <a href={telHref(CONTACT.primaryPhone)} className="inline-block py-0.5 hover:text-cream">
                Call {telDisplay(CONTACT.primaryPhone)}
              </a>
            </li>
            {whatsappHref() ? (
              <li className="flex gap-2 text-cream/80">
                <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden="true" />
                <a
                  href={whatsappHref() ?? "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block py-0.5 hover:text-cream"
                >
                  WhatsApp {telDisplay(CONTACT.whatsappPhone)}
                </a>
              </li>
            ) : null}
          </ul>
          {/* The email row is omitted until a real address exists — an empty or
              placeholder mail link is worse than no mail link. */}
          {isPlaceholder(CONTACT.email) ? null : (
            <p className="flex gap-2 text-cream/80">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden="true" />
              <a href={`mailto:${CONTACT.email}`} className="inline-block py-0.5 hover:text-cream">
                {CONTACT.email}
              </a>
            </p>
          )}
          <p className="flex gap-2 text-cream/80">
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden="true" />
            <span>
              <span className="block text-xs uppercase tracking-wide text-gold">
                {t("footer.hours")}
              </span>
              {pick(CONTACT.hours, lang)}
            </span>
          </p>
        </div>

        {/* Quick links */}          <nav aria-label={t("footer.quickLinks")} className="space-y-3 text-sm">
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-gold">
            {t("footer.quickLinks")}
          </h2>
          <ul className="space-y-2">
            {[
              { href: ROUTES.collections, label: t("nav.collections") },
              { href: ROUTES.designs, label: t("nav.designs") },
              { href: ROUTES.rates, label: t("nav.rates") },
              { href: ROUTES.scheme, label: t("nav.scheme") },
              { href: ROUTES.gems, label: t("nav.gems") },
              { href: ROUTES.visit, label: t("nav.visit") },
              { href: ROUTES.contact, label: t("nav.contact") },
              { href: ROUTES.about, label: t("nav.about") },
              { href: ROUTES.faq, label: t("nav.faq") },
            ].map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="inline-block py-1 text-cream/75 transition-colors hover:text-cream"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Policies + guides */}          <nav aria-label={t("footer.policies")} className="space-y-3 text-sm">
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-gold">
            {t("footer.policies")}
          </h2>
          <ul className="space-y-2">
            {FOOTER_POLICY_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="inline-block py-1 text-cream/75 transition-colors hover:text-cream"
                >
                  {pick(link.label, lang)}
                </Link>
              </li>
            ))}
          </ul>
          <h2 className="pt-2 text-sm font-semibold uppercase tracking-[0.2em] text-gold">
            {t("footer.guides")}
          </h2>
          <ul className="space-y-2">
            {FOOTER_GUIDE_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="inline-block py-1 text-cream/75 transition-colors hover:text-cream"
                >
                  {pick(link.label, lang)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Mandatory delivery notice — exact wording, shown wherever delivery is relevant */}
      <div className="border-t border-gold/25 bg-[#2a231a]">
        <div className="container-page py-4 text-center text-xs leading-relaxed text-cream sm:text-sm">
          <span className="font-semibold uppercase tracking-[0.2em] text-gold">
            {t("footer.deliveryTitle")}:
          </span>{" "}
          {DELIVERY.outsideNagpurNote}
        </div>
      </div>

      <div className="border-t border-gold/25">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-5 text-xs text-cream/60 sm:flex-row">
          <p>{t("footer.rights", { year })}</p>
          {/* One address line only: repeating the locality after the full address
              (which already ends with it) read as a typo. */}
          <p>
            {t("footer.address")}: {pick(CONTACT.address, lang)}
          </p>
          {photoProviders.length > 0 ? (
            <p>
              {t("footer.photoCredits")}: {photoProviders.join(", ")} ·{" "}
              <Link href="/image-credits" className="underline underline-offset-4 hover:text-cream">
                {t("credits.title")}
              </Link>
            </p>
          ) : null}
        </div>
      </div>
    </footer>
  );
}
