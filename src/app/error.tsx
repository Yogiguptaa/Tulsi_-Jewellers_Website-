"use client";

import { useEffect } from "react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { buttonClasses } from "@/components/ui/Button";
import ChromeShell from "@/components/layout/ChromeShell";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useLanguage();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <ChromeShell>
      <section className="container-page flex flex-col items-center gap-5 py-24 text-center">
        <h1 className="text-3xl text-maroon">{t("error.title")}</h1>
        <p className="ornament text-gold" aria-hidden="true" />
        <p className="max-w-md text-charcoal/70">{t("error.body")}</p>
        <button type="button" onClick={reset} className={buttonClasses("primary", "md")}>
          {t("error.retry")}
        </button>
      </section>
    </ChromeShell>
  );
}
