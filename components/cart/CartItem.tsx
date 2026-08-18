"use client";

import Image from "next/image";
import { Button, InputNumber } from "antd";
import { motion } from "framer-motion";
import AnimatedDropdown from "@/components/ui/AnimatedDropdown";
import { getPackImage } from "@/utils/getPackImage";
import Link from "next/link";
import { Edit3, Trash2 } from "lucide-react";
import { useLocale } from "next-intl";

export default function CartItem({
  item,
  updateQuantity,
  removeFromCart,
  t,
}: any) {
  const locale = useLocale();
  const isProduct = item.type === "product";

  const unitPrice = isProduct
    ? (item.unit_price ?? item.product?.price ?? 0)
    : item.total;
  
  const basePrice = isProduct
    ? (item.base_price ?? item.product?.price ?? 0)
    : item.total;
  
  const hasDiscount = isProduct && basePrice > unitPrice;
  const lineTotalHTVA = unitPrice * item.quantity;
  const lineTotalTVAC = lineTotalHTVA * 1.21;
  
  const key = isProduct ? item.product_id : item.id;
  const packProducts = !isProduct && Array.isArray(item.products) ? item.products : [];

  return (
    <motion.li
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white shadow-sm rounded-xl p-4 sm:p-5 border border-gray-100 hover:border-orange-100 transition-colors"
    >
      {/* ---- CONTAINER ---- */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

        {/* ---- LEFT SIDE (IMAGE + TEXT) ---- */}
        <div className="flex gap-4">
          <Image
            src={
              isProduct
                ? item.product?.image || "/images/box.png"
                : getPackImage(item.slug)
            }
            alt="item"
            width={80}
            height={80}
            className="rounded-lg object-cover w-20 h-20 sm:w-[90px] sm:h-[90px]"
          />

          <div className="flex flex-col justify-center">
            <p className="font-semibold text-base sm:text-lg leading-tight">
              {isProduct ? item.product?.name : `Pack ${item.slug}`}
            </p>

            {!isProduct && (
              <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-600">
                <span className="rounded-md bg-orange-50 px-2 py-1 text-orange-700">
                  {item.surface} m²
                </span>
                <span className="rounded-md bg-gray-50 px-2 py-1">
                  Pas {item.pasDePose} cm
                </span>
                <span className="rounded-md bg-gray-50 px-2 py-1">
                  {item.tuyauType}
                </span>
                {item.calepinage && (
                  <span className="rounded-md bg-gray-50 px-2 py-1">
                    Calepinage
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ---- RIGHT SIDE (CONTROLS) ---- */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">

          {/* Quantity + price */}
          <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
            <InputNumber
              min={1}
              size="middle"
              value={item.quantity}
              onChange={(val) =>
                updateQuantity(key, val ? Number(val) : 1)
              }
            />
            <div className="min-w-[125px] text-right">
              {/* Prix final */}
              <div className="font-semibold text-lg text-orange-600">
                {lineTotalTVAC.toFixed(2)} €
              </div>
              <div className="text-xs font-medium text-gray-500">
                {t("vatIncluded")}
              </div>
              <div className="mt-1 text-xs text-gray-600">
                {lineTotalHTVA.toFixed(2)} € {t("vatExcluded")}
              </div>

              {/* Prix de base barré */}
              {hasDiscount && (
                <div className="text-xs text-gray-400 line-through">
                  {(basePrice * item.quantity).toFixed(2)} € {t("vatExcluded")}
                </div>
              )}
            </div>
          </div>

          {/* Remove */}
          <Button
            danger
            size="small"
            icon={<Trash2 className="h-4 w-4" />}
            className="self-start sm:self-auto"
            onClick={() => removeFromCart(key)}
          >
            {t("remove")}
          </Button>
        </div>
      </div>

      {/* ---- PACK DETAILS ---- */}
      {!isProduct && packProducts.length > 0 && (
        <div className="mt-4 rounded-lg border border-gray-100 bg-gray-50/60 px-4 py-3">
          <AnimatedDropdown
            title={`${packProducts.length} ${t("included")}`}
          >
            <div className="mt-3 space-y-2">
              {packProducts.map((p: any) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 bg-white p-2"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <img
                      src={p.image || "/images/box.png"}
                      alt={p.description}
                      className="h-12 w-12 rounded-md border border-gray-200 bg-white object-cover"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-800">
                        {p.description}
                      </p>
                      <p className="text-xs text-gray-500">
                        {p.reference || "Sans référence"}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 text-right text-xs text-gray-600">
                    <div>
                      x{item.quantities?.[p.id] ?? 1} · {Number(p.unit_price || 0).toFixed(2)} € {t("vatExcluded")}
                    </div>
                    <div className="font-semibold text-gray-900">
                      {(Number(p.total_price || 0) * 1.21).toFixed(2)} € {t("vatIncluded")}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Link
              href={`/${locale}/packs/${item.slug}?packId=${item.id}`}
              className="mt-3 inline-flex items-center gap-2 rounded-lg border border-orange-200 bg-white px-3 py-2 text-sm font-medium text-orange-700 transition hover:border-orange-300 hover:bg-orange-50"
            >
              <Edit3 className="h-4 w-4" />
              {t("editPack")}
            </Link>
          </AnimatedDropdown>
        </div>
      )}
    </motion.li>
  );
}
