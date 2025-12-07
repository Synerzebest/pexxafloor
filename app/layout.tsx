import type { Metadata } from "next";
import "./globals.css";
import { Newsreader } from "next/font/google";

export const metadata: Metadata = {
  title: "PexxaFloor",
  description: "Le site de chauffage au sol n°1",
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
      <body>{children}</body>
    </html>
  );
}
