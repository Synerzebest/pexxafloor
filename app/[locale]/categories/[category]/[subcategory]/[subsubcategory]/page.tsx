import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { getLocale } from "next-intl/server";
import { Navbar, Footer, ProBadge } from "@/components";
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

  const { data: subsubData, error: subsubError } = await supabase
    .from("subsubcategories")
    .select(`
      id,
      slug,
      name_fr,
      name_nl,
      name_en,
      products:products_with_discount!products_subsub_id_fkey (
        id,
        slug,
        name_fr,
        name_nl,
        name_en,
        price,
        price_after_discount,
        applied_discount,
        product_images!fk_product (image_url)
      )      
    `)
    .eq("slug", subsubcategory)
    .single();

  if (subsubError || !subsubData) {
    console.error(subsubError);
    return notFound();
  }

  const subSubCategoryData = subsubData as unknown as SubSubCategory;

  const { data: subcatData, error: subcatError } = await supabase
    .from("subcategories")
    .select("name_fr, name_nl, name_en")
    .eq("slug", subcategory)
    .single();

  if (subcatError || !subcatData) {
    console.error(subcatError);
    return notFound();
  }

  const { data: catData, error: catError } = await supabase
    .from("categories")
    .select("name_fr, name_nl, name_en")
    .eq("slug", category)
    .single();

  if (catError || !catData) {
    console.error(catError);
    return notFound();
  }

  return (
    <>
      <Navbar />
      <ProBadge />

      <SubSubCategoryContent
        subsubcategory={subSubCategoryData}
        locale={locale}
        categorySlug={category}
        subcategorySlug={subcategory}
        categoryName={catData}
        subcategoryName={subcatData}
      />

      <Footer />
    </>
  );
}
