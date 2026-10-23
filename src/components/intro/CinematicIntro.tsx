"use client";

/**
 * CinematicIntro — a thirty-second, skippable title film for the showroom.
 *
 * WHAT IT IS (AND IS NOT)
 * ───────────────────────
 * It is a hand-built motion piece: gold dust on canvas, layered 3D rings, and
 * five lines of copy that are true of the trade rather than invented facts about
 * the shop. There is no stock footage pretending to be Tulsi's own showroom, no
 * sound, no fake review, no price. Gold/silver photography would need licensed
 * media, so this uses light, geometry and type instead — and looks deliberate
 * rather than like a placeholder.
 *
 * RULES IT OBEYS
 *  • Plays once per browser (localStorage), and can be replayed from the footer.
 *  • Always skippable: a visible button, Escape, or the closing scene.
 *  • Never auto-plays for `prefers-reduced-motion: reduce`; those visitors go
 *    straight to the page.
 *  • Locks scrolling while open, restores focus to whatever opened it, and is a
 *    labelled dialog for screen readers.
 *  • Runs at 30 s, then leaves. Nothing on the site depends on it.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Sparkles, X } from "lucide-react";
import { SITE, pick } from "@/lib/config";
import { useLanguage } from "@/components/providers/LanguageProvider";

export const INTRO_STORAGE_KEY = "tulsi:intro.v1";
export const INTRO_REPLAY_EVENT = "tulsi:replay-intro";

/** Total run time. Long enough to feel like a film, short enough to forgive. */
const DURATION_MS = 30_000;
const SCENE_MS = 6_000;

type Scene = { en: string; hi: string; noteEn: string; noteHi: string };

