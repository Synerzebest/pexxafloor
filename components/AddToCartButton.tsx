"use client";

import { useCart } from "@/context/CartContext";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { CheckCircle2, Minus, Plus, ShoppingCart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { AddableProduct } from "@/types/AddableProductType";

const MAX_QUANTITY = 999;

export default function AddToCartButton(product: AddableProduct) {
  const { items, addToCart } = useCart();
  const t = useTranslations("AddToBasketButton");
  const [added, setAdded] = useState(false);
  const [quantity, setQuantity] = useState(1);
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
      quantity,
      product: {
        name: product.name,
        price: product.unit_price,
        image: product.image_url,
        reference: product.reference,
      },
    });

    setAdded(true);
    setQuantity(1);
    setTimeout(() => setAdded(false), 1500);
  };

  const clampQuantity = (value: number) =>
    Math.min(MAX_QUANTITY, Math.max(1, Number.isFinite(value) ? Math.floor(value) : 1));

  return (
    <div className="inline-flex flex-col items-center gap-2">
      <div className="flex items-stretch gap-2">
      {/* Quantity to add, 1 by default */}
      <div className="flex items-center rounded-lg border border-gray-300 bg-white shadow-sm">
        <button
          type="button"
          onClick={() => setQuantity((current) => clampQuantity(current - 1))}
          disabled={quantity <= 1}
          aria-label={t("decrease")}
          className="grid h-full w-10 place-items-center rounded-l-lg text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Minus className="h-4 w-4" />
        </button>
        <input
          type="number"
          inputMode="numeric"
          min={1}
          max={MAX_QUANTITY}
          value={quantity}
          aria-label={t("quantity")}
          onChange={(e) => setQuantity(clampQuantity(Number(e.target.value)))}
          onFocus={(e) => e.target.select()}
          className="h-full w-12 border-x border-gray-200 bg-transparent text-center font-semibold text-gray-900 outline-none tabular-nums [appearance:textfield] focus:bg-orange-50 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <button
          type="button"
          onClick={() => setQuantity((current) => clampQuantity(current + 1))}
          disabled={quantity >= MAX_QUANTITY}
          aria-label={t("increase")}
          className="grid h-full w-10 place-items-center rounded-r-lg text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

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
      </div>

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
