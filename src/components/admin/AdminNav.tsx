"use client";

/**
 * components/admin/AdminNav.tsx — the admin sidebar.
 *
 * Client-side only so it can highlight the current section with `usePathname`.
 * Every link points at a real route; nothing here is decorative.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";

type Section = { href: string; label: string; exact?: boolean };

const SECTIONS: Section[] = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/rates", label: "Rates" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/categories", label: "Collections" },
  { href: "/admin/enquiries", label: "Enquiries" },
  { href: "/admin/faqs", label: "FAQs" },
  { href: "/admin/reviews", label: "Reviews" },
  { href: "/admin/pricing-rules", label: "Pricing rules" },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin sections" className="lg:sticky lg:top-4 lg:self-start">
      <ul className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
        {SECTIONS.map((section) => {
          const active = section.exact
            ? pathname === section.href
            : pathname === section.href || pathname?.startsWith(`${section.href}/`);
          return (
            <li key={section.href} className="shrink-0">
              <Link
                href={section.href}
                aria-current={active ? "page" : undefined}
                className={`block rounded-sm px-3 py-2 text-sm whitespace-nowrap transition ${
                  active
                    ? "bg-maroon text-offwhite"
                    : "text-charcoal/75 hover:bg-champagne/50 hover:text-charcoal"
                }`}
              >
                {section.label}
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="mt-4 hidden border-t border-gold/30 pt-3 text-xs lg:block">
        <Link href="/" className="text-charcoal/70 hover:text-maroon hover:underline">
          ← View the public site
        </Link>
      </div>
    </nav>
  );
}