const SCENES: Scene[] = [
  {
    en: "Gold is not metal. It is memory.",
    hi: "सोना धातु नहीं, याद है।",
    noteEn: "Every Indian family keeps its story somewhere in gold.",
    noteHi: "हर भारतीय परिवार की कहानी कहीं सोने में बसती है।",
  },
  {
    en: "Silver for the everyday. Gold for the occasions.",
    hi: "रोज़ के लिए चांदी, मौकों के लिए सोना।",
    noteEn: "Anklets, chains, coins, bangles — each with its own weight and voice.",
    noteHi: "पायल, चेन, सिक्के, कंगन — हर एक का अपना वज़न और अपनी आवाज़।",
  },
  {
    en: "24K, 22K, 18K.",
    hi: "24K, 22K, 18K।",
    noteEn: "The same metal in different tempers — one soft as a ribbon, one set to last a lifetime.",
    noteHi: "एक ही धातु, अलग मिज़ाज — कोई फीते जैसी मुलायम, कोई उम्र भर के लिए।",
  },
  {
    en: "A piece is more than its weight.",
    hi: "एक गहना सिर्फ़ उसके वज़न से बड़ा होता है।",
    noteEn: "It carries the hours someone spent on it, and the day it was worn first.",
    noteHi: "उसमें किसी के लगाए घंटे हैं, और वह पहला दिन जब उसे पहना गया।",
  },
  {
    en: "Tulsi Jewellers, Hansapuri.",
    hi: "तुलसी ज्वेलर्स, हंसापुरी।",
    noteEn: "Gold, silver, coins and ratna — with today's rate, dated and honest.",
    noteHi: "सोना, चांदी, सिक्के और रत्न — आज के भाव के साथ, तारीख़ सहित।",
  },
];

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export default function CinematicIntro() {
  const { lang, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [scene, setScene] = useState(0);
  const [closing, setClosing] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const barRef = useRef<HTMLDivElement | null>(null);
  const startRef = useRef(0);
  const rafRef = useRef(0);
  const sceneRef = useRef(0);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const closeRef = useRef<(remember?: boolean) => void>(() => {});

  /* ---------------------------------------------------------------- opening */
  useEffect(() => {
    if (prefersReducedMotion()) return;
    let seen = false;
    try {
      seen = window.localStorage.getItem(INTRO_STORAGE_KEY) === "seen";
    } catch {
      seen = false;
    }
    if (seen) return;
    restoreFocusRef.current = document.activeElement as HTMLElement | null;
    // Opened on a task rather than synchronously inside the effect: the first
    // paint is the page itself, so the film fades in over content that already
    // exists instead of replacing a blank screen.
    const timer = window.setTimeout(() => {
      startRef.current = performance.now();
      setOpen(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  /* Replay from the footer: clears the flag and restarts the film. */
  useEffect(() => {
    const replay = () => {
      try {
        window.localStorage.removeItem(INTRO_STORAGE_KEY);
      } catch {
        /* storage blocked — the film still plays */
      }
      sceneRef.current = 0;
      setScene(0);
      setClosing(false);
      startRef.current = performance.now();
      setOpen(true);
    };
    window.addEventListener(INTRO_REPLAY_EVENT, replay);
    return () => window.removeEventListener(INTRO_REPLAY_EVENT, replay);
  }, []);

  const close = useCallback((remember = true) => {
    setClosing(true);
    if (remember) {
      try {
        window.localStorage.setItem(INTRO_STORAGE_KEY, "seen");
      } catch {
        /* storage blocked: it will simply play again next visit */
      }
    }
    // Let the fade finish before unmounting, so it never snaps away.
    window.setTimeout(() => {
      setOpen(false);
      setClosing(false);
      restoreFocusRef.current?.focus?.();
    }, 520);
  }, []);

  // Kept in a ref so the keydown listener and the timeline never re-subscribe.
  useEffect(() => {
    closeRef.current = close;
  }, [close]);

  /* ------------------------------------------------------- scroll + keyboard */
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeRef.current(true);
    };
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  /* ------------------------------------------------------------- gold dust */
  useEffect(() => {
    if (!open) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = prefersReducedMotion();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = 0;
    let height = 0;
    let particles: { x: number; y: number; r: number; vy: number; vx: number; a: number; p: number }[] = [];

    const resize = () => {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round(Math.min(120, Math.max(36, (width * height) / 18_000)));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: 0.5 + Math.random() * 1.9,
        vy: 0.08 + Math.random() * 0.35,
        vx: (Math.random() - 0.5) * 0.12,
        a: 0.15 + Math.random() * 0.55,
        p: Math.random() * Math.PI * 2,
      }));
    };

    resize();
    window.addEventListener("resize", resize);

    const draw = (time: number) => {
      ctx.clearRect(0, 0, width, height);
      for (const particle of particles) {
        if (!reduce) {
          particle.y -= particle.vy;
          particle.x += particle.vx + Math.sin(time / 2600 + particle.p) * 0.12;
          if (particle.y < -6) {
            particle.y = height + 6;
            particle.x = Math.random() * width;
          }
          if (particle.x < -6) particle.x = width + 6;
          if (particle.x > width + 6) particle.x = -6;
        }
        const twinkle = reduce ? 0.6 : 0.55 + Math.sin(time / 900 + particle.p) * 0.35;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(226, 190, 112, ${particle.a * twinkle})`;
        ctx.fill();
      }
      rafRef.current = requestAnimationFrame(draw);
    };
    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [open]);

  /* --------------------------------------------------------- timeline / bar */
  useEffect(() => {
    if (!open) return;
    let tick = 0;
    let cancelled = false;

    const step = (now: number) => {
      if (cancelled) return;
      const elapsed = now - startRef.current;
      const ratio = Math.min(1, elapsed / DURATION_MS);
      if (barRef.current) barRef.current.style.transform = `scaleX(${ratio})`;
      const nextScene = Math.min(SCENES.length - 1, Math.floor(elapsed / SCENE_MS));
      if (nextScene !== sceneRef.current) {
        sceneRef.current = nextScene;
        setScene(nextScene);
      }
      if (ratio >= 1) {
        closeRef.current(true);
        return;
      }
      tick = window.setTimeout(() => {
        rafRef.current = requestAnimationFrame(step);
      }, 100);
    };
    rafRef.current = requestAnimationFrame(step);

    return () => {
      cancelled = true;
      window.clearTimeout(tick);
      cancelAnimationFrame(rafRef.current);
    };
  }, [open]);

  if (!open) return null;

  const current = SCENES[scene] ?? SCENES[0];
  const isFinal = scene === SCENES.length - 1;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={lang === "hi" ? "तुलसी ज्वेलर्स परिचय" : "Tulsi Jewellers introduction"}
      className={`fixed inset-0 z-[80] overflow-hidden bg-[#0c0a07] text-cream transition-opacity duration-500 ${
        closing ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Layers: warm glow, gold dust, film grain, vignette */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 90% at 50% 12%, rgba(201,164,92,0.22) 0%, rgba(201,164,92,0.06) 38%, rgba(12,10,7,0) 68%), radial-gradient(90% 70% at 50% 110%, rgba(90,15,27,0.45) 0%, rgba(12,10,7,0) 70%)",
        }}
      />
      <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 h-full w-full" />
      <div aria-hidden="true" className="intro-grain pointer-events-none absolute inset-0" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ boxShadow: "inset 0 0 220px 60px rgba(0,0,0,0.75)" }}
      />

      {/* Skip */}
      <button
        type="button"
        onClick={() => close(true)}
        className="absolute right-4 top-4 z-20 inline-flex items-center gap-2 rounded-full border border-gold/40 bg-black/25 px-4 py-2 text-xs font-medium tracking-wide text-cream/90 backdrop-blur transition-colors hover:border-gold hover:text-cream sm:right-6 sm:top-6 sm:text-sm"
      >
        {t("intro.skip")}
        <X className="h-4 w-4" aria-hidden="true" />
      </button>

      {/* Stage */}
      <div className="relative flex h-full flex-col items-center justify-center px-6 text-center">
        {/* 3D ring stack */}
        <div aria-hidden="true" className="intro-rig relative mb-10 h-40 w-40 sm:mb-12 sm:h-56 sm:w-56">
          <div className="intro-ring intro-ring--outer" />
          <div className="intro-ring intro-ring--mid" />
          <div className="intro-ring intro-ring--inner" />
          <div className="intro-core">
            {/* eslint-disable-next-line @next/next/no-img-element -- SVG mark */}
            <img src={SITE.logoSrc} alt="" width={96} height={96} className="h-16 w-16 sm:h-20 sm:w-20" />
          </div>
          <span className="intro-spark intro-spark--a" />
          <span className="intro-spark intro-spark--b" />
          <span className="intro-spark intro-spark--c" />
        </div>

        <p key={`k-${scene}`} className="intro-in text-[11px] uppercase tracking-[0.45em] text-gold-600">
          {lang === "hi" ? "तुलसी ज्वेलर्स" : "Tulsi Jewellers"}
        </p>

        <h2
          key={`h-${scene}`}
          className="intro-in mt-5 max-w-3xl font-[family-name:var(--font-display)] text-3xl leading-tight text-cream sm:text-5xl lg:text-6xl"
        >
          {lang === "hi" ? current.hi : current.en}
        </h2>

        <p
          key={`p-${scene}`}
          className="intro-in-slow mt-5 max-w-xl text-sm leading-relaxed text-cream/70 sm:text-base"
        >
          {lang === "hi" ? current.noteHi : current.noteEn}
        </p>

        {isFinal ? (
          <button
            type="button"
            onClick={() => close(true)}
            className="intro-in-slow mt-9 inline-flex items-center gap-2 rounded-sm bg-gold px-7 py-3 text-sm font-semibold tracking-wide text-[#1a1409] transition-transform hover:scale-[1.03]"
          >
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            {lang === "hi" ? "दुकान में प्रवेश करें" : "Enter the showroom"}
          </button>
        ) : null}
      </div>

      {/* Progress */}
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[3px] bg-white/10">
        <div
          ref={barRef}
          className="h-full origin-left bg-gradient-to-r from-gold-600 via-gold to-champagne"
          style={{ transform: "scaleX(0)" }}
        />
      </div>

      <p className="absolute bottom-6 left-0 right-0 text-center text-[10px] uppercase tracking-[0.35em] text-cream/35">
        {pick(SITE.name, lang)}
      </p>
    </div>
  );
}
