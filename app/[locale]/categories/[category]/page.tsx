import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { getLocale } from "next-intl/server";
import { Navbar, Footer } from "@/components";
import CategoryContent from "./CategoryContent";
import { Category } from "@/types/CategoryType";

type SupportedLocale = "fr" | "nl" | "en";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ locale: string; category: string }>;
}) {
  const { category } = await params;
  const locale = (await getLocale()) as SupportedLocale;

  const { data, error } = await supabase
  .from("categories")
  .select(`
    id,
    slug,
    name_fr,
    name_nl,
    name_en,

    subcategories:subcategories!subcategories_category_id_fkey (
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
          product_images!product_images_product_id_fkey ( image_url )
        )
      )
    )
  `)
  .eq("slug", category)
  .single();


  if (error || !data) return notFound();

  const categoryData = data as unknown as Category | null;
  if (!categoryData) return notFound();

  return (
    <>
      <Navbar />
      <CategoryContent category={categoryData} locale={locale} />
      <Footer />
    </>
  );
}
