"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import type { PackProduct } from "@/types/PackProductType";

type ProductItem = {
  type: "product";
  product_id: string;
  quantity: number;
  name?: string;
  price?: number;
  image?: string;
  product?: {
    name: string;
    price: number;
    image?: string;
  };
};

type PackItem = {
  type: "pack";
  id: string;
  slug: string;
  surface: number;
  pasDePose: number;
  tuyauType: "PERT" | "PERT-AL-PERT";
  typeAgrafe: 40 | 60;
  typeIsolation: 0 | 15 | 30;
  calepinage: boolean;
  quantities: Record<string, number>; 
  products: PackProduct[];
  total: number; 
  quantity: number;
  createdAt?: string; 
};

type CartItem = ProductItem | PackItem;
export type { PackItem, ProductItem, CartItem }


type CartContextType = {
  items: CartItem[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, newQty: number) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // Charger le panier depuis localstorage
  useEffect(() => {
    const saved = localStorage.getItem("cart");
    if (saved) {
      try {
        setItems(JSON.parse(saved));
      } catch (e) {
        console.error("Erreur parse panier :", e);
      }
    }
  }, []);

  // Sauvegarder à chaque modification
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(items));
  }, [items]);

  const openCart = () => setIsOpen(true);
  const closeCart = () => setIsOpen(false);

  const addToCart = (item: CartItem) => {
    setItems((prev) => {
      // Produit simple
      if (item.type === "product") {
        const existing = prev.find(
          (i) => i.type === "product" && i.product_id === item.product_id
        );
        if (existing) {
          return prev.map((i) =>
            i.type === "product" && i.product_id === item.product_id
              ? { ...i, quantity: i.quantity + item.quantity }
              : i
          );
        }
        return [...prev, item];
      }
  
      // Pack
      if (item.type === "pack") {
        const existing = prev.find(
          (i) =>
            i.type === "pack" &&
            i.slug === item.slug &&
            i.surface === item.surface &&
            i.pasDePose === item.pasDePose
        );
  
        if (existing) {
          return prev.map((i) =>
            i.type === "pack" &&
            i.slug === item.slug &&
            i.surface === item.surface &&
            i.pasDePose === item.pasDePose
              ? { ...i, quantity: i.quantity + 1 }
              : i
          );
        }
  
        // S’il n’existe pas, on lui génère un id
        return [
          ...prev,
          { ...item, id: `pack-${item.slug}-${uuidv4()}`, quantity: 1 },
        ];
      }
  
      return prev;
    });
  
  };  

  const removeFromCart = (id: string) => {
    setItems((prev) => prev.filter((i) => i.type === "product" ? i.product_id !== id : i.id !== id));
  }

  const updateQuantity = (id: string, newQty: number) => {
    setItems((prev) =>
      prev.map((i) => {
        if (i.type === "product" && i.product_id === id) {
          return { ...i, quantity: newQty };
        }
        if (i.type === "pack" && i.id === id) {
          return { ...i, quantity: newQty };
        }
        return i;
      })
    );
  };

  const clearCart = () => {
    setItems([]);
    localStorage.removeItem('cart')
  }

  return (
    <CartContext.Provider value={{ items, isOpen, openCart, closeCart, addToCart, removeFromCart, updateQuantity, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};
