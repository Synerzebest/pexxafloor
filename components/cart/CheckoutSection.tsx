"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { useTranslations } from "next-intl";
import { useJsApiLoader, type Libraries } from "@react-google-maps/api";
import AddressAutocomplete from "@/components/ui/AddressAutocomplete";
import { useCartCheckout } from "@/hooks/useCartCheckout";
import Link from "next/link";
import { useCookieConsent } from "@/context/CookieConsentContext";

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

type SavedAddress = {
  id: string;
  address: string;
  postal_code: string;
  city: string;
  country: string;
  last_used_at: string;
};

const GOOGLE_MAPS_LIBRARIES: Libraries = ["places"];

function GoogleDeliveryAddressAutocomplete({
  value,
  onChange,
  onPlaceSelected,
}: {
  value: string;
  onChange: (value: string) => void;
  onPlaceSelected: (data: AddressSelection) => void;
}) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: "pexxafloor-google-maps",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  // Keep the address editable even if Google Places is temporarily unavailable.
  if (loadError) {
    return (
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Ex. 123 Rue du Tracé, 1000 Bruxelles"
        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-[15px] shadow-sm outline-none transition-all focus:border-orange-500 focus:ring-2 focus:ring-orange-500"
      />
    );
  }

  if (!isLoaded) {
    return <div className="h-10 w-full animate-pulse rounded-xl bg-gray-100" />;
  }

  return (
    <AddressAutocomplete
      value={value}
      onChange={onChange}
      onPlaceSelected={onPlaceSelected}
    />
  );
}

function DeliveryAddressAutocomplete({
  value,
  onChange,
  onPlaceSelected,
}: {
  value: string;
  onChange: (value: string) => void;
  onPlaceSelected: (data: AddressSelection) => void;
}) {
  const t = useTranslations("Cart");
  const { consent, savePreferences } = useCookieConsent();

  if (consent?.externalServices) {
    return (
      <GoogleDeliveryAddressAutocomplete
        value={value}
        onChange={onChange}
        onPlaceSelected={onPlaceSelected}
      />
    );
  }

  return (
    <div>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Ex. 123 Rue du Tracé, 1000 Bruxelles"
        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-[15px] shadow-sm outline-none transition-all focus:border-orange-500 focus:ring-2 focus:ring-orange-500"
      />
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
        <span>{t("addressAutocompleteDisabled")}</span>
        <button type="button" onClick={() => savePreferences(true)} className="font-semibold text-orange-700 underline underline-offset-2">
          {t("enableAddressAutocomplete")}
        </button>
      </div>
    </div>
  );
}

