"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import { SITE, type Lang } from "@/lib/config";
import { useStoredValue } from "@/lib/storage";
import {
  getDictionary,
  isSupportedLang,
  resolveInitialLang,
  translate,
  type Dictionary,
  type TranslationKey,
} from "@/lib/i18n";

type TranslateFn = (key: TranslationKey, vars?: Record<string, string | number>) => string;

type LanguageContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  toggle: () => void;
  t: TranslateFn;
  dict: Dictionary;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Persisted preference, synced without setState-in-effect.
  const [lang, setLang] = useStoredValue<Lang>(
    SITE.languageStorageKey,
    resolveInitialLang(),
    (raw) => (isSupportedLang(raw) ? raw : SITE.defaultLanguage),
  );

  // Keep the document language correct for screen readers and font selection.
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const dict = getDictionary(lang);

  const t = useCallback<TranslateFn>(
    (key, vars) => translate(dict, key, vars),
    [dict],
  );

  const toggle = useCallback(() => {
    setLang(lang === "en" ? "hi" : "en");
  }, [lang, setLang]);

  const value = useMemo(
    () => ({ lang, setLang, toggle, t, dict }),
    [lang, setLang, toggle, t, dict],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used inside <LanguageProvider>");
  }
  return ctx;
}
