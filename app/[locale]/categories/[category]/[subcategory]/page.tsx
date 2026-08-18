import { supabase } from "@/lib/supabaseClient";
import { notFound } from "next/navigation";
import { Navbar, Footer, ProBadge } from "@/components";
import { getLocale } from "next-intl/server";
import { SubCategory } from "@/types/SubCategoryType";
import { Category } from "@/types/CategoryType";
import CategorySidebarShell from "@/components/CategorySidebarShell";
import SubCategoryContent from "./SubCategoryContent";

type SupportedLocale = "fr" | "nl" | "en";

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

      category:category_id (
        id,
        discount
      ),

      products:products!products_subcategory_id_fkey (
        id,
        slug,
        name_fr,
        name_nl,
        name_en,
        price,
        reference,
        subsub_id,
        subsub:subsub_id ( slug ),
        product_images!fk_product ( image_url ),
        subcategory:subcategory_id (
          category:category_id ( id, discount )
        )
      ),

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
          reference,
          subsub_id,
          subsub:subsub_id ( slug ),
          product_images!fk_product ( image_url ),
          subcategory:subcategory_id (
            category:category_id ( id, discount )
          )
        )
      )
    `)
    .eq("slug", subcategory)
    .single();

  if (error || !data) {
    console.error("Supabase error:", error);
    return notFound();
  }

  const subcat = data as unknown as SubCategory;

  const { data: categoryData, error: catErr } = await supabase
    .from("categories")
    .select("id, slug, name_fr, name_nl, name_en")
    .eq("slug", category)
    .single();

  if (catErr || !categoryData) return notFound();

  return (
    <>
      <Navbar />
      <ProBadge />

      <CategorySidebarShell>
        <SubCategoryContent
          subcategory={subcat}
          category={categoryData as Category}
          locale={locale}
        />
      </CategorySidebarShell>

      <Footer />
    </>
  );
}
