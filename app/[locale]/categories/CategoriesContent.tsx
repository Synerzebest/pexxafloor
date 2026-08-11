"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Category } from "@/types/CategoryType";
import { useTranslations } from "next-intl";
import HomeInfoSidebar from "@/components/HomeInfoSidebar";

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
    <div className="relative top-12 mx-auto max-w-[1500px] space-y-14 px-4 py-16 md:px-8 sm:top-28">
      {/* ---------- HEADER ---------- */}
      <section className="space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
          {t('title')}
        </h1>
        <p className="text-gray-600 max-w-2xl">
          {t('subtitle')}
        </p>
      </section>

      <div className="grid items-start gap-10 lg:grid-cols-[280px_minmax(0,1fr)] xl:gap-14">
        <div className="hidden lg:block">
          <HomeInfoSidebar />
        </div>

        {/* ---------- GRILLE DES CATÉGORIES ---------- */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 gap-8 sm:grid-cols-2 xl:grid-cols-3 xl:gap-10"
        >
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/${locale}/categories/${cat.slug}`}
              className="group relative flex min-h-36 flex-col justify-end rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-gray-50/70 p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-orange-300 hover:shadow-lg sm:min-h-48"
            >
              <div className="space-y-2 pr-12">
                <h2 className="text-2xl font-semibold transition group-hover:text-orange-600">
                  {getName(cat)}
                </h2>
                <p className="text-sm text-gray-500">
                  {t("productCount", {
                    count: cat.subcategories?.reduce(
                      (total, subcategory) => total + (subcategory.products?.length ?? 0),
                      0
                    ) ?? 0,
                  })}
                </p>
              </div>

              <div className="absolute bottom-6 right-6 flex h-10 w-10 items-center justify-center rounded-full bg-orange-50 transition group-hover:bg-orange-100">
                <ChevronRight className="text-orange-600" />
              </div>
            </Link>
          ))}
        </motion.div>
      </div>

      <div className="lg:hidden">
        <HomeInfoSidebar />
      </div>
    </div>
  );
}
