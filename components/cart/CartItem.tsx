"use client";

import Image from "next/image";
import { Button, InputNumber } from "antd";
import { motion } from "framer-motion";
import AnimatedDropdown from "@/components/ui/AnimatedDropdown";
import { getPackImage } from "@/utils/getPackImage";
import Link from "next/link";

export default function CartItem({
  item,
  updateQuantity,
  removeFromCart,
  t,
}: any) {
  const isProduct = item.type === "product";

  const price = isProduct
    ? (item.product?.price ?? 0)
    : item.total;

  const key = isProduct ? item.product_id : item.id;

  return (
    <motion.li
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white shadow-md rounded-xl p-4 sm:p-5 border border-gray-100"
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
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                {item.surface} m² · {item.tuyauType}
              </p>
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

            <span className="font-semibold text-right min-w-[80px]">
              {(price * item.quantity).toFixed(2)} €
            </span>
          </div>

          {/* Remove */}
          <Button
            type="link"
            danger
            size="small"
            className="self-start sm:self-auto px-0"
            onClick={() => removeFromCart(key)}
          >
            {t("remove")}
          </Button>
        </div>
      </div>

      {/* ---- PACK DETAILS ---- */}
      {!isProduct && item.products && (
        <div className="mt-4">
          <AnimatedDropdown
            title={`${item.products.length} ${t("included")}`}
          >
            <ul className="mt-2 space-y-1 list-disc ml-4 text-sm">
              {item.products.map((p: any) => (
                <li key={p.id}>
                  {p.description} — {p.unit_price.toFixed(2)} €
                </li>
              ))}
            </ul>

            <Link
              href={`/packs/${item.slug}?packId=${item.id}`}
              className="text-blue-600 hover:underline text-sm mt-2 inline-block"
            >
              {t("editPack")}
            </Link>
          </AnimatedDropdown>
        </div>
      )}
    </motion.li>
  );
}
