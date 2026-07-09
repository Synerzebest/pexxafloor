"use client";

import { useState } from "react";
import { CheckCircle2, Save, Share2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Props = {
  total: number;
  onAddToCart: () => void;
  onSaveQuote: () => void;
  onShareQuote: () => void;
  isEditing: boolean;
  disabled?: boolean;
};

export function PackMobileFooter({
  total,
  onAddToCart,
  onSaveQuote,
  onShareQuote,
  isEditing,
  disabled = false,
}: Props) {
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    if (disabled) return;
    onAddToCart();
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 p-4 lg:hidden z-40">
      <div className="max-w-lg mx-auto space-y-3">
        <div className="flex justify-between items-center">
        <div className="text-base font-bold text-gray-900">
          Total :{" "}
          <span className="text-orange-600 text-xl">
            {total.toFixed(2)} €
          </span>
        </div>

        <button
          onClick={handleAdd}
          disabled={added || disabled}
          className={`cursor-pointer relative overflow-hidden px-4 py-2 rounded-lg text-white font-medium flex items-center justify-center transition
            ${
              added || disabled
                ? "cursor-not-allowed bg-gray-300"
                : "bg-orange-600 hover:bg-orange-700"
            }`}
        >
          <AnimatePresence mode="wait" initial={false}>
            {added ? (
              <motion.div
                key="added"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25 }}
                className="flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                {isEditing ? "Modifié" : "Ajouté"}
              </motion.div>
            ) : (
              <motion.div
                key="add"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25 }}
              >
                {isEditing ? "Mettre à jour" : "Ajouter"}
              </motion.div>
            )}
          </AnimatePresence>
        </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onShareQuote}
            disabled={disabled}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 disabled:opacity-60"
          >
            <Share2 className="h-4 w-4" />
            Partager
          </button>
          <button
            type="button"
            onClick={onSaveQuote}
            disabled={disabled}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-sm font-semibold text-orange-700 disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}
