"use client";

import Link from "next/link";
import Image from "next/image";
import { Product } from "@/types/ProductType";
import { useTranslations } from "next-intl";

type Props = {
  product: Product & {
    subsub?: { slug?: string | null } | null;
  };
  locale: "fr" | "nl" | "en";
  categorySlug: string;
  subcategorySlug: string;
  subsubcategorySlug?: string | null;
  isPro: boolean | null;
};

type Translatable = {
  name_fr: string;
  name_en: string;
  name_nl: string;
};

export default function ProductCard({
  product,
  locale,
  categorySlug,
  subcategorySlug,
  subsubcategorySlug,
  isPro
}: Props) {
  const tc = useTranslations("Common");

  const getName = (obj: Translatable) =>
    locale === "fr"
      ? obj.name_fr
      : locale === "nl"
      ? obj.name_nl
      : obj.name_en;

  const imageUrl =
    product.product_images?.[0]?.image_url ?? "/images/placeholder.png";

  // ---------------- PRIX ----------------
  const TVA = 1.21;

  const priceBrutHTVA = Number(product.price) || 0;

  const categoryDiscount = Number(product.subcategory?.category?.discount ?? 0) || 0;

  const showProPrices = isPro === true;

  const discount = showProPrices ? categoryDiscount : 0;

  const priceNetHTVA =
    discount > 0
      ? priceBrutHTVA * (1 - discount / 100)
      : priceBrutHTVA;

  const priceBrutTVAC = priceBrutHTVA * TVA;

  const hasProDiscount = showProPrices && discount > 0;

  const formatPrice = (value: number) =>
    new Intl.NumberFormat("fr-BE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
  }).format(value);

  const subsubSlug = product.subsub?.slug ?? null;

  const productUrl = subsubSlug
    ? `/${locale}/categories/${categorySlug}/${subcategorySlug}/${subsubSlug}/${product.slug}`
    : `/${locale}/categories/${categorySlug}/${subcategorySlug}/default/${product.slug}`;


  return (
    <>
    <li className="rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-lg transition-shadow overflow-hidden group">
      <Link
        href={productUrl}
      >
        <div className="relative w-full h-40 bg-white flex items-center justify-center p-4">
          <Image
            src={imageUrl}
            alt={getName(product)}
            fill
            className="object-contain transition-transform duration-200 group-hover:scale-105"
          />
        </div>

        <div className="p-4 space-y-3">
          <h3 className="text-gray-800 font-medium text-sm leading-snug line-clamp-2 group-hover:text-orange-600 transition">
            {getName(product)}
          </h3>

          <div className="h-px bg-gray-100 w-full"></div>

          {/* -------- PRIX -------- */}
          <div>
            {showProPrices ? (
              hasProDiscount ? (
                <>
                  <div className="text-sm text-gray-400 line-through">
                    {formatPrice(priceBrutHTVA)} € {tc("vatExcluded")}
                  </div>

                  <div className="text-lg font-semibold text-orange-700">
                    {formatPrice(priceNetHTVA)} € {tc("vatExcluded")}
                  </div>

                  <div className="text-xs font-medium text-green-600">
                    {tc("proDiscount", { discount })}
                  </div>
                </>
              ) : (
                <div className="text-lg font-semibold text-orange-700">
                  {formatPrice(priceBrutHTVA)} € {tc("vatExcluded")}
                </div>
              )
            ) : (
              <div className="text-lg font-semibold text-gray-900">
                {formatPrice(priceBrutTVAC)}{" "} €
                <span className="text-xs text-gray-500 pl-1">{tc("vatIncluded")}</span>
              </div>
            )}
          </div>
        </div>
      </Link>
    </li>
    </>
  );
}
