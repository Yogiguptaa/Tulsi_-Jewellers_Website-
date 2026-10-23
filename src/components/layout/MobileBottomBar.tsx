"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Gem, Home, MessageCircle, MapPin, LayoutGrid } from "lucide-react";
import { ROUTES, whatsappHref } from "@/lib/config";
import { useLanguage } from "@/components/providers/LanguageProvider";

/** Fixed bottom navigation for mobile (hidden on larger screens). */
export default function MobileBottomBar() {
  const { t } = useLanguage();
  const pathname = usePathname();
  const waHref = whatsappHref("Hello Tulsi Jewellers, I would like to know more.");

  const items = [
    { href: ROUTES.home, label: t("mobile.home"), icon: Home },
    { href: ROUTES.collections, label: t("mobile.collections"), icon: LayoutGrid },
    { href: ROUTES.rates, label: t("mobile.rates"), icon: Gem },
    waHref
      ? { href: waHref, label: t("mobile.whatsapp"), icon: MessageCircle, external: true }
      : { href: ROUTES.contact, label: t("mobile.whatsapp"), icon: MessageCircle },
    { href: ROUTES.visit, label: t("mobile.visit"), icon: MapPin },
  ];

  return (
    <nav
      aria-label="Mobile bottom bar"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-gold/40 bg-offwhite/97 backdrop-blur lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto grid max-w-lg grid-cols-5">
        {items.map((item) => {
          const active = !("external" in item && item.external) && pathname === item.href;
          const content = (
            <>
              <item.icon
                className={`h-5 w-5 ${active ? "text-maroon" : "text-charcoal/70"}`}
                aria-hidden="true"
              />
              <span
                className={`text-[10px] font-medium ${active ? "text-maroon" : "text-charcoal/70"}`}
              >
                {item.label}
              </span>
            </>
          );
          return (
            <li key={item.href}>
              {"external" in item && item.external ? (
                <a
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-1 py-2.5"
                >
                  {content}
                </a>
              ) : (
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className="flex flex-col items-center gap-1 py-2.5"
                >
                  {content}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
