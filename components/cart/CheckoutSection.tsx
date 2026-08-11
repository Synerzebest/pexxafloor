"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { useTranslations } from "next-intl";
import { LoadScript } from "@react-google-maps/api";
import AddressAutocomplete from "@/components/ui/AddressAutocomplete";
import { useCartCheckout } from "@/hooks/useCartCheckout";
import Link from "next/link";

type CartItem =
  | {
      type: "product";
      product_id: string;
      quantity: number;
      product?: { price?: number };
    }
  | {
      type: "pack";
      id: string;
      quantity: number;
      total: number;
    };

type Props = {
  items: CartItem[];
  isPro: boolean;
};

type AddressSelection = {
  address: string;
  postalCode: string;
  city: string;
  country: string;
};

export default function CheckoutSection({ items, isPro }: Props) {
  const locale = useLocale();
  const t = useTranslations("Cart");
  const [creditBalanceCents, setCreditBalanceCents] = useState(0);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const {
    user,
    clientName,
    setClientName,
    address,
    setAddress,
    postalCode,
    setPostalCode,
    city,
    setCity,
    country,
    setCountry,
    isClientNameValid,
    isAddressValid,
  } = useCartCheckout();

  const { baseTotal, finalTotal } = items.reduce(
    (acc, i: any) => {
      if (i.type === "product") {
        const base = (i.base_price ?? i.product?.price ?? 0) * i.quantity;
        const final = (i.unit_price ?? i.product?.price ?? 0) * i.quantity;
  
        acc.baseTotal += base;
        acc.finalTotal += final;
      }
  
      if (i.type === "pack") {
        const total = i.total * i.quantity;
        acc.baseTotal += total;
        acc.finalTotal += total;
      }
  
      return acc;
    },
    { baseTotal: 0, finalTotal: 0 }
  );
  
  const hasDiscount = isPro && baseTotal > finalTotal;
  const creditAppliedCents =
    isPro && creditBalanceCents > 0
      ? Math.min(creditBalanceCents, Math.max(0, Math.round(finalTotal * 100) - 50))
      : 0;
  const displayedTotal = Math.max(0, finalTotal - creditAppliedCents / 100);

  useEffect(() => {
    if (!user || !isPro) {
      setCreditBalanceCents(0);
      return;
    }

    let cancelled = false;

    fetch("/api/pro-credit", { credentials: "include", cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error(await response.text());
        return response.json() as Promise<{ balanceCents: number }>;
      })
      .then((data) => {
        if (!cancelled) setCreditBalanceCents(Number(data.balanceCents || 0));
      })
      .catch((error) => {
        console.error("Impossible de charger le crédit PRO:", error);
      });

    return () => {
      cancelled = true;
    };
  }, [user, isPro]);

  async function handleCheckout() {
    if (!user || checkoutLoading) return;

    if (!isAddressValid) {
      alert(t("errors.address"));
      return;
    }

    if (!isClientNameValid) {
      alert(t("errors.clientName"));
      return;
    }

    try {
      setCheckoutLoading(true);

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          locale,
          items,
          clientName,
          shipping: { address, postalCode, city, country, locale },
        }),
      });

      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        throw new Error(data.error || "Checkout failed");
      }

      window.location.href = data.url;
    } catch (error) {
      console.error(error);
      alert(t("errors.checkout"));
      setCheckoutLoading(false);
    }
  }

  return (
    <div className="mt-10 space-y-6">
      {/* Client name */}
      <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          {t("clientName")}
        </label>
        <input
          type="text"
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          placeholder="Ex: PexxaFloor"
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-[15px]
                     shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500
                     transition-all outline-none bg-white"
        />
      </div>

      {/* Address */}
      <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("fullAddress")}
          </label>

          <LoadScript
            googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}
            libraries={["places"]}
          >
            <AddressAutocomplete
              value={address}
              onChange={setAddress}
              onPlaceSelected={(data: AddressSelection) => {
                setAddress(data.address);
                setPostalCode(data.postalCode);
                setCity(data.city);
                setCountry(data.country);
              }}
            />
          </LoadScript>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("zipCode")}
            </label>
            <input
              type="text"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              placeholder="1000"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-[15px]
                         shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500
                         transition-all outline-none bg-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("city")}
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Bruxelles"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-[15px]
                         shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500
                         transition-all outline-none bg-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("country")}
            </label>
            <input
              type="text"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="Belgique"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-[15px]
                         shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500
                         transition-all outline-none bg-white"
            />
          </div>
        </div>
      </div>

       {/* Sticky total */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 shadow-lg p-4 sm:p-5 rounded-t-xl sm:rounded-xl">
            <div className="w-full flex flex-col items-start justify-center gap-4">

            {/* Total */}
            <div className="w-full flex flex-row justify-between items-start">
              <span className="text-sm sm:text-lg font-medium text-gray-600">
                {t("total")}:
              </span>

              <div className="text-right flex flex-col items-end leading-none">
                {/* Prix final */}
                <div className="text-2xl sm:text-3xl font-semibold tracking-tight text-orange-600">
                  {displayedTotal.toFixed(2)} €
                </div>

                {/* Ancien prix + remise */}
                {hasDiscount && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-sm text-gray-400 line-through">
                      {baseTotal.toFixed(2)} €
                    </span>
                    <span className="text-xs font-medium text-green-600">
                      {t("proDiscount")}
                    </span>
                  </div>
                )}
                {creditAppliedCents > 0 && (
                  <div className="mt-2 text-sm font-medium text-emerald-600">
                    {t("creditApplied", {
                      amount: (creditAppliedCents / 100).toFixed(2),
                    })}
                  </div>
                )}
              </div>
            </div>
            
            {/* Checkout Button */}
            {!user ? (
              <div className="w-full sm:w-auto">
                <p className="mb-2 text-sm text-gray-500">
                  {t("loginRequired")}
                </p>
                <Link
                  href={`/${locale}/login?next=${encodeURIComponent(`/${locale}/cart`)}`}
                  className="inline-flex h-12 w-full items-center justify-center rounded-lg bg-orange-600 px-5 text-base font-medium text-white transition hover:bg-orange-700 sm:w-auto"
                >
                  {t("loginToCheckout")}
                </Link>
              </div>
            ) : (
              <button
                className="h-12 cursor-pointer rounded-lg bg-orange-600 px-4 py-2 text-base font-medium text-white duration-300 hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-gray-300 sm:h-auto sm:w-auto"
                onClick={handleCheckout}
                disabled={!isClientNameValid || !isAddressValid || checkoutLoading}
              >
                {checkoutLoading ? t("paymentLoading") : t("payment")}
              </button>
            )}

            </div>
        </div>
    </div>
  );
}
