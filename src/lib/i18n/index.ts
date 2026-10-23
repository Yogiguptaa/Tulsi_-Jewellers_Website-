import { SITE, type Lang } from "@/lib/config";
import { en, type Dictionary, type TranslationKey } from "./en";
import { hi } from "./hi";

export type { Dictionary, TranslationKey };

export const dictionaries: Record<Lang, Dictionary> = { en, hi };

export function getDictionary(lang: Lang): Dictionary {
  return dictionaries[lang] ?? en;
}

export function isSupportedLang(value: unknown): value is Lang {
  return value === "en" || value === "hi";
}

/** Language before localStorage is readable (SSR-safe default). */
export function resolveInitialLang(): Lang {
  return SITE.defaultLanguage;
}

/**
 * Translate a key with optional `{placeholder}` interpolation.
 * Unknown keys fall back to the key itself so nothing renders empty.
 */
export function translate(
  dict: Dictionary,
  key: TranslationKey,
  vars?: Record<string, string | number>,
): string {
  const template = dict[key] ?? (key as string);
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  );
}
