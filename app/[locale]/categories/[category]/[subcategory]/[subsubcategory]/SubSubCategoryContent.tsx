"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { ProductCard } from "@/components";
import { SubSubCategory } from "@/types/SubSubCategoryType";
import { useUserProfile } from "@/hooks/useUserProfile";

type SupportedLocale = "fr" | "nl" | "en";

type Translatable = {
  name_fr: string;
  name_nl: string;
  name_en: string;
};

type SubSubCategoryContentProps = {
  subsubcategory: SubSubCategory;
  locale: SupportedLocale;

  // Breadcrumb info venant du parent
  categorySlug: string;
  subcategorySlug: string;
  categoryName: Translatable;
  subcategoryName: Translatable;
};

export default function SubSubCategoryContent({
  subsubcategory,
  locale,
  categorySlug,
  subcategorySlug,
  categoryName,
  subcategoryName,
}: SubSubCategoryContentProps) {
  const {isPro, loading} = useUserProfile();
  const getName = (obj: Translatable) =>
    locale === "fr" ? obj.name_fr : locale === "nl" ? obj.name_nl : obj.name_en;

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-12 space-y-16 relative top-28 pb-36">
      <nav className="flex items-center gap-2 text-sm font-medium text-gray-600">
        <Link
          href={`/${locale}/categories/${categorySlug}`}
          className="hover:text-orange-600 transition"
        >
          {getName(categoryName)}
        </Link>

        <ChevronRight className="w-4 h-4 text-gray-400" />

        <Link
          href={`/${locale}/categories/${categorySlug}/${subcategorySlug}`}
          className="hover:text-orange-600 transition"
        >
          {getName(subcategoryName)}
        </Link>

        <ChevronRight className="w-4 h-4 text-gray-400" />

        <span className="text-gray-900">{getName(subsubcategory)}</span>
      </nav>

      <h1 className="text-4xl font-semibold tracking-tight text-gray-900">
        {getName(subsubcategory)}
      </h1>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
      >
        {subsubcategory.products.length > 0 ? (
          <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {subsubcategory.products.map((prod) => (
              <ProductCard
                key={prod.id}
                product={prod}
                locale={locale}
                categorySlug={categorySlug}
                subcategorySlug={subcategorySlug}
                subsubcategorySlug={subsubcategory.slug}
                isPro={isPro}
              />
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 italic">
            Aucun produit trouvé dans cette sous-sous-catégorie.
          </p>
        )}
      </motion.div>
    </div>
  );
}
