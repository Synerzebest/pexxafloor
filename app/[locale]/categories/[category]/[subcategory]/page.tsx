import { supabase } from "@/lib/supabaseClient";
import { notFound } from "next/navigation";
import { Navbar, Footer, ProductCard } from "@/components";
import { getLocale } from "next-intl/server";
import { SubCategory } from "@/types/SubCategoryType";
import { Product } from "@/types/ProductType";

type SupportedLocale = "fr" | "nl" | "en";

type Translatable = {
  name_fr: string;
  name_nl: string;
  name_en: string;
};

export default async function SubcategoryPage({
  params,
}: {
  params: Promise<{ locale: string; category: string; subcategory: string }>;
}) {
  const { category, subcategory } = await params;

  const locale = (await getLocale()) as SupportedLocale;

  const { data, error } = await supabase
  .from("subcategories")
  .select(`
    id,
    slug,
    name_fr,
    name_nl,
    name_en,
    subsubcategories:subsubcategories!subsubcategories_subcategory_id_fkey (
      id,
      slug,
      name_fr,
      name_nl,
      name_en,
      products:products!products_subsub_id_fkey (
        id,
        slug,
        name_fr,
        name_nl,
        name_en,
        price,
        product_images!fk_product ( image_url )
      )
    )
  `)
  .eq("slug", subcategory)
  .single();



  if (error) {
    console.error("Supabase error:", error);
  }

  const subcat = data as SubCategory | null;
  if (!subcat) return notFound();

  const getName = (obj: Translatable) =>
    locale === "fr" ? obj.name_fr : locale === "nl" ? obj.name_nl : obj.name_en;

  return (
    <>
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-orange-600 mb-6">
          {getName(subcat)}
        </h1>

        <ul className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {subcat.subsubcategories.flatMap((ssc) =>
            ssc.products.map((prod: Product) => (
              <ProductCard
                key={prod.id}
                product={prod}
                locale={locale}
                categorySlug={category}
                subcategorySlug={subcat.slug}
                subsubcategorySlug={ssc.slug}
              />
            ))
          )}
        </ul>
      </div>

      <Footer />
    </>
  );
}
