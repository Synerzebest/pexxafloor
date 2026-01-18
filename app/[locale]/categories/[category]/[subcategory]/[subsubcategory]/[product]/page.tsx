import { createSupabaseServerAuthClient } from "@/lib/supabaseServerAuth";
import { notFound } from "next/navigation";
import { Navbar, Footer, ProductGallery, AddToCartButton, ProBadge } from "@/components";
import { Product } from "@/types/ProductType";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

type SupportedLocale = "fr" | "nl" | "en";

type ProductImage = { image_url: string };

export interface ProductWithImages extends Product {
  product_images?: ProductImage[] | null;
}

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

  const getDesc = (p: ProductWithImages) =>
    supportedLocale === "fr"
      ? p.description_fr
      : supportedLocale === "nl"
      ? p.description_nl
      : p.description_en;

  // -------------------------------------------------------
  // 1) USER + IS_PRO
  // -------------------------------------------------------
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isPro = false;

  console.log(user)
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_pro")
      .eq("id", user.id)
      .single();

    isPro = !!profile?.is_pro;
    console.log("user data:", profile);
  }

  // -------------------------------------------------------
  // 2) PRODUIT
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
  // 3) CATEGORIES
  // -------------------------------------------------------
  const { data: categoryData } = await supabase
    .from("categories")
    .select("name_fr, name_nl, name_en")
    .eq("slug", category)
    .single();

  const { data: subcategoryData } = await supabase
    .from("subcategories")
    .select("name_fr, name_nl, name_en")
    .eq("slug", subcategory)
    .single();

  const { data: subsubData } = await supabase
    .from("subsubcategories")
    .select("name_fr, name_nl, name_en")
    .eq("slug", subsubcategory)
    .single();

  if (!categoryData || !subcategoryData || !subsubData) return notFound();

  // -------------------------------------------------------
  // 4) IMAGES
  // -------------------------------------------------------
  const images =
    prod.product_images?.map((img) => img.image_url) ?? [
      "/images/placeholder.png",
    ];

  // -------------------------------------------------------
  // 5) PRIX – LOGIQUE OFFICIELLE
  // -------------------------------------------------------
  const TVA = 1.21;
  const priceBrutHTVA = prod.price ?? 0;
  const discount = prod.applied_discount ?? 0;
  const priceNetHTVA =
    prod.price_after_discount ?? priceBrutHTVA;

  const priceBrutTVAC = priceBrutHTVA * TVA;

  const showProPrices = isPro && user; 

  const formatPrice = (value: number) =>
  new Intl.NumberFormat("fr-BE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);


  // -------------------------------------------------------
  // 6) RENDU
  // -------------------------------------------------------
  return (
    <>
      <Navbar />

      <ProBadge />

      <div className="max-w-6xl mx-auto px-4 py-10 relative top-20 sm:top-36 pb-36">

        {/* BREADCRUMB */}
        <nav className="flex items-center gap-2 text-sm text-gray-600 mb-8">
          <Link href={`/${locale}/categories/${category}`}>
            {getName(categoryData)}
          </Link>
          <ChevronRight className="w-4 h-4" />
          <Link href={`/${locale}/categories/${category}/${subcategory}`}>
            {getName(subcategoryData)}
          </Link>
          <ChevronRight className="w-4 h-4" />
          <Link
            href={`/${locale}/categories/${category}/${subcategory}/${subsubcategory}`}
          >
            {getName(subsubData)}
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900">{getName(prod)}</span>
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
              {showProPrices ? (
                <>
                  <p className="text-lg text-gray-400 line-through">
                    {formatPrice(priceBrutHTVA)} € TVA excl.
                  </p>

                  <p className="text-3xl font-bold text-orange-700">
                    {formatPrice(priceNetHTVA)} € TVA excl.
                  </p>

                  <p className="text-green-600 font-semibold mt-1">
                    Remise PRO −{discount}%
                  </p>
                </>
              ) : (
                <>
                  <p className="text-3xl font-bold text-orange-700">
                    {formatPrice(priceBrutTVAC)} €{" "}
                    <span className="text-base text-gray-500">TVA incl.</span>
                  </p>
                </>
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
