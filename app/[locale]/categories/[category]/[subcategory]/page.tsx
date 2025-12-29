import { supabase } from "@/lib/supabaseClient";
import { notFound } from "next/navigation";
import { Navbar, Footer } from "@/components";
import { getLocale } from "next-intl/server";
import { SubCategory } from "@/types/SubCategoryType";
import { Category } from "@/types/CategoryType";
import SubCategoryContent from "./SubCategoryContent";

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
        products:products_with_discount!products_subsub_id_fkey (
          id,
          slug,
          name_fr,
          name_nl,
          name_en,
          price,
          price_after_discount,
          applied_discount,
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

  const { data: categoryData } = await supabase
    .from("categories")
    .select("id, slug, name_fr, name_nl, name_en")
    .eq("slug", category)
    .single();

  const parentCategory = categoryData as Category | null;
  if (!parentCategory) return notFound();

  return (
    <>
      <Navbar />

      <SubCategoryContent
        subcategory={subcat}
        category={parentCategory}
        locale={locale}
      />

      <Footer />
    </>
  );
}
