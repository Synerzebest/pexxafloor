"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Props = {
  total: number;
  onAddToCart: () => void;
  isEditing: boolean;
  disabled?: boolean;
};

export function PackTotalBox({
  total,
  onAddToCart,
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
    <div className="mt-8 hidden lg:block rounded-2xl border border-orange-200 bg-white p-6">
      <div className="space-y-6">
        {/* TOTAL */}
        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold text-gray-900">
            Total à payer
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
            ${
              added || disabled
                ? "cursor-not-allowed"
                : "cursor-allowed"
            }`}
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
                {isEditing ? "Modifié avec succès" : "Ajouté au panier"}
              </motion.div>
            ) : (
              <motion.div
                key="add"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
              >
                {isEditing ? "Mettre à jour le panier" : "Ajouter au panier"}
              </motion.div>
            )}
          </AnimatePresence>
        </button>

        {/* INFOS */}
        <div className="text-center text-xs text-gray-500 space-y-1">
          <p>🚚 Livraison rapide</p>
          <p>🇧🇪 Livraison offerte dès 99 €</p>
          <p>🛡️ Garantie 2 ans</p>
        </div>
      </div>
    </div>
  );
}
