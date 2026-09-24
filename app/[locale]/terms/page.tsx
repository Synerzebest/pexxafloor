import { pageMetadata } from "@/lib/seo/metadata";
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const content = getLegalContent(locale, "terms");
  return pageMetadata(locale, "terms", content.title, content.description);
}

import { Footer, Navbar } from "@/components";
import LegalDocument from "@/components/legal/LegalDocument";
import { getLegalContent } from "@/components/legal/legalContent";

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <><Navbar /><LegalDocument locale={locale} {...getLegalContent(locale, "terms")} /><Footer /></>;
}
