"use client";

import { useCart } from "@/context/CartContext";
import { useTranslations } from "next-intl";

export default function AddToCartButton({ product }: { product: any }) {
  const { addToCart } = useCart();
  const t = useTranslations('AddToBasketButton');

  return (
    <button
      onClick={() =>
        addToCart({
          type: "product",
          product_id: product.id,
          quantity: 1,
          product: {
            name: product.name,
            price: product.unit_price,
            image: product.image_url,
          },
        })
      }
      className="px-6 py-3 bg-orange-600 text-white rounded-lg shadow hover:bg-orange-700 transition"
    >
      {t('addToBasket')}
    </button>
  );
}
