"use client";

/**
 * ScrollProgress — a 2 px gold hairline that fills as the page is read.
 *
 * Decorative, so it is aria-hidden and never the only cue for anything. It
 * writes to a ref inside a rAF callback instead of a render per scroll event,
 * which keeps a long page at 60 fps, and it is removed for
 * `prefers-reduced-motion` (a bar sliding across the screen is motion).
 */

import { useEffect, useRef } from "react";

export default function ScrollProgress() {
  const barRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const bar = barRef.current;
    if (!bar) return;

    let frame = 0;
    const paint = () => {
      frame = 0;
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      const ratio = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      bar.style.transform = `scaleX(${ratio})`;
      bar.style.opacity = ratio > 0.005 ? "1" : "0";
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(paint);
    };

    paint();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[2px]">
      <div
        ref={barRef}
        className="h-full origin-left bg-gradient-to-r from-gold-700 via-gold to-champagne opacity-0 transition-opacity duration-300"
        style={{ transform: "scaleX(0)" }}
      />
    </div>
  );
}
