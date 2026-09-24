import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { SITE_URL } from "@/lib/seo/metadata";
import "./globals.css";
import { Newsreader } from "next/font/google";
import { CartProvider } from "@/context/CartContext"
import { Analytics } from "@vercel/analytics/next"

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "PexxaFloor", template: "%s | PexxaFloor" },
  robots: process.env.VERCEL_ENV === "preview" ? { index: false, follow: false } : { index: true, follow: true },
};

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
});

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  return (
    <html lang={locale} className={newsreader.variable}>
      <body>
        <Analytics />
        <CartProvider>
          {children}
        </CartProvider>
      </body>
    </html>
  );
}
