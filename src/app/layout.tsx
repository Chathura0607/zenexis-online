import type { Metadata, Viewport } from "next";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL('https://zenexismart.com'),
  title: {
    default: 'Zenexismart (Zenexis Online) | Computer Accessories, Stationery & Past Papers Ambalangoda',
    template: '%s | Zenexismart',
  },
  description:
    'Zenexismart (Zenexis Online) - Official online showroom in Ambalangoda, Sri Lanka. Shop genuine computer accessories, school stationery, mobile phones, gift items, and download free Grade 1-13 past papers with island-wide Cash on Delivery.',
  keywords: [
    'Zenexismart',
    'zenexismart.com',
    'Zenexis',
    'Zenexis Online',
    'Zenexis Ambalangoda',
    'Computer Accessories Ambalangoda',
    'Stationery Shop Ambalangoda',
    'Past Papers Sri Lanka',
    'Term Test Papers',
    'G.C.E O/L Past Papers',
    'G.C.E A/L Past Papers',
    'Pre-School Worksheets Sri Lanka',
    'Cash on Delivery Sri Lanka',
  ],
  authors: [{ name: 'Zenexis Ambalangoda', url: 'https://zenexismart.com' }],
  creator: 'Zenexis',
  publisher: 'Zenexismart',
  alternates: {
    canonical: 'https://zenexismart.com',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://zenexismart.com',
    siteName: 'Zenexismart',
    title: 'Zenexismart (Zenexis Online) | Computer Accessories & School Stationery',
    description:
      'Official Zenexismart online store in Ambalangoda. Shop computer accessories, school booklist packages, mobile phones, and download free past papers.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Zenexismart (Zenexis Online) - Ambalangoda',
    description:
      'Official Zenexismart online store in Ambalangoda. Shop computer accessories, stationery, and free past papers.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#ffffff",
  viewportFit: "cover",
};

// Check environment for basePath (Vercel uses root /, GitHub Pages uses /zenexis-online)
const isGithubActions = process.env.GITHUB_ACTIONS === 'true';
const basePath = isGithubActions ? '/zenexis-online' : '';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full light" data-theme="light" suppressHydrationWarning>
      <head>
        <link
          rel="icon"
          type="image/svg+xml"
          href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%2306b6d4'/%3E%3Cstop offset='100%25' stop-color='%233b82f6'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='64' height='64' rx='16' fill='%23030712'/%3E%3Crect x='3' y='3' width='58' height='58' rx='14' fill='none' stroke='url(%23g)' stroke-width='2.5'/%3E%3Ctext x='32' y='42' font-family='sans-serif' font-size='32' font-weight='900' fill='url(%23g)' text-anchor='middle'%3EZ%3C/text%3E%3Ccircle cx='48' cy='18' r='4' fill='%2306b6d4'/%3E%3C/svg%3E"
        />
        <link rel="manifest" href={`${basePath}/manifest.json`} />
        <link rel="apple-touch-icon" href={`${basePath}/icons/icon-192.png`} />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('zenexis_theme_v2');
                  var theme = saved === 'dark' ? 'dark' : 'light';
                  var root = document.documentElement;
                  root.classList.remove('light', 'dark');
                  root.classList.add(theme);
                  root.setAttribute('data-theme', theme);
                  root.style.colorScheme = theme;
                } catch (e) {}
              })();
            `,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Store',
              name: 'Zenexismart (Zenexis Online)',
              alternateName: ['Zenexismart', 'Zenexis', 'Zenexis Ambalangoda', 'Zenexis Online'],
              url: 'https://zenexismart.com',
              logo: 'https://zenexismart.com/icons/icon-512.png',
              image: 'https://zenexismart.com/icons/icon-512.png',
              description:
                'Zenexismart is the official online store for Zenexis in Ambalangoda, Sri Lanka. Offering genuine computer accessories, school stationery, mobile phones, and free school term test past papers with island-wide cash on delivery.',
              telephone: '+94701120945',
              priceRange: 'LKR',
              address: {
                '@type': 'PostalAddress',
                streetAddress: 'Main Showroom, Near Bus Stand',
                addressLocality: 'Ambalangoda',
                addressRegion: 'Southern Province',
                addressCountry: 'LK',
              },
              geo: {
                '@type': 'GeoCoordinates',
                latitude: 6.2361,
                longitude: 80.0542,
              },
              openingHoursSpecification: [
                {
                  '@type': 'OpeningHoursSpecification',
                  dayOfWeek: [
                    'Monday',
                    'Tuesday',
                    'Wednesday',
                    'Thursday',
                    'Friday',
                    'Saturday',
                    'Sunday',
                  ],
                  opens: '08:00',
                  closes: '20:30',
                },
              ],
              sameAs: ['https://wa.me/94701120945'],
            }),
          }}
        />
      </head>
      <body className="min-h-full bg-slate-50 dark:bg-[#070b14] text-slate-900 dark:text-slate-100 antialiased font-sans selection:bg-cyan-500 selection:text-white transition-colors duration-200">
        <PWAInstallPrompt />
        {children}
      </body>
    </html>
  );
}
