import { supabase } from "@/lib/supabaseClient";
import { notFound } from "next/navigation";
import { Navbar, Footer, ProductGallery, AddToCartButton } from "@/components";
import { Product } from "@/types/ProductType";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

type SupportedLocale = "fr" | "nl" | "en";

type ProductImage = { image_url: string };

export interface ProductWithImages extends Product {
  product_images?: ProductImage[] | null;
}

// Ajout du paramètre subsubcategory ici
type ProductRouteParams = Promise<{
  locale: string;
  category: string;
  subcategory: string;
  subsubcategory: string;   // ✅ ajouté
  product: string;
}>;

export default async function ProductPage({
  params,
}: {
  params: ProductRouteParams;
}) {
  const { product, locale, category, subcategory, subsubcategory } =
    await params;
  const supportedLocale = locale as SupportedLocale;

  const getName = (p: { name_fr: string; name_nl: string; name_en: string }) =>
    supportedLocale === "fr"
      ? p.name_fr
      : supportedLocale === "nl"
      ? p.name_nl
      : p.name_en;

  const getDesc = (p: ProductWithImages) =>
    supportedLocale === "fr"
      ? p.description_fr
      : supportedLocale === "nl"
      ? p.description_nl
      : p.description_en;

  // -------------------------------------------------------
  // 1) Produit
  // -------------------------------------------------------
  const { data, error } = await supabase
    .from("products_with_discount")
    .select(`
      id,
      slug,
      name_fr,
      name_nl,
      name_en,
      description_fr,
      description_nl,
      description_en,
      price,
      price_after_discount,
      applied_discount,
      product_images!fk_product ( image_url )
    `)
    .eq("slug", product)
    .single();

  if (!data || error) return notFound();
  const prod = data as unknown as ProductWithImages;

  // -------------------------------------------------------
  // 2) Catégorie
  // -------------------------------------------------------
  const { data: categoryData, error: catError } = await supabase
    .from("categories")
    .select("name_fr, name_nl, name_en")
    .eq("slug", category)
    .single();

  if (catError || !categoryData) return notFound();

  // -------------------------------------------------------
  // 3) Sous-catégorie
  // -------------------------------------------------------
  const { data: subcategoryData, error: subcatError } = await supabase
    .from("subcategories")
    .select("name_fr, name_nl, name_en")
    .eq("slug", subcategory)
    .single();

  if (subcatError || !subcategoryData) return notFound();

  // -------------------------------------------------------
  // 4) Sous-sous-catégorie
  // -------------------------------------------------------
  const { data: subsubData, error: subsubError } = await supabase
    .from("subsubcategories")
    .select("name_fr, name_nl, name_en")
    .eq("slug", subsubcategory)
    .single();

  if (subsubError || !subsubData) return notFound();

  // -------------------------------------------------------
  // 5) Images
  // -------------------------------------------------------
  const images =
    prod.product_images?.map((img: ProductImage) => img.image_url) ?? [
      "/images/placeholder.png",
    ];

  // -------------------------------------------------------
  // 6) Prix (HTVA / TVAC / Remise)
  // -------------------------------------------------------
  const discount = prod.applied_discount ?? 0;
  const isDiscounted = discount > 0;

  const priceHTVA = isDiscounted
    ? prod.price_after_discount ?? prod.price ?? 0
    : prod.price ?? 0;

  const priceTVAC = priceHTVA * 1.21;

  // -------------------------------------------------------
  // 7) Rendu
  // -------------------------------------------------------
  return (
    <>
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-10 relative top-20 sm:top-36 pb-36">

        {/* ------------------ BREADCRUMB ------------------ */}
        <nav className="flex items-center gap-2 text-xs sm:text-sm font-medium text-gray-600 mb-8 overflow-x-auto no-scrollbar">

        {/* Catégorie */}
        <Link
          href={`/${locale}/categories/${category}`}
          className="hover:text-orange-600 transition whitespace-nowrap max-w-[90px] sm:max-w-[140px] truncate"
        >
          {getName(categoryData)}
        </Link>

        <ChevronRight className="w-4 h-4 flex-shrink-0 text-gray-400" />

        {/* Sous-catégorie */}
        <Link
          href={`/${locale}/categories/${category}/${subcategory}`}
          className="hover:text-orange-600 transition whitespace-nowrap max-w-[90px] sm:max-w-[140px] truncate"
        >
          {getName(subcategoryData)}
        </Link>

        <ChevronRight className="w-4 h-4 flex-shrink-0 text-gray-400" />

        {/* Sous-sous-catégorie */}
        <Link
          href={`/${locale}/categories/${category}/${subcategory}/${subsubcategory}`}
          className="hover:text-orange-600 transition whitespace-nowrap max-w-[90px] sm:max-w-[140px] truncate"
        >
          {getName(subsubData)}
        </Link>

        <ChevronRight className="w-4 h-4 flex-shrink-0 text-gray-400" />

        {/* Produit */}
        <span className="text-gray-900 whitespace-nowrap max-w-[110px] sm:max-w-[200px] truncate">
          {getName(prod)}
        </span>
      </nav>

        {/* ------------------ CONTENU PRODUIT ------------------ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <ProductGallery images={images} alt={getName(prod)} />

          <div>
            <h1 className="text-3xl font-semibold text-gray-900 mb-4">
              {getName(prod)}
            </h1>

            <p className="text-gray-600 mb-6 leading-relaxed">
              {getDesc(prod)}
            </p>

            <div className="mb-6">
              {isDiscounted ? (
                <>
                  <p className="text-3xl font-bold text-orange-700">
                    {priceTVAC.toFixed(2)} €{" "}
                    <span className="text-base font-medium text-gray-500">
                      TVAC
                    </span>
                  </p>

                  <p className="text-lg line-through text-gray-400 mt-1">
                    {(prod.price * 1.21).toFixed(2)} € TVAC
                  </p>

                  <p className="mt-1 text-green-600 font-semibold">
                    -{discount}% de remise PRO
                  </p>

                  <p className="text-sm text-gray-500 mt-1">
                    {priceHTVA.toFixed(2)} € HTVA (après remise PRO)
                  </p>
                </>
              ) : (
                <>
                  <p className="text-3xl font-bold text-orange-700">
                    {priceTVAC.toFixed(2)} €{" "}
                    <span className="text-base font-medium text-gray-500">
                      TVAC
                    </span>
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {prod.price.toFixed(2)} € HTVA
                  </p>
                </>
              )}
            </div>

            <AddToCartButton
              id={prod.id}
              name={getName(prod)}
              unit_price={priceHTVA}
              image_url={images[0]}
            />
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}
