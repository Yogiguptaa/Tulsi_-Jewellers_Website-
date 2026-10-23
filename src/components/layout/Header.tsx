"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import {
  ChevronDown,
  Heart,
  Languages,
  Menu,
  MessageCircle,
  Moon,
  Phone,
  Search,
  Sun,
  X,
} from "lucide-react";
import {
  COLLECTIONS,
  CONTACT,
  ROUTES,
  SITE,
  pick,
  telDisplay,
  telHref,
  whatsappHref,
} from "@/lib/config";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { useTheme } from "@/components/providers/ThemeProvider";
import { buttonClasses } from "@/components/ui/Button";
import { getWishlistCount, subscribeWishlist } from "@/lib/wishlist";

type NavItem = { href: string; labelKey: Parameters<ReturnType<typeof useLanguage>["t"]>[0] };

const NAV: NavItem[] = [
  { href: ROUTES.home, labelKey: "nav.home" },
  { href: ROUTES.rates, labelKey: "nav.rates" },
  { href: ROUTES.scheme, labelKey: "nav.scheme" },
  { href: ROUTES.gems, labelKey: "nav.gems" },
  { href: ROUTES.visit, labelKey: "nav.visit" },
  { href: ROUTES.contact, labelKey: "nav.contact" },
];

export default function Header() {
  const { lang, setLang, t } = useLanguage();
  const { theme, toggle: toggleTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();

  const [megaOpen, setMegaOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  const wishlistCount = useSyncExternalStore(subscribeWishlist, getWishlistCount, () => 0);
  const waHref = whatsappHref("Hello Tulsi Jewellers, I would like to know more.");

  // Close overlays whenever navigation happens (guarded render-time adjustment).
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setMegaOpen(false);
    setMobileOpen(false);
    setSearchOpen(false);
  }

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  function submitSearch(event: FormEvent) {
    event.preventDefault();
    const q = query.trim();
    router.push(q ? `${ROUTES.collections}?q=${encodeURIComponent(q)}` : ROUTES.collections);
    setSearchOpen(false);
    setMobileOpen(false);
  }

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-gold/30 bg-offwhite/95 backdrop-blur">
      <div className="container-page relative flex h-16 items-center justify-between gap-4 sm:h-20">
        {/* Brand */}
        {/* No aria-label: the visible name already names the link. The name is
            shown at every width — hiding it under `sm` left a phone with a link
            whose only child was a decorative mark, so it had no accessible name
            (and the tagline is what travels with it, so an aria-label short
            enough to be useful would break "label in name", WCAG 2.5.3). */}
        <Link
          href={ROUTES.home}
          className="flex shrink-0 items-center gap-2 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-maroon sm:gap-3"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- SVG mark, swap to next/image when logo.png arrives */}
          <img src={SITE.logoSrc} alt="" width={40} height={40} className="h-9 w-9 sm:h-10 sm:w-10" />
          <span className="flex flex-col leading-tight">
            <span className="whitespace-nowrap font-[family-name:var(--font-display)] text-base font-semibold text-maroon sm:text-lg">
              {pick(SITE.name, lang)}
            </span>
            <span className="hidden text-[11px] tracking-[0.18em] text-charcoal/70 sm:block">
              {pick(SITE.tagline, lang)}
            </span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
          <div
            className="relative"
            onMouseEnter={() => setMegaOpen(true)}
            onMouseLeave={() => setMegaOpen(false)}
          >
            <button
              type="button"
              aria-expanded={megaOpen}
              aria-haspopup="true"
              onClick={(event) => {
                // Mouse/touch users get hover (pointerenter) behaviour; only
                // keyboard activation (detail === 0) should toggle explicitly,
                // otherwise a click would immediately close a hovered panel.
                if (event.detail === 0) setMegaOpen((open) => !open);
                else setMegaOpen(true);
              }}
              className={`flex items-center gap-1 whitespace-nowrap rounded-sm px-3 py-2 text-sm font-medium transition-colors ${
                isActive(ROUTES.collections)
                  ? "text-maroon"
                  : "text-charcoal/80 hover:text-maroon"
              }`}
            >
              {t("nav.collections")}
              <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
            </button>

            {megaOpen ? (
              <div className="absolute left-1/2 top-full w-[min(56rem,80vw)] -translate-x-1/2 pt-2">
                <div className="rounded-sm border border-gold/40 bg-offwhite p-6 shadow-soft">
                  <p className="mb-4 text-xs font-semibold uppercase tracking-[0.25em] text-gold-700">
                    {t("mega.title")}
                  </p>
                  <ul className="grid grid-cols-2 gap-x-8 gap-y-4 xl:grid-cols-3">
                    {COLLECTIONS.map((collection) => (
                      <li key={collection.slug}>
                        <Link
                          href={`${ROUTES.collections}/${collection.slug}`}
                          className="group block rounded-sm p-2 -m-2 transition-colors hover:bg-champagne/50"
                        >
                          <span className="block font-[family-name:var(--font-display)] text-base text-charcoal group-hover:text-maroon">
                            {pick(collection.name, lang)}
                          </span>
                          <span className="block text-xs leading-relaxed text-charcoal/70">
                            {pick(collection.description, lang)}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-5 border-t border-gold/30 pt-4">
                    <Link
                      href={ROUTES.collections}
                      className="text-sm font-medium text-maroon underline-offset-4 hover:underline"
                    >
                      {t("mega.viewAll")} →
                    </Link>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {NAV.slice(1).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`whitespace-nowrap rounded-sm px-3 py-2 text-sm font-medium transition-colors ${
                isActive(item.href) ? "text-maroon" : "text-charcoal/80 hover:text-maroon"
              }`}
            >
              {t(item.labelKey)}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Two clearly labelled ways to reach the showroom, only on very wide
              screens: at 1280 px the nav and these two buttons fought for the
              same row and "Call +91…" wrapped onto three lines. */}
          {waHref ? (
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden items-center gap-1.5 whitespace-nowrap rounded-sm bg-maroon px-3 py-2 text-xs font-medium text-offwhite hover:bg-maroon-700 2xl:inline-flex"
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              WhatsApp
            </a>
          ) : null}
          <a
            href={telHref(CONTACT.primaryPhone)}
            className="hidden items-center gap-1.5 whitespace-nowrap rounded-sm border border-gold/50 px-3 py-2 text-xs font-medium text-charcoal hover:bg-champagne/60 2xl:inline-flex"
          >
            <Phone className="h-4 w-4" aria-hidden="true" />
            Call {telDisplay(CONTACT.primaryPhone)}
          </a>

          <button
            type="button"
            onClick={() => setSearchOpen((open) => !open)}
            aria-label={t("header.search")}
            aria-expanded={searchOpen}
            className="rounded-sm p-2.5 text-charcoal/80 transition-colors hover:bg-champagne/60 hover:text-maroon"
          >
            <Search className="h-5 w-5" aria-hidden="true" />
          </button>

          <Link
            href={ROUTES.wishlist}
            aria-label={`${t("header.wishlist")}${wishlistCount ? ` (${wishlistCount})` : ""}`}
            className="relative rounded-sm p-2.5 text-charcoal/80 transition-colors hover:bg-champagne/60 hover:text-maroon"
          >
            <Heart className="h-5 w-5" aria-hidden="true" />
            {wishlistCount > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-maroon px-1 text-[10px] font-semibold text-offwhite">
                {wishlistCount}
              </span>
            ) : null}
          </Link>

          {/* Day / night */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-pressed={theme === "night"}
            className="rounded-sm p-2.5 text-charcoal/80 transition-colors hover:bg-champagne/60 hover:text-maroon"
          >
            <span className="sr-only">
              {theme === "night" ? t("header.themeToDay") : t("header.themeToNight")}
            </span>
            {theme === "night" ? (
              <Sun className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Moon className="h-5 w-5" aria-hidden="true" />
            )}
          </button>

          {/* Language toggle */}
          {/* On phones the language toggle moves into the drawer: five controls
              plus the brand name left the shop name wrapping onto two lines and
              overflowing a 390 px header. */}
          <button
            type="button"
            onClick={() => setLang(lang === "en" ? "hi" : "en")}
            className="hidden rounded-sm border border-gold/60 px-2.5 py-1.5 text-xs font-semibold tracking-wide text-maroon transition-colors hover:bg-champagne/70 sm:inline-flex"
          >
            {/* The visible label stays part of the accessible name (WCAG 2.5.3), so
                the explanation is a prefix rather than an aria-label override. */}
            <span className="sr-only">{t("header.language")}: </span>
            {lang === "en" ? t("header.switchToHindi") : t("header.switchToEnglish")}
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            aria-label={mobileOpen ? t("header.closeMenu") : t("header.openMenu")}
            aria-expanded={mobileOpen}
            className="rounded-sm p-2.5 text-charcoal/80 transition-colors hover:bg-champagne/60 hover:text-maroon lg:hidden"
          >
            {mobileOpen ? (
              <X className="h-6 w-6" aria-hidden="true" />
            ) : (
              <Menu className="h-6 w-6" aria-hidden="true" />
            )}
          </button>
        </div>

        {/* Search drawer */}
        {searchOpen ? (
          <form
            onSubmit={submitSearch}
            role="search"
            className="absolute inset-x-0 top-full border-b border-gold/30 bg-offwhite p-4 shadow-soft"
          >
            <div className="container-page flex items-center gap-3">
              <Search className="h-5 w-5 shrink-0 text-gold-600" aria-hidden="true" />
              <input
                ref={searchInputRef}
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t("header.searchPlaceholder")}
                aria-label={t("header.search")}
                className="w-full border-b border-gold/50 bg-transparent py-2 text-base outline-none placeholder:text-charcoal/40 focus:border-maroon"
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                aria-label={t("common.close")}
                className="rounded-sm p-2 text-charcoal/70 hover:bg-champagne/60"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          </form>
        ) : null}
      </div>
      </header>

      {/* Mobile drawer (outside <header>: backdrop-filter would trap fixed children) */}
      {mobileOpen ? (
        <div className="fixed inset-0 top-16 z-[45] bg-ivory lg:hidden">
          <nav
            aria-label="Mobile"
            className="container-page flex h-full flex-col gap-1 overflow-y-auto py-6 pb-32"
          >
            <Link
              href={ROUTES.home}
              className={`border-b border-gold/20 py-3 text-lg ${isActive(ROUTES.home) ? "text-maroon" : "text-charcoal"}`}
            >
              {t("nav.home")}
            </Link>
            <Link
              href={ROUTES.collections}
              className={`border-b border-gold/20 py-3 text-lg ${isActive(ROUTES.collections) ? "text-maroon" : "text-charcoal"}`}
            >
              {t("nav.collections")}
            </Link>
            <div className="grid grid-cols-2 gap-2 border-b border-gold/20 py-3">
              {COLLECTIONS.map((collection) => (
                <Link
                  key={collection.slug}
                  href={`${ROUTES.collections}/${collection.slug}`}
                  className="text-sm text-charcoal/75 hover:text-maroon"
                >
                  {pick(collection.name, lang)}
                </Link>
              ))}
            </div>
            {NAV.slice(1).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`border-b border-gold/20 py-3 text-lg ${isActive(item.href) ? "text-maroon" : "text-charcoal"}`}
              >
                {t(item.labelKey)}
              </Link>
            ))}
            <Link
              href={ROUTES.about}
              className={`border-b border-gold/20 py-3 text-lg ${isActive(ROUTES.about) ? "text-maroon" : "text-charcoal"}`}
            >
              {t("nav.about")}
            </Link>
            <Link
              href={ROUTES.faq}
              className={`border-b border-gold/20 py-3 text-lg ${isActive(ROUTES.faq) ? "text-maroon" : "text-charcoal"}`}
            >
              {t("nav.faq")}
            </Link>
            <Link
              href={ROUTES.wishlist}
              className="border-b border-gold/20 py-3 text-lg"
            >
              {t("nav.wishlist")}
              {wishlistCount > 0 ? ` (${wishlistCount})` : ""}
            </Link>

            <div className="mt-4 flex flex-wrap gap-2">
              {waHref ? (
                <a
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonClasses("primary", "md")}
                >
                  <MessageCircle className="h-4 w-4" aria-hidden="true" />
                  WhatsApp
                </a>
              ) : null}
              <a href={telHref(CONTACT.primaryPhone)} className={buttonClasses("secondary", "md")}>
                <Phone className="h-4 w-4" aria-hidden="true" />
                Call {telDisplay(CONTACT.primaryPhone)}
              </a>
            </div>

            <div className="mt-4 flex flex-wrap gap-2 sm:hidden">
              <button
                type="button"
                onClick={() => setLang(lang === "en" ? "hi" : "en")}
                className={buttonClasses("ghost", "md")}
              >
                <Languages className="h-4 w-4" aria-hidden="true" />
                {lang === "en" ? t("header.switchToHindi") : t("header.switchToEnglish")}
              </button>
              <button type="button" onClick={toggleTheme} className={buttonClasses("ghost", "md")}>
                {theme === "night" ? (
                  <Sun className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Moon className="h-4 w-4" aria-hidden="true" />
                )}
                {theme === "night" ? t("header.themeToDay") : t("header.themeToNight")}
              </button>
            </div>

            <form onSubmit={submitSearch} role="search" className="mt-4 flex items-center gap-2">
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t("header.searchPlaceholder")}
                aria-label={t("header.search")}
                className="w-full border-b border-gold/50 bg-transparent py-2 outline-none placeholder:text-charcoal/40 focus:border-maroon"
              />
              <button type="submit" className={buttonClasses("primary", "sm")}>
                {t("header.search")}
              </button>
            </form>
          </nav>
        </div>
      ) : null}
    </>
  );
}
