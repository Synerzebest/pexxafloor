"use client";

import { useCart } from "@/context/CartContext";
import { Navbar, Footer } from "@/components";
import { Empty } from "antd";
import { useTranslations } from "next-intl";
import CartList from "@/components/cart/CartList";
import CheckoutSection from "@/components/cart/CheckoutSection";

export default function CartPage() {
  const { items, updateQuantity, removeFromCart } = useCart();
  const t = useTranslations("Cart");

  if (!items.length) {
    return (
      <>
        <Navbar />
        <div className="max-w-4xl mx-auto py-20">
          <Empty description={t("emptyCart")} />
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />

      <div className="max-w-4xl mx-auto py-12 px-4 relative top-32 mb-44">
        <h1 className="text-3xl font-bold mb-8">
          {t("myCart")}
        </h1>

        <CartList
          items={items}
          updateQuantity={updateQuantity}
          removeFromCart={removeFromCart}
          t={t}
        />

        <CheckoutSection items={items} />
      </div>

      <Footer />
    </>
  );
}
