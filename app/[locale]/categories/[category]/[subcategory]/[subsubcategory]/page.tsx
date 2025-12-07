import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { getLocale } from "next-intl/server";
import { Navbar, Footer } from "@/components";
import SubSubCategoryContent from "./SubSubCategoryContent";
import { SubSubCategory } from "@/types/SubSubCategoryType";

type SupportedLocale = "fr" | "nl" | "en";

export default async function SubSubCategoryPage({
  params,
}: {
  params: Promise<{
    locale: string;
    category: string;
    subcategory: string;
    subsubcategory: string;
  }>;
}) {
  const { category, subcategory, subsubcategory } = await params;
  const locale = (await getLocale()) as SupportedLocale;

  // 🔹 Récupération complète de la sous-sous-catégorie
  const { data, error } = await supabase
    .from("subsubcategories")
    .select(`
      id,
      slug,
      name_fr,
      name_nl,
      name_en,
      products (
        id,
        slug,
        name_fr,
        name_nl,
        name_en,
        price,
        product_images!fk_product (
          image_url
        )
      ),
      subcategory:subcategory_id (
        slug,
        category:category_id ( slug )
      )
    `)
    .eq("slug", subsubcategory)
    .single();


  if (error || !data) return notFound();

  const subSubCategoryData = data as SubSubCategory;

  return (
    <>
      <Navbar />
      <SubSubCategoryContent
        subsubcategory={subSubCategoryData}
        locale={locale}
        categorySlug={category}
        subcategorySlug={subcategory}
      />
      <Footer />
    </>
  );
}
