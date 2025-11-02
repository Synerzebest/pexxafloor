"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import Image from "next/image";
import AnimatedDropdown from "./ui/AnimatedDropdown";

export default function CartDrawer() {
  const { items, isOpen, closeCart } = useCart();
  const locale = useLocale();
  const t = useTranslations("CartDrawer");

  // Total global
  const total = items.reduce((acc, i) => {
    if (i.type === "product") return acc + (i.product?.price ?? 0) * i.quantity;
    if (i.type === "pack") return acc + i.total * i.quantity;
    return acc;
  }, 0);

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
                <ul className="space-y-3">
                  {items.map((item, idx) => {
                    // --- PRODUIT ---
                    if (item.type === "product") {
                      return (
                        <li
                          key={`product-${item.product_id}-${idx}`}
                          className="flex items-center justify-between bg-gray-100 rounded-lg p-2"
                        >
                          <div className="flex items-center gap-3">
                            <Image
                              src={item.product?.image || "/images/box.png"}
                              alt={item.product?.name || "Produit"}
                              width={50}
                              height={50}
                              className="rounded"
                            />
                            <div>
                              <p className="font-medium">
                                {item.product?.name ?? "Produit"}
                              </p>
                              <p className="text-sm text-gray-500">
                                {item.quantity} ×{" "}
                                {(item.product?.price ?? 0).toFixed(2)} €
                              </p>
                            </div>
                          </div>
                          <span className="font-semibold">
                            {(
                              (item.product?.price ?? 0) * item.quantity
                            ).toFixed(2)}{" "}
                            €
                          </span>
                        </li>
                      );
                    }

                    // --- PACK ---
                    if (item.type === "pack") {
                      return (
                        <li
                          key={`pack-${item.id}-${idx}`}
                          className="flex flex-col bg-gray-100 rounded-lg p-3"
                        >
                          <div className="flex justify-between">
                            <span className="font-medium">
                              Pack {item.slug} · {item.surface} m² ·{" "}
                              {item.tuyauType}
                            </span>
                            <span className="font-semibold">
                              {(item.total * item.quantity).toFixed(2)} €
                            </span>
                          </div>

                          <p className="text-sm text-gray-500">
                            Pas de pose : {item.pasDePose} cm
                          </p>

                          <AnimatedDropdown title={`${item.products.length} produits inclus`} defaultOpen={false}>
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

                          <div className="mt-2 flex justify-between items-center text-sm text-gray-500">
                            <span>Qté : {item.quantity}</span>
                            <Link
                              href={`/packs/${item.slug}?packId=${item.id}`}
                              className="text-blue-600 hover:underline"
                            >
                              {t("edit")}
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
            <div className="mt-4 border-t pt-3">
              <div className="flex justify-between font-semibold text-gray-800">
                <span>Total</span>
                <span>{total.toFixed(2)} €</span>
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
