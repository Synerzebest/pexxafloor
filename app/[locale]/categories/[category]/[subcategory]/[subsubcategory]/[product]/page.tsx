import { supabase } from "@/lib/supabaseClient";
import { notFound } from "next/navigation";
import { Navbar, Footer, ProductGallery, AddToCartButton } from "@/components";
import { Product } from "@/types/ProductType";
import type { PageProps } from "next";

type SupportedLocale = "fr" | "nl" | "en";

type ProductImage = { image_url: string };

export interface ProductWithImages extends Product {
  product_images?: ProductImage[] | null;
}

export default async function ProductPage({
  params,
}: PageProps<{
  locale: string;
  category: string;
  subcategory: string;
  product: string;
}>) {

  const { product, locale } = params;

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

  const prod = data as ProductWithImages;

  const supportedLocale = locale as SupportedLocale;

  const getName = (p: ProductWithImages): string =>
    supportedLocale === "fr"
      ? p.name_fr
      : supportedLocale === "nl"
      ? p.name_nl
      : p.name_en;

  const getDesc = (p: ProductWithImages): string =>
    supportedLocale === "fr"
      ? p.description_fr
      : supportedLocale === "nl"
      ? p.description_nl
      : p.description_en;

  const images: string[] =
    prod.product_images?.map((img: ProductImage) => img.image_url) ?? [
      "/images/placeholder.png",
    ];

  const discount = prod.applied_discount ?? 0;
  const isDiscounted = discount > 0;

  const priceHTVA: number = isDiscounted
    ? prod.price_after_discount ?? prod.price ?? 0
    : prod.price ?? 0;

  const priceTVAC = priceHTVA * 1.21;

  return (
    <>
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <ProductGallery images={images} alt={getName(prod)} />

          <div>
            <h1 className="text-3xl font-semibold text-gray-900 mb-4">
              {getName(prod)}
            </h1>

            <p className="text-gray-600 mb-6 leading-relaxed">
              {getDesc(prod)}
            </p>

            {/* Prix */}
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
