/**
 * Wishlist storage (localStorage only — no account needed yet).
 * Structured as a plain array of product codes so it can migrate to
 * Supabase-backed accounts later without changing the UI contract.
 */

import { useSyncExternalStore } from "react";

export const WISHLIST_STORAGE_KEY = "tulsi_wishlist";
export const WISHLIST_EVENT = "tulsi:wishlist-change";

export function readWishlist(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(WISHLIST_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

export function writeWishlist(codes: string[]): void {
  try {
    window.localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(codes));
  } catch {
    /* storage blocked */
  }
  window.dispatchEvent(new Event(WISHLIST_EVENT));
}

export function getWishlistCount(): number {
  return readWishlist().length;
}

/**
 * Reactive wishlist for client components.
 * SSR/hydration snapshot is an empty list, then the stored value takes over —
 * the pattern avoids setState-in-effect (which the lint rules reject here).
 */
export function useWishlist(): {
  codes: string[];
  has: (code: string) => boolean;
  toggle: (code: string) => void;
  count: number;
} {
  const codes = useSyncExternalStore(subscribeWishlistSnapshot, readWishlistSnapshot, () => EMPTY);
  return {
    codes,
    has: (code: string) => codes.includes(code),
    toggle: (code: string) => {
      const current = readWishlist();
      writeWishlist(
        current.includes(code) ? current.filter((entry) => entry !== code) : [...current, code],
      );
    },
    count: codes.length,
  };
}

/** Stable snapshot identity is required by useSyncExternalStore. */
const EMPTY: string[] = [];
let snapshotCache: { raw: string | null; value: string[] } = { raw: null, value: EMPTY };

function readWishlistSnapshot(): string[] {
  if (typeof window === "undefined") return EMPTY;
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(WISHLIST_STORAGE_KEY);
  } catch {
    raw = null;
  }
  if (raw === snapshotCache.raw) return snapshotCache.value;
  snapshotCache = { raw, value: readWishlist() };
  return snapshotCache.value;
}

/** Subscribe to wishlist changes (local tab + other tabs). */
export function subscribeWishlistSnapshot(callback: () => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key === WISHLIST_STORAGE_KEY) {
      snapshotCache = { raw: null, value: EMPTY }; // force a re-read
      callback();
    }
  };
  window.addEventListener(WISHLIST_EVENT, callback);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(WISHLIST_EVENT, callback);
    window.removeEventListener("storage", onStorage);
  };
}

/** Subscribe to wishlist changes (local tab). Returns an unsubscribe fn. */
export function subscribeWishlist(callback: () => void): () => void {
  const onLocal = () => callback();
  const onStorage = (event: StorageEvent) => {
    if (event.key === WISHLIST_STORAGE_KEY) callback();
  };
  window.addEventListener(WISHLIST_EVENT, onLocal);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(WISHLIST_EVENT, onLocal);
    window.removeEventListener("storage", onStorage);
  };
}
