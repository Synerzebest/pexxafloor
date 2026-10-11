"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePriceDisplayContext } from "@/context/PriceDisplayContext";
import { formatEuro, toInclVat } from "@/lib/pricing/vat";

/**
 * Display rule: logged-in PRO → amounts excluding VAT only; everyone else → amounts including VAT only.
 * Every amount passed in is excluding VAT (the catalog's reference price).
 */
export function usePriceDisplay() {
  const { showExclVat, ready } = usePriceDisplayContext();
  const locale = useLocale();
  const t = useTranslations("Common");

  const amount = (exclVat: number) => (showExclVat ? exclVat : toInclVat(exclVat));

  return {
    showExclVat,
    ready,
    amount,
    format: (exclVat: number) => formatEuro(amount(exclVat), locale),
    formatRaw: (value: number) => formatEuro(value, locale),
    label: showExclVat ? t("priceExclVat") : t("priceInclVat"),
    labelExclVat: t("priceExclVat"),
    labelInclVat: t("priceInclVat"),
  };
}
