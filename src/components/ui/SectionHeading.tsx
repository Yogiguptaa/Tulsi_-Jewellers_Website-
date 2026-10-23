import type { ReactNode } from "react";

type Props = {
  kicker?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  align?: "left" | "center";
  /** Renders an ornamental gold divider under the title (default true). */
  ornament?: boolean;
  id?: string;
};

export default function SectionHeading({
  kicker,
  title,
  subtitle,
  align = "center",
  ornament = true,
  id,
}: Props) {
  const alignment = align === "center" ? "items-center text-center" : "items-start text-left";
  return (
    <header className={`flex flex-col gap-3 ${alignment}`} id={id}>
      {kicker ? (
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold-700">
          {kicker}
        </p>
      ) : null}
      <h2 className="max-w-3xl text-3xl leading-tight sm:text-4xl">{title}</h2>
      {ornament ? (
        <span className="ornament text-gold" aria-hidden="true" />
      ) : null}
      {subtitle ? (
        <p className="max-w-2xl text-sm leading-relaxed text-charcoal/70 sm:text-base">
          {subtitle}
        </p>
      ) : null}
    </header>
  );
}
