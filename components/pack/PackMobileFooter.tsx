"use client";

import { Price } from "@/components/ui/Price";
import { useState } from "react";
import { CheckCircle2, FileText, Share2, ShoppingCart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";

type Props = {
  total: number;
  onAddToCart: () => void;
  /** PRO: opens the quote details (create, or view the linked saved quote) */
  onOpenQuote: () => void;
  /** Visitor without PRO account: neutral estimate */
  onShareQuote: () => void;
  isEditing: boolean;
  disabled?: boolean;
  isPro?: boolean;
  /** The configured pack is already saved as a quote */
  hasQuote?: boolean;
};

export function PackMobileFooter({
  total,
  onAddToCart,
  onOpenQuote,
  onShareQuote,
  isEditing,
  disabled = false,
  isPro = false,
  hasQuote = false,
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
    <div className="sticky bottom-0 w-full bg-white border-t border-gray-200 p-4 lg:hidden z-40">
      <div className="max-w-lg mx-auto space-y-3">
        <div className={`flex items-baseline justify-between gap-3 transition-opacity ${disabled ? "opacity-50" : ""}`}>
          <span className="text-sm font-medium text-gray-500">{tc("total")}</span>
          <Price exclVat={total} className="text-xl font-bold text-gray-900" labelClassName="text-xs font-medium text-gray-500" />
        </div>

        <button
          onClick={handleAdd}
          disabled={added || disabled}
          className={`relative flex w-full items-center justify-center overflow-hidden rounded-xl py-3 font-semibold text-white transition
            ${added ? "bg-emerald-600" : "bg-orange-600 hover:bg-orange-700"}
            ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
        >
          <AnimatePresence mode="wait" initial={false}>
            {added ? (
              <motion.span
                key="added"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25 }}
                className="flex items-center gap-2"
              >
                <CheckCircle2 className="h-5 w-5" />
                {isEditing ? tc("updatedSuccessfully") : tc("addedToCart")}
              </motion.span>
            ) : (
              <motion.span
                key="add"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25 }}
                className="flex items-center gap-2"
              >
                <ShoppingCart className="h-5 w-5" />
                {isEditing ? tc("updateCart") : tc("addToCart")}
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        {isPro ? (
          <button
            type="button"
            onClick={onOpenQuote}
            disabled={disabled}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-sm font-semibold text-orange-700 disabled:opacity-60"
          >
            <FileText className="h-4 w-4" />
            {tc(hasQuote ? "viewQuote" : "transformToQuote")}
          </button>
        ) : (
          <button
            type="button"
            onClick={onShareQuote}
            disabled={disabled}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 disabled:opacity-60"
          >
            <Share2 className="h-4 w-4" />
            {tc("share")}
          </button>
        )}
      </div>
    </div>
  );
}
