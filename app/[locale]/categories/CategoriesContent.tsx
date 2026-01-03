"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Category } from "@/types/CategoryType";
import { useTranslations } from "next-intl";

type SupportedLocale = "fr" | "nl" | "en";

export default function CategoriesContent({
  categories,
  locale,
}: {
  categories: Category[];
  locale: SupportedLocale;
}) {
  const t = useTranslations("Categories");
  const getName = (
    obj: { name_fr: string; name_nl: string; name_en: string }
  ) =>
    locale === "fr"
      ? obj.name_fr
      : locale === "nl"
      ? obj.name_nl
      : obj.name_en;

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-16 space-y-12 relative top-12 sm:top-28">
      {/* ---------- HEADER ---------- */}
      <section className="space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
          {t('title')}
        </h1>
        <p className="text-gray-600 max-w-2xl">
          {t('subtitle')}
        </p>
      </section>

      {/* ---------- GRILLE DES CATÉGORIES ---------- */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/${locale}/categories/${cat.slug}`}
            className="group relative p-6 rounded-2xl 
                       bg-white border border-gray-200
                       hover:border-orange-400
                       shadow-sm hover:shadow-md
                       transition"
          >
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold group-hover:text-orange-600 transition">
                {getName(cat)}
              </h2>
              <p className="text-sm text-gray-500">
                {cat.subcategories?.length ?? 0} {t('subcat')}
              </p>
            </div>

            <div
              className="absolute bottom-6 right-6 w-10 h-10 rounded-full 
                         bg-orange-50 group-hover:bg-orange-100
                         flex items-center justify-center
                         transition"
            >
              <ChevronRight className="text-orange-600" />
            </div>
          </Link>
        ))}
      </motion.div>
    </div>
  );
}
