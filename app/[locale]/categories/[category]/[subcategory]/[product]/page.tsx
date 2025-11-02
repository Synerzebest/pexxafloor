import { supabase } from "@/lib/supabaseClient";
import { notFound } from "next/navigation";
import { Navbar, Footer, ProductGallery, AddToCartButton } from "@/components";
import { Product } from "@/types/ProductType"

type SupportedLocale = "fr" | "nl" | "en";

interface ProductPageProps {
  params: {
    locale: string;
    category: string;
    subcategory: string;
    product: string;
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { product, locale } = params;

  const { data: prod, error } = await supabase
    .from("products")
    .select(
      `
      id,
      slug,
      name_fr,
      name_nl,
      name_en,
      description_fr,
      description_nl,
      description_en,
      price,
      product_images!fk_product ( image_url )
    `
    )
    .eq("slug", product)
    .single<Product>();

  if (!prod || error) return notFound();

  const supportedLocale = locale as SupportedLocale;

  const getName = (obj: any) =>
    supportedLocale === "fr"
      ? obj.name_fr
      : supportedLocale === "nl"
      ? obj.name_nl
      : obj.name_en;

  const getDesc = (obj: any) =>
    supportedLocale === "fr"
      ? obj.description_fr
      : supportedLocale === "nl"
      ? obj.description_nl
      : obj.description_en;

  const images =
    prod.product_images?.map((img: any) => img.image_url) || [
      "/images/placeholder.png",
    ];

  return (
    <>
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Galerie interactive (Client Component) */}
          <ProductGallery images={images} alt={getName(prod)} />

          {/* Infos produit */}
          <div>
            <h1 className="text-3xl font-semibold text-gray-900 mb-4">
              {getName(prod)}
            </h1>
            <p className="text-gray-600 mb-6 leading-relaxed">
              {getDesc(prod)}
            </p>
            <p className="text-2xl font-bold text-orange-700 mb-6">
              {prod.price} €
            </p>
            
            <AddToCartButton
              product={{
                id: prod.id,
                name: getName(prod), 
                unit_price: prod.price,
                image_url: images[0],
              }}
            />

          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
