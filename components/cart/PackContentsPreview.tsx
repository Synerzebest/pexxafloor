"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import type { PackItem } from "@/context/CartContext";

const MAX_THUMBNAILS = 4;

export function PackContentsPreview({ pack }: { pack: PackItem }) {
  const t = useTranslations("CartDrawer");
  const [open, setOpen] = useState(false);

  const rows = pack.products.map((product) => {
    const quantity = pack.quantities?.[product.id] ?? 1;
    const lineTotal = product.total_price ?? product.unit_price * quantity;
    return { ...product, quantity, lineTotal };
  });
  const thumbnails = rows.filter((row) => row.image).slice(0, MAX_THUMBNAILS);
  const hiddenCount = rows.length - thumbnails.length;

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-3 py-2.5 text-left"
      >
        {/* Stacked thumbnails give a glance at the pack before expanding */}
        <div className="flex shrink-0 -space-x-2">
          {thumbnails.map((row) => (
            <div
              key={row.id}
              className="relative h-8 w-8 overflow-hidden rounded-full border-2 border-white bg-gray-50 ring-1 ring-gray-200"
            >
              <Image src={row.image!} alt="" fill sizes="32px" className="object-contain p-0.5" />
            </div>
          ))}
          {hiddenCount > 0 && (
            <div className="grid h-8 w-8 place-items-center rounded-full border-2 border-white bg-gray-100 text-[11px] font-semibold text-gray-600 ring-1 ring-gray-200">
              +{hiddenCount}
            </div>
          )}
        </div>

        <span className="flex-1 text-sm font-medium text-gray-700">
          {t("includedCount", { count: rows.length })}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.ul
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="divide-y divide-gray-100 overflow-hidden border-t border-gray-100"
          >
            {rows.map((row) => (
              <li key={row.id} className="flex items-center gap-3 px-3 py-2">
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md border border-gray-100 bg-gray-50">
                  <Image
                    src={row.image || "/images/box.png"}
                    alt=""
                    fill
                    sizes="40px"
                    className="object-contain p-1"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-xs font-medium leading-snug text-gray-800">
                    {row.description}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500 tabular-nums">× {row.quantity}</p>
                </div>
                {row.lineTotal > 0 ? (
                  <span className="shrink-0 text-xs font-semibold text-gray-700 tabular-nums">
                    {row.lineTotal.toFixed(2)} €
                  </span>
                ) : (
                  <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                    {t("free")}
                  </span>
                )}
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
