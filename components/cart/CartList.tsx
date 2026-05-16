"use client";

import { AnimatePresence } from "framer-motion";
import CartItem from "./CartItem";

export default function CartList({
  items,
  updateQuantity,
  removeFromCart,
  t,
  isPro
}: any) {
  return (
    <ul className="space-y-5">
      <AnimatePresence>
        {items.map((item: any) => (
          <CartItem
            key={item.id || item.product_id}
            item={item}
            updateQuantity={updateQuantity}
            removeFromCart={removeFromCart}
            t={t}
          />
        ))}
      </AnimatePresence>
    </ul>
  );
}
