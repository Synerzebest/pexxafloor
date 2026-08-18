"use client";

import { useCart } from "@/context/CartContext";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { CheckCircle2, ShoppingCart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { AddableProduct } from "@/types/AddableProductType";

export default function AddToCartButton(product: AddableProduct) {
  const { items, addToCart } = useCart();
  const t = useTranslations("AddToBasketButton");
  const [added, setAdded] = useState(false);
  const quantityInCart = items.reduce(
    (total, item) =>
      item.type === "product" && item.product_id === product.id
        ? total + item.quantity
        : total,
    0
  );

  const handleAdd = () => {
    addToCart({
      type: "product",
      product_id: product.id,
      quantity: 1,
      product: {
        name: product.name,
        price: product.unit_price,
        image: product.image_url,
        reference: product.reference,
      },
    });

    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="inline-flex flex-col items-center gap-2">
      <button
        onClick={handleAdd}
        disabled={added}
        className={`relative overflow-hidden px-6 py-3 rounded-lg shadow text-white font-medium flex items-center justify-center gap-2 transition-colors bg-orange-600 hover:bg-orange-700
          ${added ? "cursor-not-allowed" : "cursor-pointer"}`}
      >
        <AnimatePresence mode="wait" initial={false}>
          {added ? (
            <motion.div
              key="added"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="flex items-center gap-2"
            >
              <CheckCircle2 className="w-5 h-5" />
              {t("addedToBasket")}
            </motion.div>
          ) : (
            <motion.div
              key="add"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              {t("addToBasket")}
            </motion.div>
          )}
        </AnimatePresence>
      </button>

      <AnimatePresence mode="wait">
        {quantityInCart > 0 && (
          <motion.div
            key={quantityInCart}
            initial={{ opacity: 0, y: -4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            className="inline-flex items-center gap-1.5 rounded-full border border-orange-100 bg-orange-50 px-3 py-1 text-xs font-medium text-orange-700"
          >
            <ShoppingCart className="h-3.5 w-3.5" aria-hidden="true" />
            {t("inCart", { count: quantityInCart })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
