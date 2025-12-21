"use client";

import Link from "next/link";
import Image from "next/image";
import { Product } from "@/types/ProductType";

type Props = {
  product: Product;
  locale: "fr" | "nl" | "en";
  categorySlug: string;
  subcategorySlug: string;
  subsubcategorySlug: string;
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
}: Props) {
  const getName = (obj: Translatable) =>
    locale === "fr"
      ? obj.name_fr
      : locale === "nl"
      ? obj.name_nl
      : obj.name_en;

  const imageUrl =
    product.product_images?.[0]?.image_url ?? "/images/placeholder.png";

  const formatPrice = (price: number) =>
    price.toFixed(2).replace(".", ",");

  return (
    <li className="rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-lg transition-shadow overflow-hidden group">
      <Link
        href={`/${locale}/categories/${categorySlug}/${subcategorySlug}/${subsubcategorySlug}/${product.slug}`}
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

          <div>
            <span className="text-gray-900 font-semibold text-lg">
              € {formatPrice(product.price)}
            </span>
            <span className="text-xs text-gray-500 ml-1">HTVA</span>
          </div>
        </div>
      </Link>
    </li>
  );
}
