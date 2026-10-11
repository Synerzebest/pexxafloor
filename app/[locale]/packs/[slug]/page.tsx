import Image from "next/image";
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
    <header className="relative overflow-hidden rounded-2xl bg-gray-50">
      {/* Image: right side on desktop, top on mobile */}
      <div className="relative aspect-[16/9] w-full md:absolute md:inset-y-0 md:right-0 md:aspect-auto md:w-[60%]">
        <Image
          src={pack.image_url || "/images/box.png"}
          alt={name}
          fill
          priority
          sizes="(min-width: 768px) 60vw, 100vw"
          className="object-cover"
        />
        {/* Fade into the banner background */}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-50 via-gray-50/20 to-transparent md:bg-gradient-to-r md:from-gray-50 md:via-gray-50/40 md:to-transparent" />
      </div>

      <div className="relative px-6 pb-8 pt-2 md:flex md:min-h-[320px] md:w-1/2 md:flex-col md:justify-center md:px-10 md:py-12 lg:min-h-[380px]">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">{name}</h1>
        <p className="mt-3 max-w-xl text-gray-600">{pageCopy[seoLocale(locale)].pack(name)}</p>
      </div>
    </header>
  } />;
}
