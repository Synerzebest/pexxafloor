"use client";

import { motion } from "framer-motion";
import { SlidersHorizontal } from "lucide-react";
import { ProductCard } from "@/components";
import { SubSubCategory } from "@/types/SubSubCategoryType";

type SupportedLocale = "fr" | "nl" | "en";

type Translatable = {
  name_fr: string;
  name_nl: string;
  name_en: string;
};

export default function SubSubCategoryContent({
  subsubcategory,
  locale,
  categorySlug,
  subcategorySlug,
}: {
  subsubcategory: SubSubCategory;
  locale: SupportedLocale;
  categorySlug: string;
  subcategorySlug: string;
}) {
  const getName = (obj: Translatable): string => {
    switch (locale) {
      case "fr":
        return obj.name_fr;
      case "nl":
        return obj.name_nl;
      default:
        return obj.name_en;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 space-y-12">
      {/* Header sous-sous-catégorie */}
      <div className="flex items-center justify-between mb-10">
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">
          {getName(subsubcategory)}
        </h1>
        <button className="flex items-center gap-2 text-gray-600 border rounded-full px-4 py-2 hover:bg-gray-100 transition">
          <SlidersHorizontal className="w-4 h-4" />
          Filtres
        </button>
      </div>

      {/* Liste des produits */}
      {subsubcategory.products?.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          viewport={{ once: true }}
        >
          <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {subsubcategory.products.map((prod) => (
              <li key={prod.id}>
                <ProductCard
                  product={prod}
                  locale={locale}
                  categorySlug={categorySlug}
                  subcategorySlug={subcategorySlug}
                  subsubcategorySlug={subsubcategory.slug}
                />
              </li>
            ))}
          </ul>
        </motion.div>
      ) : (
        <p className="text-gray-500 italic">
          Aucun produit dans cette sous-sous-catégorie
        </p>
      )}
    </div>
  );
}
