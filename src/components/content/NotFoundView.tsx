"use client";

/**
 * The body of the 404 page. Split out of `src/app/not-found.tsx` so that the page
 * itself can be a Server Component and wrap this in the normal site chrome —
 * a visitor who mistypes a URL should still get the header, the footer and a way
 * back, not a bare message.
 */

import Link from "next/link";
import { ROUTES } from "@/lib/config";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { buttonClasses } from "@/components/ui/Button";

export default function NotFoundView() {
  const { t } = useLanguage();

  return (
    <section className="container-page flex flex-col items-center gap-5 py-24 text-center">
      <p className="font-[family-name:var(--font-display)] text-7xl text-gold-600">404</p>
      <h1 className="text-3xl text-maroon">{t("notFound.title")}</h1>
      <p className="ornament text-gold" aria-hidden="true" />
      <p className="max-w-md text-charcoal/70">{t("notFound.body")}</p>
      <Link href={ROUTES.home} className={buttonClasses("primary", "md")}>
        {t("common.backToHome")}
      </Link>
    </section>
  );
}
