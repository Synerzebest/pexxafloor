import type { Metadata } from "next";

// Canonicals must never inherit a localhost or Vercel preview origin.
export const SITE_URL = "https://www.pexxafloor.be";
export const locales = ["fr", "nl", "en"] as const;
export type Locale = typeof locales[number];
export function seoLocale(value: string): Locale {
  return value === "fr" || value === "nl" ? value : "en";
}
export function absoluteUrl(path: string) { return new URL(path, SITE_URL).toString(); }
export function localizedPath(locale: string, path = "") {
  return `/${seoLocale(locale)}${path ? `/${path.replace(/^\/+/, "")}` : ""}`;
}
export function languageAlternates(path: string) {
  return Object.fromEntries(locales.map(locale => [locale, absoluteUrl(localizedPath(locale, path))]));
}
export function plainText(value: string | null | undefined) {
  return (value || "").replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
}
export function descriptionText(value: string) {
  const text = plainText(value);
  return text.length <= 160 ? text : `${text.slice(0, 157).replace(/\s+\S*$/, "")}…`;
}
export function pageMetadata(locale: string, path: string, title: string, description: string, image?: string): Metadata {
  const lang = seoLocale(locale);
  const url = absoluteUrl(localizedPath(lang, path));
  const fullTitle = `${title} | PexxaFloor`;
  const images = [{ url: absoluteUrl(image || "/opengraph-image"), alt: title }];
  return {
    title: { absolute: fullTitle }, description: descriptionText(description),
    alternates: { canonical: url, languages: languageAlternates(path) },
    openGraph: {
      type: "website", siteName: "PexxaFloor", title: fullTitle,
      description: descriptionText(description), url, images,
      locale: {fr:"fr_BE",nl:"nl_BE",en:"en_GB"}[lang],
      alternateLocale: locales.filter(l => l !== lang).map(l => ({fr:"fr_BE",nl:"nl_BE",en:"en_GB"}[l])),
    },
    twitter: { card: "summary_large_image", title: fullTitle, description: descriptionText(description), images },
  };
}
export const privateMetadata: Metadata = {
  robots: { index: false, follow: false },
};
export const pageCopy = {
  fr: {
    home: ["Chauffage au sol : kits et packs sur mesure", "Configurez votre pack de chauffage au sol sur mesure. Estimation en ligne, équipements et accessoires pour particuliers et professionnels."],
    categories: ["Matériel et accessoires de chauffage au sol", "Découvrez notre catalogue de chauffage au sol : équipements, composants et accessoires pour composer votre installation."],
    quote: ["Configurateur de chauffage au sol : estimez votre pack", "Indiquez votre surface, comparez les systèmes et configurez votre pack de chauffage au sol pour obtenir une estimation en ligne."],
    pro: ["Chauffage au sol pour professionnels", "Installateurs, plombiers et chauffagistes : découvrez les conditions PRO PexxaFloor, les remises et la livraison sur chantier."],
    category: (name: string) => `Découvrez ${name} pour votre chauffage au sol. Consultez les produits, leurs caractéristiques et les prix dans le catalogue PexxaFloor.`,
    pack: (name: string) => `Configurez votre pack ${name} pour le chauffage au sol : surface, composants et options adaptés à votre projet. Obtenez une estimation en ligne.`,
  },
  nl: {
    home: ["Vloerverwarming: pakketten op maat", "Stel uw vloerverwarmingspakket op maat samen. Online prijsraming, materialen en accessoires voor particulieren en professionals."],
    categories: ["Materialen en accessoires voor vloerverwarming", "Ontdek ons assortiment vloerverwarming: materialen, onderdelen en accessoires om uw installatie samen te stellen."],
    quote: ["Vloerverwarming configurator: bereken uw pakket", "Voer uw oppervlakte in, vergelijk systemen en stel uw vloerverwarmingspakket samen voor een online prijsraming."],
    pro: ["Vloerverwarming voor professionals", "Ontdek de PRO-voorwaarden van PexxaFloor voor installateurs: kortingen, levering op de werf en ondersteuning."],
    category: (name: string) => `Ontdek ${name} voor uw vloerverwarming. Bekijk producten, specificaties en prijzen in de PexxaFloor-catalogus.`,
    pack: (name: string) => `Stel uw vloerverwarmingspakket ${name} samen: oppervlakte, onderdelen en opties voor uw project. Bereken uw prijs online.`,
  },
  en: {
    home: ["Underfloor heating: kits and tailored packages", "Configure your underfloor heating package. Get an online estimate and explore equipment and accessories for homeowners and professionals."],
    categories: ["Underfloor heating equipment and accessories", "Browse our underfloor heating catalogue: equipment, components and accessories to build your installation."],
    quote: ["Underfloor heating configurator: estimate your package", "Enter your floor area, compare systems and configure your underfloor heating package for an online estimate."],
    pro: ["Underfloor heating for professionals", "Explore PexxaFloor PRO conditions for installers: discounts, delivery to your project site and dedicated support."],
    category: (name: string) => `Explore ${name} for underfloor heating. Compare products, specifications and prices in the PexxaFloor catalogue.`,
    pack: (name: string) => `Configure your ${name} underfloor heating package: floor area, components and options for your project. Get an online estimate.`,
  },
};
export function staticMetadata(locale: string, key: "home" | "categories" | "quote" | "pro") {
  const [title, description] = pageCopy[seoLocale(locale)][key];
  return pageMetadata(locale, key === "home" ? "" : key, title, description);
}
