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
    .select<any>(`
      id,
      slug,
      name_fr,
      name_nl,
      name_en,
      subcategories (
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
          product_images!fk_product ( image_url )
        )
      )
    `)
    .eq("slug", category)
    .single<Category>();

  if (error || !data) return notFound();

  return (
    <>
      <Navbar />
      <CategoryContent category={data} locale={locale} />
      <Footer />
    </>
  );
}
