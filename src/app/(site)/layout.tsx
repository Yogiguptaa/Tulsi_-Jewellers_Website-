import SiteFrame from "@/components/layout/SiteFrame";

/**
 * Everything a visitor sees lives under this route group: header, announcement
 * bar, footer, mobile bar and the WhatsApp button. (The old floating "View
 * Rates" chip is gone: the mobile bar already carries a Rates tab, and the chip
 * sat on top of page content.)
 *
 * `/admin` and `/api` are deliberately outside the group, so an internal tool is
 * never wrapped in customer-facing chrome, and neither is a JSON endpoint.
 * Route groups do not appear in the URL, so nothing here changes a public path.
 */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return <SiteFrame>{children}</SiteFrame>;
}