export default function CheckoutSection({ items, isPro }: Props) {
  const locale = useLocale();
  const t = useTranslations("Cart");
  const [creditBalanceCents, setCreditBalanceCents] = useState(0);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState("new");
  const [saveAddress, setSaveAddress] = useState(false);

  const {
    user,
    address,
    setAddress,
    postalCode,
    setPostalCode,
    city,
    setCity,
    country,
    setCountry,
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
  const displayedTotalHTVA = Math.max(0, finalTotal - creditAppliedCents / 100);
  const displayedTotalTVAC = displayedTotalHTVA * 1.21;

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

  useEffect(() => {
    if (!user) {
      setSavedAddresses([]);
      setSelectedAddressId("new");
      return;
    }

    let cancelled = false;
    fetch("/api/shipping-addresses", { credentials: "include", cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error(await response.text());
        return response.json() as Promise<SavedAddress[]>;
      })
      .then((data) => {
        if (!cancelled) setSavedAddresses(data);
      })
      .catch((error) => {
        // Le checkout reste utilisable si la table n'a pas encore été installée.
        console.error("Impossible de charger les adresses enregistrées:", error);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  function selectSavedAddress(id: string) {
    setSelectedAddressId(id);
    setSaveAddress(false);
    if (id === "new") {
      setAddress("");
      setPostalCode("");
      setCity("");
      setCountry("");
      return;
    }

    const saved = savedAddresses.find((item) => item.id === id);
    if (!saved) return;
    setAddress(saved.address);
    setPostalCode(saved.postal_code);
    setCity(saved.city);
    setCountry(saved.country);
  }

  function markAddressAsNew() {
    if (selectedAddressId !== "new") {
      setSelectedAddressId("new");
      setSaveAddress(false);
    }
  }

  async function deleteSelectedAddress() {
    if (selectedAddressId === "new") return;
    const id = selectedAddressId;
    const response = await fetch(`/api/shipping-addresses?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!response.ok) {
      alert(t("errors.deleteAddress"));
      return;
    }

    setSavedAddresses((current) => current.filter((item) => item.id !== id));
    selectSavedAddress("new");
  }

  async function handleCheckout() {
    if (!user || checkoutLoading) return;

    if (!isAddressValid) {
      alert(t("errors.address"));
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
          shipping: { address, postalCode, city, country, locale },
          saveAddress: selectedAddressId === "new" && saveAddress,
          savedAddressId: selectedAddressId === "new" ? null : selectedAddressId,
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
      {user && (
        <>
          {/* Address */}
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-4">
        {savedAddresses.length > 0 && (
          <div className="rounded-xl border border-orange-100 bg-orange-50/60 p-4">
            <label className="mb-2 block text-sm font-semibold text-gray-800">
              {t("savedAddresses")}
            </label>
            <select
              value={selectedAddressId}
              onChange={(event) => selectSavedAddress(event.target.value)}
              className="w-full rounded-xl border border-orange-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
            >
              <option value="new">{t("newAddress")}</option>
              {savedAddresses.map((saved) => (
                <option key={saved.id} value={saved.id}>
                  {saved.address} · {saved.postal_code} {saved.city}
                </option>
              ))}
            </select>
            <div className="mt-2 flex items-center justify-between gap-3">
              <p className="text-xs text-gray-500">{t("savedAddressesHint")}</p>
              {selectedAddressId !== "new" && (
                <button
                  type="button"
                  onClick={deleteSelectedAddress}
                  className="shrink-0 text-xs font-medium text-red-600 transition hover:text-red-700"
                >
                  {t("deleteAddress")}
                </button>
              )}
            </div>
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("fullAddress")}
          </label>

          <DeliveryAddressAutocomplete
            value={address}
            onChange={(value) => {
              markAddressAsNew();
              setAddress(value);
            }}
            onPlaceSelected={(data) => {
              markAddressAsNew();
              setAddress(data.address);
              setPostalCode(data.postalCode);
              setCity(data.city);
              setCountry(data.country);
            }}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("zipCode")}
            </label>
            <input
              type="text"
              value={postalCode}
              onChange={(e) => {
                markAddressAsNew();
                setPostalCode(e.target.value);
              }}
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
              onChange={(e) => {
                markAddressAsNew();
                setCity(e.target.value);
              }}
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
              onChange={(e) => {
                markAddressAsNew();
                setCountry(e.target.value);
              }}
              placeholder="Belgique"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-[15px]
                         shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500
                         transition-all outline-none bg-white"
            />
          </div>
        </div>
        {selectedAddressId === "new" && (
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4">
            <input
              type="checkbox"
              checked={saveAddress}
              onChange={(event) => setSaveAddress(event.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 accent-orange-600"
            />
            <span>
              <span className="block text-sm font-medium text-gray-800">{t("saveAddress")}</span>
              <span className="mt-1 block text-xs leading-5 text-gray-500">{t("saveAddressConsent")}</span>
            </span>
          </label>
        )}
          </div>
        </>
      )}

       {/* Sticky total */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 shadow-lg p-4 sm:p-5 rounded-t-xl sm:rounded-xl">
            <div className="w-full flex flex-col items-start justify-center gap-4">

            {/* Total */}
            <div className="w-full flex flex-row justify-between items-start">
              <span className="text-sm sm:text-lg font-medium text-gray-600">{t("total")}:</span>

              <div className="text-right flex flex-col items-end leading-none">
                {/* Prix final */}
                <div className="text-2xl sm:text-3xl font-semibold tracking-tight text-orange-600">
                  {displayedTotalTVAC.toFixed(2)} €
                </div>
                <div className="mt-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {t("totalInclVat")}
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  {t("totalExclVat")} : <span className="font-semibold text-gray-900">{displayedTotalHTVA.toFixed(2)} €</span>
                </div>

                {/* Ancien prix + remise */}
                {hasDiscount && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-sm text-gray-400 line-through">
                      {(baseTotal * 1.21).toFixed(2)} € {t("vatIncluded")}
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
                disabled={!isAddressValid || checkoutLoading}
              >
                {checkoutLoading ? t("paymentLoading") : t("payment")}
              </button>
            )}

            </div>
        </div>
    </div>
  );
}
