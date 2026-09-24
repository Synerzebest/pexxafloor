import Link from "next/link";
import { getLocale } from "next-intl/server";
import { publicCatalog, nameFor, type NamedRow } from "@/lib/seo/catalog";
import { pageCopy, seoLocale } from "@/lib/seo/metadata";

export default async function HomePackLinks() {
  const locale = seoLocale(await getLocale());
  const { data, error } = await publicCatalog().from("packs")
    .select("id, slug, name_fr, name_nl, name_en").eq("active", true).order("sort_order");
  if (error || !data?.length) return null;
  const title = { fr: "Choisissez votre système de chauffage au sol", nl: "Kies uw vloerverwarmingssysteem", en: "Choose your underfloor heating system" }[locale];
  const action = { fr: "Configurer ce pack", nl: "Dit pakket samenstellen", en: "Configure this package" }[locale];
  return <section className="mx-auto max-w-7xl px-6 py-12">
    <h2 className="text-3xl font-semibold text-gray-900">{title}</h2>
    <div className="mt-6 grid gap-6 md:grid-cols-3">
      {(data as NamedRow[]).map(pack => <article key={pack.id} className="rounded-2xl border border-orange-100 bg-orange-50/50 p-6">
        <h3 className="text-xl font-semibold">{nameFor(pack, locale)}</h3>
        <p className="mt-3 text-sm leading-6 text-gray-600">{pageCopy[locale].pack(nameFor(pack, locale))}</p>
        <Link className="mt-4 inline-block font-semibold text-orange-700 underline underline-offset-4" href={`/${locale}/packs/${encodeURIComponent(pack.slug)}`}>{action}</Link>
      </article>)}
    </div>
  </section>;
}
