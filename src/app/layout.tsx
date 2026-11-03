import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Zenexis Online | Computer Accessories, Stationery & Mobile Shop - Ambalangoda",
  description: "Official online store for Zenexis in Ambalangoda. Order Computer Accessories, School Stationery, Mobile Phones & Chargers with Island-wide Delivery & Instant WhatsApp Confirmation.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0f172a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="min-h-full bg-slate-950 text-slate-100 antialiased font-sans selection:bg-cyan-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
