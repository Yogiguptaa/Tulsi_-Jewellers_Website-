import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

export type Crumb = { href?: string; label: string };

/**
 * Inner-page header: breadcrumb, kicker, serif title, subtitle and an optional
 * slot for actions. Every page uses it so the hierarchy stays identical.
 */
export default function PageHero({
  kicker,
  title,
  subtitle,
  crumbs = [],
  children,
}: {
  kicker?: string;
  title: string;
  subtitle?: ReactNode;
  crumbs?: Crumb[];
  children?: ReactNode;
}) {
  return (
    <header className="border-b border-gold/25 bg-gradient-to-b from-offwhite via-ivory to-champagne/30">
      <div className="container-page py-10 sm:py-14">
        {crumbs.length > 0 ? (
          <nav aria-label="Breadcrumb" className="mb-4">
            <ol className="flex flex-wrap items-center gap-1 text-xs text-charcoal/70">
              {crumbs.map((crumb, index) => (
                <li key={`${crumb.label}-${index}`} className="flex items-center gap-1">
                  {index > 0 ? <ChevronRight className="h-3 w-3" aria-hidden="true" /> : null}
                  {crumb.href ? (
                    <Link href={crumb.href} className="hover:text-maroon">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span aria-current="page" className="text-charcoal">
                      {crumb.label}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        ) : null}

        {kicker ? (
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold-700">{kicker}</p>
        ) : null}
        <h1 className="mt-2 max-w-4xl text-3xl leading-tight text-maroon sm:text-4xl lg:text-5xl">{title}</h1>
        <span className="ornament mt-3 text-gold" aria-hidden="true" />
        {subtitle ? (
          <div className="mt-4 max-w-3xl text-sm leading-relaxed text-charcoal/75 sm:text-base">{subtitle}</div>
        ) : null}
        {children ? <div className="mt-6 flex flex-wrap gap-3">{children}</div> : null}
      </div>
    </header>
  );
}
