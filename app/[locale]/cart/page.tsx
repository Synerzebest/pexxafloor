"use client";

import { useCart } from "@/context/CartContext";
import { Navbar, Footer } from "@/components";
import { useLocale, useTranslations } from "next-intl";
import CartList from "@/components/cart/CartList";
import CheckoutSection from "@/components/cart/CheckoutSection";
import { useCartCheckout } from "@/hooks/useCartCheckout";
import { useCartPricing } from "@/hooks/useCartPricing";
import Link from "next/link";
import { ArrowRight, Calculator, ShoppingBag } from "lucide-react";

export default function CartPage() {
  const { items, updateQuantity, removeFromCart } = useCart();
  const { user } = useCartCheckout();
  const { pricedItems, isPro } = useCartPricing(items, user);
  const t = useTranslations("Cart");
  const locale = useLocale();

  if (!items.length) {
    return (
      <>
        <Navbar />
        <main className="mx-auto flex min-h-[75vh] max-w-5xl items-center justify-center px-4 pb-20 pt-32 sm:pt-40">
          <section className="relative w-full overflow-hidden rounded-3xl border border-gray-200 bg-white px-6 py-14 text-center shadow-sm sm:px-12 sm:py-20">
            <div className="pointer-events-none absolute -left-20 -top-24 h-64 w-64 rounded-full bg-orange-100/60 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-28 -right-16 h-64 w-64 rounded-full bg-amber-100/50 blur-3xl" />

            <div className="relative mx-auto flex max-w-xl flex-col items-center">
              <div className="relative grid h-24 w-24 place-items-center rounded-3xl border border-orange-100 bg-gradient-to-br from-orange-50 to-amber-50 text-orange-600 shadow-sm">
                <ShoppingBag className="h-11 w-11" strokeWidth={1.7} aria-hidden="true" />
                <span className="absolute -right-1 -top-1 grid h-7 w-7 place-items-center rounded-full bg-white text-sm font-bold text-orange-500 shadow ring-1 ring-orange-100">
                  0
                </span>
              </div>

              <p className="mt-7 text-xs font-semibold uppercase tracking-[0.2em] text-orange-600">
                PexxaFloor
              </p>
              <h1 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                {t("empty.title")}
              </h1>
              <p className="mt-4 max-w-md text-base leading-7 text-gray-500">
                {t("empty.description")}
              </p>

              <div className="mt-8 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
                <Link
                  href={`/${locale}/categories`}
                  className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-orange-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-700 hover:shadow-md"
                >
                  {t("empty.browse")}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </Link>
                <Link
                  href={`/${locale}/quote`}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-700 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700"
                >
                  <Calculator className="h-4 w-4" aria-hidden="true" />
                  {t("empty.calculate")}
                </Link>
              </div>
            </div>
          </section>
        </main>
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
          items={pricedItems}
          isPro={isPro}
          updateQuantity={updateQuantity}
          removeFromCart={removeFromCart}
          t={t}
        />

        <CheckoutSection items={pricedItems} isPro={isPro} />
      </div>

      <Footer />
    </>
  );
}
