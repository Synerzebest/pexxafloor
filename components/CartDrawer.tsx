"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Minus, Trash2 } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import Image from "next/image";
import AnimatedDropdown from "./ui/AnimatedDropdown";

export default function CartDrawer() {
  const { items, isOpen, closeCart, updateQuantity, removeFromCart } = useCart();
  const locale = useLocale();
  const t = useTranslations("CartDrawer");

  const TVA_RATE = 0.21; // 21%

  const totalHTVA = items.reduce((acc, i) => {
    if (i.type === "product") return acc + (i.product?.price ?? 0) * i.quantity;
    if (i.type === "pack") return acc + i.total * i.quantity;
    return acc;
  }, 0);

  const totalTVAC = totalHTVA * (1 + TVA_RATE);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            className="fixed inset-0 bg-black/30 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
          />

          {/* Drawer */}
          <motion.aside
            className="fixed right-0 top-0 z-50 h-full w-96 max-w-[90%] bg-white shadow-xl p-4 flex flex-col"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 260, damping: 28 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">{t("myCart")}</h2>
              <button
                className="p-2 hover:bg-gray-100 rounded"
                onClick={closeCart}
              >
                <X />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto">
              {items.length === 0 ? (
                <p className="text-gray-500">{t("emptyCart")}</p>
              ) : (
                <ul className="space-y-4">
                  {items.map((item, idx) => {
                    // === PRODUIT ===
                    if (item.type === "product") {
                      const priceHTVA = item.product?.price ?? 0;
                      const priceTVAC = priceHTVA * (1 + TVA_RATE);

                      return (
                        <li
                          key={`product-${item.product_id}-${idx}`}
                          className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex flex-col gap-2"
                        >
                          {/* Image + Nom */}
                          <div className="flex items-center gap-3">
                            <Image
                              src={item.product?.image || "/images/box.png"}
                              alt={item.product?.name || "Produit"}
                              width={60}
                              height={60}
                              className="rounded-md"
                            />
                            <p className="font-medium text-gray-800 leading-tight">
                              {item.product?.name ?? "Produit"}
                            </p>
                          </div>

                          {/* Prix */}
                          <div className="flex items-center justify-between">
                            <p className="text-orange-600 font-semibold text-lg">
                              {priceTVAC.toFixed(2)} € TVAC
                            </p>
                            <p className="text-sm text-gray-500">
                              {priceHTVA.toFixed(2)} € HTVA
                            </p>
                          </div>

                          {/* Contrôles quantité + supprimer */}
                          <div className="flex items-center justify-start">
                            <button
                              onClick={() =>
                                updateQuantity(
                                  item.product_id,
                                  Math.max(1, item.quantity - 1)
                                )
                              }
                              className="p-1 bg-gray-200 rounded hover:bg-gray-300"
                            >
                              <Minus size={16} />
                            </button>
                            <span className="w-6 text-center font-medium">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() =>
                                updateQuantity(item.product_id, item.quantity + 1)
                              }
                              className="p-1 bg-gray-200 rounded hover:bg-gray-300"
                            >
                              <Plus size={16} />
                            </button>

                            <button
                              onClick={() => removeFromCart(item.product_id)}
                              className="ml-auto p-1.5 bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
                              title="Supprimer"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </li>
                      );
                    }

                    // === PACK ===
                    if (item.type === "pack") {
                      const packHTVA = item.total * item.quantity;
                      const packTVAC = packHTVA * (1 + TVA_RATE);

                      return (
                        <li
                          key={`pack-${item.id}-${idx}`}
                          className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex flex-col gap-2"
                        >
                          <div className="flex justify-between">
                            <p className="font-medium">
                              Pack {item.slug} · {item.surface} m² · {item.tuyauType}
                            </p>
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="p-1.5 bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
                              title="Supprimer"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>

                          <div>
                            <p className="text-orange-600 font-semibold text-lg">
                              {packTVAC.toFixed(2)} € TVAC
                            </p>
                            <p className="text-sm text-gray-500">
                              {packHTVA.toFixed(2)} € HTVA
                            </p>
                          </div>

                          <AnimatedDropdown
                            title={`${item.products.length} produits inclus`}
                            defaultOpen={false}
                          >
                            <ul className="ml-2 mt-2 space-y-1 list-disc">
                              {item.products.map((p) => (
                                <li key={p.id}>
                                  {p.description} — {p.unit_price.toFixed(2)} €
                                </li>
                              ))}
                            </ul>
                            <Link
                              href={`/packs/${item.slug}?packId=${item.id}`}
                              className="inline-block mt-2 text-blue-600 hover:underline"
                            >
                              Modifier ce pack
                            </Link>
                          </AnimatedDropdown>

                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() =>
                                  updateQuantity(
                                    item.id,
                                    Math.max(1, item.quantity - 1)
                                  )
                                }
                                className="p-1 bg-gray-200 rounded hover:bg-gray-300"
                              >
                                <Minus size={16} />
                              </button>
                              <span className="w-6 text-center font-medium">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() =>
                                  updateQuantity(item.id, item.quantity + 1)
                                }
                                className="p-1 bg-gray-200 rounded hover:bg-gray-300"
                              >
                                <Plus size={16} />
                              </button>
                            </div>
                            <Link
                              href={`/packs/${item.slug}?packId=${item.id}`}
                              className="text-blue-600 text-sm hover:underline"
                            >
                              Modifier
                            </Link>
                          </div>
                        </li>
                      );
                    }

                    return null;
                  })}
                </ul>
              )}
            </div>

            {/* Footer */}
            <div className="mt-4 border-t pt-3 space-y-1">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Total HTVA</span>
                <span>{totalHTVA.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between text-lg font-semibold text-orange-600">
                <span>Total TVAC</span>
                <span>{totalTVAC.toFixed(2)} €</span>
              </div>

              <div className="mt-4 flex gap-2">
                <Link
                  href={`/${locale}/cart`}
                  className="flex-1 rounded-lg bg-gray-200 py-2 text-sm font-medium hover:bg-gray-300 text-center duration-300"
                >
                  {t("checkCart")}
                </Link>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
