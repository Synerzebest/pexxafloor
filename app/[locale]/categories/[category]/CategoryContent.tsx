"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { SlidersHorizontal } from "lucide-react";
import { ProductCard } from "@/components";

type SupportedLocale = "fr" | "nl" | "en";

type Product = {
  id: string;
  slug: string;
  name_fr: string;
  name_nl: string;
  name_en: string;
  price: number;
  product_images?: { image_url: string }[];
};
type Subcategory = {
  id: string;
  slug: string;
  name_fr: string;
  name_nl: string;
  name_en: string;
  products: Product[];
};
type Category = {
  id: string;
  slug: string;
  name_fr: string;
  name_nl: string;
  name_en: string;
  subcategories: Subcategory[];
};

export default function CategoryContent({
  category,
  locale,
}: {
  category: Category;
  locale: SupportedLocale;
}) {
  const getName = (obj: any) =>
    locale === "fr" ? obj.name_fr : locale === "nl" ? obj.name_nl : obj.name_en;

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 space-y-16">
      {/* Header catégorie */}
      <div className="flex items-center justify-between mb-10">
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">
          {getName(category)}
        </h1>
        <button className="flex items-center gap-2 text-gray-600 border rounded-full px-4 py-2 hover:bg-gray-100 transition">
          <SlidersHorizontal className="w-4 h-4" />
          Filtres
        </button>
      </div>

      {/* Sous-catégories */}
      {category.subcategories?.length > 0 ? (
        <div className="space-y-20">
          {category.subcategories.map((sub) => (
            <motion.section
              key={sub.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              {/* Header sous-catégorie */}
              <div className="flex items-center justify-between">
                <Link
                  href={`/${locale}/categories/${category.slug}/${sub.slug}`}
                  className="text-2xl md:text-3xl font-semibold hover:text-orange-600 transition"
                >
                  {getName(sub)}
                </Link>

                <Link
                  href={`/${locale}/categories/${category.slug}/${sub.slug}`}
                  className="text-sm text-orange-600 hover:underline"
                >
                  Voir tout →
                </Link>
              </div>

              {/* Produits en aperçu */}
              {sub.products?.length > 0 ? (
                <div className="overflow-x-auto pb-2">
                  <ul className="flex gap-6 snap-x snap-mandatory scroll-smooth">
                    {sub.products.slice(0, 4).map((prod) => (
                      <li
                        key={prod.id}
                        className="snap-start flex-shrink-0 w-64"
                      >
                        <ProductCard
                          product={prod}
                          locale={locale}
                          categorySlug={category.slug}
                          subcategorySlug={sub.slug}
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-gray-500 italic">
                  Aucun produit dans cette sous-catégorie
                </p>
              )}
            </motion.section>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 italic">Aucune sous-catégorie trouvée</p>
      )}
    </div>
  );
}
