import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { getLocale } from "next-intl/server";
import { Navbar, Footer } from "@/components";
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
        id
      )
    `)
    .order("id");

  if (error || !data) return notFound();

  return (
    <>
      <Navbar />
      <CategoriesContent
        categories={data as unknown as Category[]}
        locale={locale}
      />
      <Footer />
    </>
  );
}
