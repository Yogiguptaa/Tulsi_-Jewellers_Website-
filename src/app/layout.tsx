import type { Metadata, Viewport } from "next";
import {
  Inter,
  Noto_Sans_Devanagari,
  Playfair_Display,
  Tiro_Devanagari_Hindi,
} from "next/font/google";
import "./globals.css";
import { SITE } from "@/lib/config";
import { LanguageProvider } from "@/components/providers/LanguageProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { ToastProvider } from "@/components/providers/ToastProvider";

/**
 * Applies the saved theme before the first paint. Without this, a visitor who
 * chose night on a light device would see a flash of the ivory palette while
 * React hydrates. Kept tiny and dependency-free on purpose.
 */
const THEME_BOOT_SCRIPT = `(function(){try{var s=localStorage.getItem('tulsi:theme');var night=s==='night'||(!s&&window.matchMedia('(prefers-color-scheme: dark)').matches);var r=document.documentElement;r.dataset.theme=night?'night':'day';r.style.colorScheme=night?'dark':'light';}catch(e){}})();`;

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const tiroDevanagari = Tiro_Devanagari_Hindi({
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["devanagari"],
  variable: "--font-tiro",
  display: "swap",
});

const notoSansDevanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  variable: "--font-noto-dev",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.baseUrl),
  // Every page sets its own complete, unique title that already carries the brand
  // (see lib/seo.ts `buildMetadata`), so the template is a pass-through. Adding
  // "| Tulsi Jewellers" here would print the shop name twice and push titles past
  // the ~60 characters a search result can show. (This Next version requires the
  // template whenever `default` is given.)
  title: {
    default: "Tulsi Jewellers | Jewellery Showroom in Hansapuri, Nagpur",
    template: "%s",
  },
  description: SITE.defaultMetaDescription,
  applicationName: "Tulsi Jewellers",
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "Tulsi Jewellers",
    title: "Tulsi Jewellers | Jewellery Showroom in Hansapuri, Nagpur",
    description: SITE.defaultMetaDescription,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#5A0F1B" },
    { media: "(prefers-color-scheme: dark)", color: "#12100d" },
  ],
  width: "device-width",
  initialScale: 1,
};

/**
 * The root layout holds only what every route needs: fonts, metadata and the two
 * client providers. Public chrome lives in the `(site)` route group and the admin
 * chrome in `admin/(dashboard)`, so neither is imposed on the other.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${inter.variable} ${tiroDevanagari.variable} ${notoSansDevanagari.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      <body className="min-h-screen bg-ivory antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-sm focus:bg-maroon focus:px-4 focus:py-2 focus:text-offwhite"
        >
          Skip to main content
        </a>
        <LanguageProvider>
          <ThemeProvider>
            <ToastProvider>{children}</ToastProvider>
          </ThemeProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
