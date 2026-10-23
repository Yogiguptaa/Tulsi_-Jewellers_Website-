"use client";

/**
 * Small localStorage layer built on `useSyncExternalStore` so values can be
 * read during hydration without setState-in-effect (SSR always snapshots the
 * fallback, then the client value takes over after hydration).
 */

import { useSyncExternalStore } from "react";

const EVENT_PREFIX = "tulsi:storage:";
/** In-memory fallback so the UI still works when storage is blocked. */
const cache = new Map<string, string | null>();

function eventFor(key: string): string {
  return EVENT_PREFIX + key;
}

export function readStorage(key: string): string | null {
  if (typeof window === "undefined") return null;
  if (cache.has(key)) return cache.get(key) ?? null;
  let value: string | null = null;
  try {
    value = window.localStorage.getItem(key);
  } catch {
    value = null;
  }
  cache.set(key, value);
  return value;
}

export function writeStorage(key: string, value: string | null): void {
  cache.set(key, value);
  if (typeof window === "undefined") return;
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    /* storage blocked — memory cache still reflects the change */
  }
  window.dispatchEvent(new CustomEvent(eventFor(key)));
}

export function subscribeStorage(key: string, callback: () => void): () => void {
  const onLocal = () => callback();
  const onStorage = (event: StorageEvent) => {
    if (event.key !== key) return;
    cache.delete(key);
    callback();
  };
  const name = eventFor(key);
  window.addEventListener(name, onLocal);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(name, onLocal);
    window.removeEventListener("storage", onStorage);
  };
}

/**
 * Reactive localStorage value.
 * - SSR / hydration snapshot: `fallback`
 * - Client: parsed stored value (or `fallback` when absent/invalid)
 */
export function useStoredValue<T>(
  key: string,
  fallback: T,
  parse: (raw: string | null) => T,
  serialize: (value: T) => string = String,
): readonly [T, (next: T) => void] {
  const raw = useSyncExternalStore(
    (cb) => subscribeStorage(key, cb),
    () => readStorage(key),
    () => null,
  );
  const value = parse(raw);
  const set = (next: T) => writeStorage(key, serialize(next));
  return [value, set] as const;
}
