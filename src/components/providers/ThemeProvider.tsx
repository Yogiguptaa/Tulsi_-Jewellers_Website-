"use client";

/**
 * ThemeProvider — ivory "day" and candle-lit "night" for the storefront.
 *
 * The palette lives in globals.css as `--color-*` tokens; switching one
 * `data-theme` attribute on <html> re-points those tokens, so every Tailwind
 * utility already in use (bg-ivory, text-charcoal, border-gold…) changes
 * together and no component needs a conditional class.
 *
 * The attribute is set before first paint by the inline script in the root
 * layout, so there is no white flash on a night-mode device. With nothing
 * stored, the device preference wins and keeps following it until the visitor
 * chooses a theme explicitly.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useStoredValue } from "@/lib/storage";

export type Theme = "day" | "night";

export const THEME_STORAGE_KEY = "tulsi:theme";

type ThemeContextValue = {
  /** What is on screen right now. */
  theme: Theme;
  setTheme: (theme: Theme) => void;
  /** Day ↔ night, whichever is the opposite of what is showing. */
  toggle: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.style.colorScheme = theme === "night" ? "dark" : "light";
  // Matches the manifest and the browser UI on phones.
  document
    .querySelectorAll('meta[name="theme-color"]')
    .forEach((meta) => meta.setAttribute("content", theme === "night" ? "#12100d" : "#5A0F1B"));
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // `null` means "no explicit choice yet — follow the device".
  const [stored, setStored] = useStoredValue<Theme | null>(
    THEME_STORAGE_KEY,
    null,
    (raw) => (raw === "night" ? "night" : raw === "day" ? "day" : null),
    (value) => value ?? "",
  );
  // Kept in state only after mount, so the server render and the first client
  // render agree ("day") and hydration never mismatches.
  const [deviceTheme, setDeviceTheme] = useState<Theme>("day");

  // The script in <head> already painted the right theme; this keeps React and
  // the attribute in step, and follows the device while no choice is stored.
  useEffect(() => {
    if (stored) {
      applyTheme(stored);
      return;
    }
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const sync = () => {
      const next: Theme = media.matches ? "night" : "day";
      setDeviceTheme(next);
      applyTheme(next);
    };
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, [stored]);

  const current: Theme = stored ?? deviceTheme;
  const setTheme = useCallback((theme: Theme) => setStored(theme), [setStored]);
  const toggle = useCallback(() => {
    setStored(current === "night" ? "day" : "night");
  }, [current, setStored]);

  const value = useMemo(() => ({ theme: current, setTheme, toggle }), [current, setTheme, toggle]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}
