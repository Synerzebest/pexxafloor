import { categoryMetadata } from "@/lib/seo/catalog";
export async function generateMetadata({ params }: { params: Promise<{ locale: string; category: string }> }) {
  return categoryMetadata(await params);
}

import { notFound } from "next/navigation";
import { publicCatalog } from "@/lib/seo/catalog";
const supabase = publicCatalog();
import { getLocale } from "next-intl/server";
import { Navbar, Footer, ProBadge } from "@/components";
import CategoryContent from "./CategoryContent";
import { Category } from "@/types/CategoryType";
import CategorySidebarShell from "@/components/CategorySidebarShell";

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
    discount,

    subcategories:subcategories!subcategories_category_id_fkey (
      id,
      slug,
      name_fr,
      name_nl,
      name_en,

      products:products!products_subcategory_id_fkey (
        id,
        slug,
        name_fr,
        name_nl,
        name_en,
        price,
        reference,
        sort_order,
        subsub_id,
        subsub:subsub_id ( slug ),
        product_images!fk_product ( image_url ),
        subcategory:subcategory_id (
          id,
          category:category_id (
            id,
            discount
          )
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
          sort_order,
          subsub_id,
          subsub:subsub_id (
            slug
          ),
          product_images!fk_product ( image_url ),
          subcategory:subcategory_id (
            id,
            category:category_id (
              id,
              discount
            )
          )
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
      <ProBadge />
      <CategorySidebarShell>
        <CategoryContent category={categoryData} locale={locale} />
      </CategorySidebarShell>
      <Footer />
    </>
  );
}
