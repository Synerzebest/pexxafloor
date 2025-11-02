"use client";

import Link from "next/link";
import Image from "next/image";

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

type Props = {
  product: Product;
  locale: "fr" | "nl" | "en";
  categorySlug: string;
  subcategorySlug: string;
};

export default function ProductCard({ product, locale, categorySlug, subcategorySlug }: Props) {
  const getName = (obj: any) =>
    locale === "fr" ? obj.name_fr : locale === "nl" ? obj.name_nl : obj.name_en;

  const imageUrl = product.product_images?.[0]?.image_url ?? "/images/placeholder.png";

  return (
    <li className="border border-gray-100 rounded-lg shadow border  hover:shadow-md transition overflow-hidden">
      <Link
        href={`/${locale}/categories/${categorySlug}/${subcategorySlug}/${product.slug}`}
        className="block"
      >
        {/* Image produit */}
        <div className="w-full aspect-square relative">
          <Image
            src={imageUrl}
            alt={getName(product)}
            fill
            className="object-cover"
          />
        </div>

        {/* Texte */}
        <div className="p-4">
          <h3 className="text-orange-600 hover:text-orange-700 font-medium line-clamp-1">
            {getName(product)}
          </h3>
          <p className="text-gray-600">{product.price} €</p>
        </div>
      </Link>
    </li>
  );
}
