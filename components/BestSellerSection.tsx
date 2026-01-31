"use client";

import { useLocale } from "next-intl";
import ProductCard from "@/components/ProductCard";
import { useFetchBestSellers } from "@/hooks/useFetchBestSellers";
import { useUserProfile } from "@/hooks/useUserProfile";

export default function BestSellersSection() {
  const locale = useLocale();
  const { isPro, loading: loadingProfile } = useUserProfile();
  const { products, loading } = useFetchBestSellers(6);
  

  if (loading || products.length === 0) return null;

  return (
    <section className="relative top-24 py-20 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 flex flex-col items-center">
        <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-12 relative">
          Nos <span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">Best Sellers</span>
        </h2>

        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product: any) => {
            const categorySlug =
              product.subcategory.category.slug;

            const subcategorySlug =
              product.subcategory.slug;

            const subsubcategorySlug =
              product.subsubcategory?.slug ?? null;

            return (
              <ProductCard
                key={product.id}
                product={product}
                locale={locale as "fr" | "nl" | "en"}
                categorySlug={categorySlug}
                subcategorySlug={subcategorySlug}
                subsubcategorySlug={subsubcategorySlug}
                isPro={isPro}
              />
            );
          })}
        </ul>
      </div>
    </section>
  );
}
