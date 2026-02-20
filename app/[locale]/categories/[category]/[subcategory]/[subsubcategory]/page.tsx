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


  const { data: catData, error: catError } = await supabase
    .from("categories")
    .select("id, name_fr, name_nl, name_en")
    .eq("slug", category)
    .single();

  if (catError || !catData) return notFound();


  const { data: subcatData, error: subcatError } = await supabase
    .from("subcategories")
    .select("id, name_fr, name_nl, name_en")
    .eq("slug", subcategory)
    .eq("category_id", catData.id)   // 🔥 sécurisation
    .single();

  if (subcatError || !subcatData) return notFound();


  const { data: subsubData, error: subsubError } = await supabase
    .from("subsubcategories")
    .select(`
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
        reference,
        subsub_id,
        subsub:subsub_id ( slug ),
        product_images!fk_product (image_url),
        subcategory:subcategory_id (
          category:category_id (
            discount
          )
        )
      )
    `)
    .eq("slug", subsubcategory)
    .eq("subcategory_id", subcatData.id)
    .single();

  if (subsubError || !subsubData) {
    console.error(subsubError);
    return notFound();
  }

  return (
    <>
      <Navbar />
      <ProBadge />

      <SubSubCategoryContent
        subsubcategory={subsubData as unknown as SubSubCategory}
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