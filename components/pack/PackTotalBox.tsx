"use client";

import { Price } from "@/components/ui/Price";
import { useState } from "react";
import { CheckCircle2, Save, Share2, ShieldCheck, ShoppingCart, Truck, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";

type Props = {
  total: number;
  onAddToCart: () => void;
  onSaveQuote: () => void;
  onShareQuote: () => void;
  isEditing: boolean;
  disabled?: boolean;
  canSaveQuote?: boolean;
};

export function PackTotalBox({
  total,
  onAddToCart,
  onSaveQuote,
  onShareQuote,
  isEditing,
  disabled = false,
  canSaveQuote = false,
}: Props) {
  const tc = useTranslations("Common");
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    if (disabled) return;
    onAddToCart();
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="mt-8 hidden overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm lg:block">
      <div className="flex items-center gap-8 p-6 xl:p-8">
        {/* TOTAL */}
        <div className={`min-w-0 flex-1 transition-opacity ${disabled ? "opacity-50" : ""}`} aria-live="polite">
          <p className="text-sm font-medium uppercase tracking-wider text-gray-500">
            {tc("total")}
          </p>
          <Price
            exclVat={total}
            className="mt-1 block text-4xl font-bold tracking-tight text-gray-900"
            labelClassName="text-base font-medium tracking-normal text-gray-500"
          />
        </div>

        {/* CTA */}
        <div className="w-full max-w-sm space-y-3">
          <button
            onClick={handleAdd}
            disabled={added || disabled}
            className={`relative flex w-full items-center justify-center overflow-hidden rounded-xl py-3.5 font-semibold text-white shadow-sm transition focus:outline-none focus-visible:ring-4 focus-visible:ring-orange-200
              ${added ? "bg-emerald-600" : "bg-orange-600 hover:bg-orange-700"}
              ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
          >
            <AnimatePresence mode="wait" initial={false}>
              {added ? (
                <motion.span
                  key="added"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  className="flex items-center gap-2"
                >
                  <CheckCircle2 className="h-5 w-5" />
                  {isEditing ? tc("updatedSuccessfully") : tc("addedToCart")}
                </motion.span>
              ) : (
                <motion.span
                  key="add"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  className="flex items-center gap-2"
                >
                  <ShoppingCart className="h-5 w-5" />
                  {isEditing ? tc("updateCart") : tc("addToCart")}
                </motion.span>
              )}
            </AnimatePresence>
          </button>

          <div className={canSaveQuote ? "grid grid-cols-2 gap-3" : "grid grid-cols-1 gap-3"}>
            <button
              type="button"
              onClick={onShareQuote}
              disabled={disabled}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Share2 className="h-4 w-4 shrink-0" />
              {tc("shareQuote")}
            </button>

            {canSaveQuote && (
              <button
                type="button"
                onClick={onSaveQuote}
                disabled={disabled}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-3 text-sm font-semibold text-orange-700 transition hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save className="h-4 w-4 shrink-0" />
                {tc("saveQuote")}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* INFOS */}
      <ul className="grid grid-cols-3 divide-x divide-gray-200 border-t border-gray-200 bg-gray-50 text-sm text-gray-600">
        {[
          { icon: Zap, label: tc("fastDelivery") },
          { icon: Truck, label: tc("freeDelivery") },
          { icon: ShieldCheck, label: tc("twoYearWarranty") },
        ].map(({ icon: Icon, label }) => (
          <li key={label} className="flex items-center justify-center gap-2 px-3 py-3 text-center">
            <Icon className="h-4 w-4 shrink-0 text-orange-600" aria-hidden="true" />
            <span>{label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
