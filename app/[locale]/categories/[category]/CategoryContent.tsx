"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { ProductCard } from "@/components";
import { Category } from "@/types/CategoryType";
import { SubSubCategory } from "@/types/SubSubCategoryType";

type SupportedLocale = "fr" | "nl" | "en";

export default function CategoryContent({
  category,
  locale,
}: {
  category: Category;
  locale: SupportedLocale;
}) {
  const getName = (
    obj: { name_fr: string; name_nl: string; name_en: string }
  ) => (locale === "fr" ? obj.name_fr : locale === "nl" ? obj.name_nl : obj.name_en);

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-16 space-y-12 relative top-28">
      {/* ---------- HEADER ---------- */}
      <section>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
          {getName(category)}
        </h1>
      </section>

      {/* ---------- GRILLE DE SOUS-CATÉGORIES ---------- */}
      {category.subcategories?.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {category.subcategories.map((sub) => (
            <Link
              key={sub.id}
              href={`/${locale}/categories/${category.slug}/${sub.slug}`}
              className="group relative flex items-center justify-between p-5 rounded-xl 
                        bg-white border border-gray-200 hover:border-orange-400
                        shadow-sm hover:shadow-md transition"
            >
              <div>
                <h2 className="text-xl font-semibold group-hover:text-orange-600 transition">
                  {getName(sub)}
                </h2>
                <p className="text-sm text-gray-500">
                  {sub.subsubcategories?.length ?? 0} sous-catégories
                </p>
              </div>

              <div
                className="w-10 h-10 rounded-full 
                          bg-orange-50 group-hover:bg-orange-100 
                          flex items-center justify-center 
                          transition shadow-inner"
              >
                <ChevronRight className="text-orange-600" />
              </div>
            </Link>
          ))}
        </motion.div>
      )}

      {/* ---------- SECTIONS DE PRODUITS POUR CHAQUE SOUS-CATÉGORIE ---------- */}
      {category.subcategories?.map((sub) => (
        <motion.section
          key={sub.id}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          viewport={{ once: true }}
          className="space-y-10"
        >
          {/* Titre sous-catégorie */}
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-semibold">{getName(sub)}</h2>
            <Link
              href={`/${locale}/categories/${category.slug}/${sub.slug}`}
              className="text-orange-600 hover:underline text-sm"
            >
              Voir tout →
            </Link>
          </div>

          {/* Liste des sous-sous-catégories */}
          {sub.subsubcategories?.map((ssc: SubSubCategory) => (
            <div key={ssc.id} className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-700">
                {getName(ssc)}
              </h3>

              {/* grid si peu de produits, carrousel si beaucoup */}
              {ssc.products.length <= 4 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                  {ssc.products.slice(0, 4).map((prod) => (
                    <ProductCard
                      key={prod.id}
                      product={prod}
                      locale={locale}
                      categorySlug={category.slug}
                      subcategorySlug={sub.slug}
                      subsubcategorySlug={ssc.slug}
                    />
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto pb-2">
                  <ul className="flex gap-6 snap-x snap-mandatory scroll-smooth">
                    {ssc.products.slice(0, 8).map((prod) => (
                      <li
                        key={prod.id}
                        className="snap-start flex-shrink-0 w-64"
                      >
                        <ProductCard
                          product={prod}
                          locale={locale}
                          categorySlug={category.slug}
                          subcategorySlug={sub.slug}
                          subsubcategorySlug={ssc.slug}
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </motion.section>
      ))}
    </div>
  );
}
