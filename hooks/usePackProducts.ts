"use client";

import { useEffect, useRef, useState } from "react";
import { PackItem } from "@/context/CartContext";
import type { PackLineProduct } from "@/types/PackConfigType";
import type { SavedPackQuote } from "@/context/QuoteContext";

export function usePackProducts({
  slug,
  surface,
  pasDePose,
  tuyauType,
  typeAgrafe,
  typeIsolation,
  existingPack,
  savedQuote,
}: {
  slug: string;
  surface: number;
  pasDePose: number;
  tuyauType: "PERT" | "PERT-AL-PERT";
  typeAgrafe: 40 | 60;
  typeIsolation: 0 | 15 | 30;
  existingPack?: PackItem;
  savedQuote?: SavedPackQuote;
}) {
  const [packId, setPackId] = useState<string | null>(existingPack?.pack_id || savedQuote?.pack_id || null);
  const [products, setProducts] = useState<PackLineProduct[]>([]);
  const [included, setIncluded] = useState<PackLineProduct[]>([]);
  const [options, setOptions] = useState<PackLineProduct[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [initialQuantities, setInitialQuantities] = useState<Record<string, number>>({});
  const [selectedOptions, setSelectedOptions] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedRef = useRef(false);
  const restoredExistingRef = useRef(false);
  const restoredQuoteRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadPackProducts() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/packs/${slug}/calculate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            surface,
            pasDePose,
            tuyauType,
            typeAgrafe,
            typeIsolation,
          }),
        });

        if (!res.ok) {
          throw new Error(await res.text());
        }

        const result = await res.json();
        if (cancelled) return;

        const restoredOptions: Record<string, boolean> = {};
        const optionLines = result.options || [];

        optionLines.forEach((option: PackLineProduct) => {
          if (
            existingPack?.selectedOptions?.[option.id] ||
            savedQuote?.selectedOptions?.[option.id]
          ) {
            restoredOptions[option.id] = true;
          }
        });

        const shouldRestoreExisting = !!existingPack && !restoredExistingRef.current;
        const shouldRestoreQuote = !!savedQuote && restoredQuoteRef.current !== savedQuote.id;
        const nextQuantities = shouldRestoreQuote
          ? { ...result.quantities, ...savedQuote.quantities }
          : shouldRestoreExisting
          ? { ...result.quantities, ...existingPack.quantities }
          : result.quantities;

        setPackId(result.pack?.id || existingPack?.pack_id || savedQuote?.pack_id || null);
        setProducts(result.products || []);
        setQuantities(nextQuantities);
        setInitialQuantities(result.quantities || {});
        setIncluded(result.included || []);
        setOptions(optionLines);
        setSelectedOptions((prev) => {
          if (shouldRestoreExisting || shouldRestoreQuote) return restoredOptions;

          return optionLines.reduce((acc: Record<string, boolean>, option: PackLineProduct) => {
            if (prev[option.id]) acc[option.id] = true;
            return acc;
          }, {});
        });
        if (shouldRestoreExisting) {
          restoredExistingRef.current = true;
        }
        if (shouldRestoreQuote) {
          restoredQuoteRef.current = savedQuote.id;
        }
        hasLoadedRef.current = true;
        setHasLoaded(true);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Erreur de calcul du pack");
          if (!hasLoadedRef.current) {
            setProducts([]);
            setIncluded([]);
            setOptions([]);
            setQuantities({});
            setInitialQuantities({});
            setSelectedOptions({});
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadPackProducts();

    return () => {
      cancelled = true;
    };
  }, [slug, surface, pasDePose, tuyauType, typeAgrafe, typeIsolation, existingPack?.id, savedQuote?.id]);

  return {
    packId,
    products,
    included,
    options,
    quantities,
    setQuantities,
    initialQuantities,
    selectedOptions,
    setSelectedOptions,
    loading,
    isInitialLoading: loading && !hasLoaded,
    isRecalculating: loading && hasLoaded,
    error,
  };
}
