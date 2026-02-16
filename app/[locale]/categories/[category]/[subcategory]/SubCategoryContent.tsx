"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { ProductCard } from "@/components";
import { SubCategory } from "@/types/SubCategoryType";
import { Product } from "@/types/ProductType";
import { Category } from "@/types/CategoryType";
import { useUserProfile } from "@/hooks/useUserProfile";

type SupportedLocale = "fr" | "nl" | "en";

type SubCategoryContentProps = {
  subcategory: SubCategory;
  category: Category;
  locale: SupportedLocale;
};

export default function SubCategoryContent({
  subcategory,
  category,
  locale,
}: SubCategoryContentProps) {
  const { isPro, loading: loadingProfile } = useUserProfile();

  if (loadingProfile) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12 relative top-28">
        <p className="text-gray-500">Chargement...</p>
      </div>
    );
  }
  console.log("is pro", isPro)

  const getName = (obj: {
    name_fr: string;
    name_nl: string;
    name_en: string;
  }) =>
    locale === "fr"
      ? obj.name_fr
      : locale === "nl"
      ? obj.name_nl
      : obj.name_en;

  const hasSubSub = subcategory.subsubcategories.length > 0;
  const hasDirectProducts = subcategory.products?.length > 0;

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-12 space-y-12 relative top-28 pb-36">
      {/* breadcrumb */}
      <nav className="flex items-center gap-2 text-sm font-medium text-gray-600">
        <Link
          href={`/${locale}/categories/${category.slug}`}
          className="hover:text-orange-600 transition"
        >
          {getName(category)}
        </Link>
        <ChevronRight className="w-4 h-4 text-gray-400" />
        <span className="text-gray-900">{getName(subcategory)}</span>
      </nav>

      {/* titre */}
      <h1 className="text-4xl font-semibold tracking-tight text-gray-900">
        {getName(subcategory)}
      </h1>

      {/* liste sous sous catégories */}
      {hasSubSub && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {subcategory.subsubcategories.map((ssc) => (
            <Link
              key={ssc.id}
              href={`/${locale}/categories/${category.slug}/${subcategory.slug}/${ssc.slug}`}
              className="group relative flex items-center justify-between p-5 rounded-xl 
                         bg-white border border-gray-200 hover:border-orange-400
                         shadow-sm hover:shadow-md transition"
            >
              <div>
                <h2 className="text-xl font-semibold group-hover:text-orange-600 transition">
                  {getName(ssc)}
                </h2>
                <p className="text-sm text-gray-500">
                  {ssc.products.length} produits
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

      {/* produits sans subsub) */}
      {hasDirectProducts && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="space-y-6"
        >
          <h2 className="text-2xl font-semibold text-gray-800">
            Produits
          </h2>

          <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {subcategory.products.map((prod: Product) => (
              <ProductCard
                key={prod.id}
                product={prod}
                locale={locale}
                categorySlug={category.slug}
                subcategorySlug={subcategory.slug}
                subsubcategorySlug={null}
                isPro={isPro}
              />
            ))}
          </ul>
        </motion.section>
      )}

      {/* produits par sous sous cat*/}
      {subcategory.subsubcategories.map((ssc) => (
        <motion.section
          key={ssc.id}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-gray-800">
              {getName(ssc)}
            </h2>

            <Link
              href={`/${locale}/categories/${category.slug}/${subcategory.slug}/${ssc.slug}`}
              className="text-orange-600 text-sm hover:underline"
            >
              Voir tout →
            </Link>
          </div>

          {ssc.products.length > 0 ? (
            <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {ssc.products.map((prod: Product) => (
                <ProductCard
                  key={prod.id}
                  product={prod}
                  locale={locale}
                  categorySlug={category.slug}
                  subcategorySlug={subcategory.slug}
                  subsubcategorySlug={ssc.slug}
                  isPro={isPro}
                />
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 italic">
              Aucun produit dans {getName(ssc)}.
            </p>
          )}
        </motion.section>
      ))}
    </div>
  );
}
