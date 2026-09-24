import PackConfigurator from "./PackConfigurator";
import { packRecord, nameFor } from "@/lib/seo/catalog";
import { pageMetadata, pageCopy, seoLocale } from "@/lib/seo/metadata";

type Props = { params: Promise<{ locale: string; slug: string }> };
export async function generateMetadata({ params }: Props) {
  const { locale, slug } = await params;
  const pack = await packRecord(slug);
  const name = nameFor(pack, locale);
  return pageMetadata(locale, `packs/${encodeURIComponent(slug)}`, name, pageCopy[seoLocale(locale)].pack(name), pack.image_url);
}
export default async function PackPage({ params }: Props) {
  const { locale, slug } = await params;
  const pack = await packRecord(slug);
  const name = nameFor(pack, locale);
  return <PackConfigurator introduction={
    <header>
      <h1 className="text-3xl md:text-4xl font-bold text-gray-900">{name}</h1>
      <p className="mt-3 max-w-3xl text-gray-600">{pageCopy[seoLocale(locale)].pack(name)}</p>
    </header>
  } />;
}
