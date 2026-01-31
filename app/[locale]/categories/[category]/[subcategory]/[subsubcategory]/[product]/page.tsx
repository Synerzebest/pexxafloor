import { createSupabaseServerAuthClient } from "@/lib/supabaseServerAuth";
import { notFound } from "next/navigation";
import { Navbar, Footer, ProductGallery, AddToCartButton, ProBadge } from "@/components";
import { Product } from "@/types/ProductType";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

type SupportedLocale = "fr" | "nl" | "en";

type ProductRouteParams = Promise<{
  locale: string;
  category: string;
  subcategory: string;
  subsubcategory: string;
  product: string;
}>;

export default async function ProductPage({
  params,
}: {
  params: ProductRouteParams;
}) {
  const { product, locale, category, subcategory, subsubcategory } =
    await params;
  const supabase = await createSupabaseServerAuthClient();
  const supportedLocale = locale as SupportedLocale;

  const getName = (p: { name_fr: string; name_nl: string; name_en: string }) =>
    supportedLocale === "fr"
      ? p.name_fr
      : supportedLocale === "nl"
      ? p.name_nl
      : p.name_en;

  const getDesc = (p: Product) =>
    supportedLocale === "fr"
      ? p.description_fr
      : supportedLocale === "nl"
      ? p.description_nl
      : p.description_en;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  
  let isPro = false;
  
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_pro")
      .eq("id", user.id)
      .maybeSingle();
  
    isPro = !!profile?.is_pro;
  }

  // PRODUIT
  const { data, error } = await supabase
    .from("products")
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
      reference,

      product_images!fk_product (
        image_url
      ),

      subcategory:subcategories (
        id,
        slug,
        name_fr,
        name_nl,
        name_en,

        category:categories (
          id,
          slug,
          name_fr,
          name_nl,
          name_en,
          discount
        )
      ),

      subsubcategory:subsubcategories!left (
        id,
        slug,
        name_fr,
        name_nl,
        name_en
      )
    `)
    .eq("slug", product)
    .single();

  if (!data || error) return notFound();
  const prod = data as unknown as Product;

  // CATEGORIES
  const categoryData = prod.subcategory.category;
  const subcategoryData = prod.subcategory;
  const subsubData = prod.subsubcategory;

  // IMAGES
  const images =
    prod.product_images?.map((img) => img.image_url) ?? [
      "/images/placeholder.png",
    ];

  // PRIX
  const TVA = 1.21;
  const categoryDiscount =
    prod.subcategory.category.discount ?? 0;

  const priceBrutHTVA = prod.price;
  const discount = isPro ? categoryDiscount : 0;

  const priceNetHTVA =
    discount > 0
      ? priceBrutHTVA * (1 - discount / 100)
      : priceBrutHTVA;

  const priceBrutTVAC = priceBrutHTVA * TVA;
  const showProPrices = isPro; 

  const formatPrice = (value: number) =>
  new Intl.NumberFormat("fr-BE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);


  return (
    <>
      <Navbar />

      <ProBadge />

      <div className="max-w-6xl mx-auto px-4 py-10 relative top-20 sm:top-36 pb-36">

        {/* BREADCRUMB */}
        <nav className="flex items-center gap-2 text-sm text-gray-600 mb-8">
          {/* CATÉGORIE */}
          <Link
            href={`/${locale}/categories/${categoryData.slug}`}
            className="hover:text-orange-600"
          >
            {getName(categoryData)}
          </Link>

          <ChevronRight className="w-4 h-4" />

          {/* SOUS-CATÉGORIE */}
          <Link
            href={`/${locale}/categories/${categoryData.slug}/${subcategoryData.slug}`}
            className="hover:text-orange-600"
          >
            {getName(subcategoryData)}
          </Link>

          {/* SOUS-SOUS-CATÉGORIE (OPTIONNELLE) */}
          {subsubData && (
            <>
              <ChevronRight className="w-4 h-4" />
              <Link
                href={`/${locale}/categories/${categoryData.slug}/${subcategoryData.slug}/${subsubData.slug}`}
                className="hover:text-orange-600"
              >
                {getName(subsubData)}
              </Link>
            </>
          )}

          <ChevronRight className="w-4 h-4" />

          {/* PRODUIT */}
          <span className="text-gray-900 font-medium">
            {getName(prod)}
          </span>
        </nav>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <ProductGallery images={images} alt={getName(prod)} />

          <div>
            <h1 className="text-3xl font-semibold mb-4">
              {getName(prod)}
            </h1>

            <p className="text-gray-600 mb-6">
              {getDesc(prod)}
            </p>

            {/* ---------------- PRIX ---------------- */}
            <div className="mb-6">
            {isPro ? (
              <>
                {discount > 0 && (
                  <p className="text-lg text-gray-400 line-through">
                    {formatPrice(priceBrutHTVA)} € TVA excl.
                  </p>
                )}

                <p className="text-3xl font-bold text-orange-700">
                  {formatPrice(priceNetHTVA)} € TVA excl.
                </p>

                {discount > 0 && (
                  <p className="text-green-600 font-semibold mt-1">
                    Remise PRO −{discount}%
                  </p>
                )}
              </>
            ) : (
              <p className="text-3xl font-bold text-orange-700">
                {formatPrice(priceBrutTVAC)} €{" "}
                <span className="text-base text-gray-500">TVA incl.</span>
              </p>
            )}
            </div>

            <AddToCartButton
              id={prod.id}
              name={getName(prod)}
              unit_price={showProPrices ? priceNetHTVA : priceBrutHTVA}
              image_url={images[0]}
            />
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}
