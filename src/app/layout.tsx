import type { Metadata, Viewport } from "next";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import "./globals.css";

export const metadata: Metadata = {
  title: "Zenexis Online | Computer Accessories, Stationery, Mobiles & Gifts - Ambalangoda",
  description: "Your one-stop shop for Genuine Computer Accessories, Keypad & Smartphones, Complete Stationery, and Unique Gift Items. Enjoy Island-wide Cash on Delivery and Instant WhatsApp Confirmation.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0f172a",
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
    <html lang="en" className="h-full dark" data-theme="dark" suppressHydrationWarning>
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
                  var saved = localStorage.getItem('zenexis_theme_v1');
                  var theme = saved === 'light' ? 'light' : 'dark';
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
      </head>
      <body className="min-h-full bg-slate-50 dark:bg-[#070b14] text-slate-900 dark:text-slate-100 antialiased font-sans selection:bg-cyan-500 selection:text-white transition-colors duration-200">
        <PWAInstallPrompt />
        {children}
      </body>
    </html>
  );
}
