"use client";

import { useState } from "react";
import { CheckCircle2, Save, Share2 } from "lucide-react";
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
    <div className="mt-8 hidden lg:block rounded-2xl border border-orange-200 bg-white p-6">
      <div className="space-y-6">
        {/* TOTAL */}
        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold text-gray-900">
            {tc("totalToPay")}
          </span>
          <span className="text-3xl font-bold text-orange-600">
            {total.toFixed(2)} €
          </span>
        </div>

        {/* CTA */}
        <button
          onClick={handleAdd}
          disabled={added || disabled}
          className={`cursor-pointer bg-orange-600 hover:bg-orange-700 relative overflow-hidden h-12 w-full rounded-xl font-medium text-white flex items-center justify-center transition
            ${added || disabled ? "cursor-not-allowed opacity-70" : "cursor-allowed"}`}
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
                {isEditing ? tc("updatedSuccessfully") : tc("addedToCart")}
              </motion.div>
            ) : (
              <motion.div
                key="add"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
              >
                {isEditing ? tc("updateCart") : tc("addToCart")}
              </motion.div>
            )}
          </AnimatePresence>
        </button>

        <div className={canSaveQuote ? "grid grid-cols-2 gap-3" : "grid grid-cols-1 gap-3"}>
          <button
            type="button"
            onClick={onShareQuote}
            disabled={disabled}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Share2 className="h-4 w-4" />
            {tc("shareQuote")}
          </button>

          {canSaveQuote && (
            <button
              type="button"
              onClick={onSaveQuote}
              disabled={disabled}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-4 text-sm font-semibold text-orange-700 transition hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {tc("saveQuote")}
            </button>
          )}
        </div>

        {/* INFOS */}
        <div className="text-center text-xs text-gray-500 space-y-1">
          <p>🚚 {tc("fastDelivery")}</p>
          <p>🇧🇪 {tc("freeDelivery")}</p>
          <p>🛡️ {tc("twoYearWarranty")}</p>
        </div>
      </div>
    </div>
  );
}
