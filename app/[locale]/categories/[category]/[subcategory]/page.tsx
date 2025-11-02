import { supabase } from "@/lib/supabaseClient";
import { notFound } from "next/navigation";
import { Navbar, Footer, ProductCard } from "@/components";
import { getLocale } from "next-intl/server";

// ---- Types ----
type SupportedLocale = "fr" | "nl" | "en";

type ProductImage = { image_url: string };
type Product = {
  id: string;
  slug: string;
  name_fr: string;
  name_nl: string;
  name_en: string;
  price: number;
  product_images?: ProductImage[];
};
type Subcategory = {
  id: string;
  slug: string;
  name_fr: string;
  name_nl: string;
  name_en: string;
  products: Product[];
};

// ---- Page ----
export default async function SubcategoryPage({
  params,
}: {
  params: Promise<{ locale: string; category: string; subcategory: string }>;
}) {
  // ✅ Attente des params
  const { category, subcategory } = await params;

  // ✅ Récupérer locale via next-intl
  const locale = (await getLocale()) as SupportedLocale;

  // ---- Query Supabase ----
  const { data, error } = await supabase
  .from("subcategories")
  .select<any>(`
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
    )
  `)
  .eq("slug", subcategory)
  .single();


  if (error) {
    console.error("Supabase error:", error);
  }

  const subcat = data as Subcategory | null;
  if (!subcat) return notFound();

  // ---- Helper nom selon locale ----
  const getName = (obj: any) =>
    locale === "fr" ? obj.name_fr : locale === "nl" ? obj.name_nl : obj.name_en;

  // ---- Render ----
  return (
    <>
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-orange-600 mb-6">
          {getName(subcat)}
        </h1>

        <ul className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {subcat.products.map((prod) => (
            <ProductCard
              key={prod.id}
              product={prod}
              locale={locale}
              categorySlug={category}
              subcategorySlug={subcat.slug}
            />
          ))}
        </ul>
      </div>

      <Footer />
    </>
  );
}
