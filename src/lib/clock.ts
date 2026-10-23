"use client";

import { useSyncExternalStore } from "react";

/**
 * A single shared 60-second clock for relative timestamps ("2 h ago").
 *
 * Why not `useState` + `useEffect`: setting state synchronously inside an effect
 * causes a cascading render (and the lint rules reject it). The value here lives
 * outside React and is read through `useSyncExternalStore` instead, so the server
 * snapshot stays `null` and the browser only starts showing a relative age after
 * hydration — which is exactly what a time-dependent label should do.
 *
 * One interval serves every subscriber and stops when the last one unsubscribes.
 */

const TICK_MS = 60_000;

let current = Date.now();
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | null = null;

function tick(): void {
  current = Date.now();
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  if (timer === null) timer = setInterval(tick, TICK_MS);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer !== null) {
      clearInterval(timer);
      timer = null;
    }
  };
}

function snapshot(): number {
  return current;
}

/** Server + hydration snapshot: `null` means "do not show a relative age yet". */
function serverSnapshot(): null {
  return null;
}

export function useNowMs(): number | null {
  return useSyncExternalStore(subscribe, snapshot, serverSnapshot);
}
