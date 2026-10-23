import type { ReactNode } from "react";

export type BadgeTone = "gold" | "maroon" | "emerald" | "neutral" | "danger";

const tones: Record<BadgeTone, string> = {
  gold: "border-gold/60 bg-champagne text-gold-700",
  maroon: "border-maroon/30 bg-maroon/10 text-maroon",
  emerald: "border-emerald/30 bg-emerald/10 text-emerald",
  neutral: "border-charcoal/20 bg-charcoal/5 text-charcoal/80",
  danger: "border-maroon/40 bg-maroon/10 text-maroon",
};

export default function Badge({
  tone = "neutral",
  children,
  className = "",
}: {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium tracking-wide ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
