import { AlertTriangle, Info } from "lucide-react";
import type { ReactNode } from "react";

const TONES = {
  /** Owner input still required (a [PLACEHOLDER] is visible on the page). */
  placeholder: {
    wrap: "border-dashed border-gold/60 bg-champagne/25 text-charcoal",
    Icon: AlertTriangle,
  },
  /** Neutral, factual note (disclaimers, rate caveats, delivery limits). */
  info: {
    wrap: "border-charcoal/15 bg-offwhite text-charcoal/85",
    Icon: Info,
  },
  /** Something needs the visitor's attention right now (stale rates, errors). */
  warning: {
    wrap: "border-maroon/35 bg-maroon/5 text-maroon",
    Icon: AlertTriangle,
  },
} as const;

export type NoticeTone = keyof typeof TONES;

export default function Notice({
  tone = "info",
  title,
  children,
  className = "",
}: {
  tone?: NoticeTone;
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  const { wrap, Icon } = TONES[tone];
  return (
    <div className={`flex gap-3 rounded-sm border px-4 py-3 text-sm ${wrap} ${className}`}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <div className="space-y-1">
        {title ? <p className="font-medium">{title}</p> : null}
        <div className="leading-relaxed">{children}</div>
      </div>
    </div>
  );
}
