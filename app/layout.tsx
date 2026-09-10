import type { Metadata } from "next";
import "./globals.css";
import { Newsreader } from "next/font/google";
import { CartProvider } from "@/context/CartContext"
import { Analytics } from "@vercel/analytics/next"

export const metadata: Metadata = {
  title: "Chauffage au sol : kits et packs sur mesure | PexxaFloor",
  description:
    "Configurez votre pack de chauffage au sol sur mesure avec PexxaFloor. Estimation immédiate en ligne, équipements et accessoires pour particuliers et professionnels.",
};

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={newsreader.variable}>
      <body>
        <Analytics />
        <CartProvider>
          {children}
        </CartProvider>
      </body>
    </html>
  );
}
