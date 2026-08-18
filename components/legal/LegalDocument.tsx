import Link from "next/link";

export type LegalSection = {
  title: string;
  paragraphs?: string[];
  items?: string[];
};

type Props = {
  locale: string;
  title: string;
  description: string;
  updated: string;
  sections: LegalSection[];
};

export default function LegalDocument({ locale, title, description, updated, sections }: Props) {
  return (
    <main className="mx-auto max-w-4xl px-4 pb-20 pt-32 sm:px-6 sm:pt-40">
      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-600">PexxaFloor</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl">{title}</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-gray-600">{description}</p>
        <p className="mt-3 text-xs text-gray-400">{updated}</p>

        <div className="mt-10 space-y-9">
          {sections.map((section) => (
            <section key={section.title} className="border-t border-gray-100 pt-7">
              <h2 className="text-xl font-semibold text-gray-900">{section.title}</h2>
              {section.paragraphs?.map((paragraph) => (
                <p key={paragraph} className="mt-3 whitespace-pre-line text-sm leading-7 text-gray-600">{paragraph}</p>
              ))}
              {section.items && (
                <ul className="mt-3 space-y-2 pl-5 text-sm leading-7 text-gray-600">
                  {section.items.map((item) => <li key={item} className="list-disc pl-1">{item}</li>)}
                </ul>
              )}
            </section>
          ))}
        </div>

        <div className="mt-12 border-t border-gray-100 pt-6">
          <Link href={`/${locale}`} className="text-sm font-semibold text-orange-600 transition hover:text-orange-700">
            ← {locale === "fr" ? "Retour à l’accueil" : locale === "nl" ? "Terug naar home" : "Back to home"}
          </Link>
        </div>
      </div>
    </main>
  );
}
