import { staticMetadata } from "@/lib/seo/metadata";
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return staticMetadata((await params).locale, "categories");
}

import { notFound } from "next/navigation";
import { publicCatalog } from "@/lib/seo/catalog";
const supabase = publicCatalog();
import { getLocale } from "next-intl/server";
import { Navbar, Footer, ProBadge } from "@/components";
import CategoriesContent from "./CategoriesContent";
import { Category } from "@/types/CategoryType";

type SupportedLocale = "fr" | "nl" | "en";

export default async function CategoriesPage() {
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
        products:products!products_subcategory_id_fkey (
          id
        )
      )
    `)
    .order("id");

  if (error || !data) return notFound();

  return (
    <>
      <Navbar />
      <ProBadge />
      <CategoriesContent
        categories={data as unknown as Category[]}
        locale={locale}
      />
      <Footer />
    </>
  );
}
