"use client";

import { useCart } from "@/context/CartContext";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { AddableProduct } from "@/types/AddableProductType";

export default function AddToCartButton(product: AddableProduct) {
  const { addToCart } = useCart();
  const t = useTranslations("AddToBasketButton");
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    addToCart({
      type: "product",
      product_id: product.id,
      quantity: 1,
      product: {
        name: product.name,
        price: product.unit_price,
        image: product.image_url,
      },
    });

    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <button
      onClick={handleAdd}
      disabled={added}
      className={`relative overflow-hidden px-6 py-3 rounded-lg shadow text-white font-medium flex items-center justify-center gap-2 transition-colors bg-orange-600 hover:bg-orange-700
        ${
          added
            ? "cursor-not-allowed"
            : "cursor-pointer"
        }`}
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
            {t("addedToBasket") || "Ajouté au panier"}
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
  );
}
