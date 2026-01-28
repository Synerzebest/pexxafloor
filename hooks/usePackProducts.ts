"use client";

import { useEffect, useState } from "react";
import packs from "@/constants/packs.json";
import { computePackProducts } from "@/utils/packCalculations";
import { PackItem } from "@/context/CartContext";

export function usePackProducts({
  packNumber,
  surface,
  pasDePose,
  tuyauType,
  typeAgrafe,
  existingPack,
}: {
  packNumber: number | null;
  surface: number;
  pasDePose: number;
  tuyauType: "PERT" | "PERT-AL-PERT";
  typeAgrafe: 40 | 60;
  existingPack?: PackItem;
}) {
  const [products, setProducts] = useState<any[]>([]);
  const [included, setIncluded] = useState<any[]>([]);
  const [options, setOptions] = useState<any[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [initialQuantities, setInitialQuantities] = useState<Record<string, number>>({});
  const [selectedOptions, setSelectedOptions] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!packNumber) return;

    setLoading(true);

    if (existingPack) {
      setProducts(existingPack.products.map(p => ({
        id: p.id,
        description: p.description,
        price: p.unit_price,
      })));

      setQuantities(existingPack.quantities);
      setInitialQuantities(existingPack.quantities);

      const inc = packs.included.filter(p => p.packs?.includes(packNumber));
      const opt = packs.options.filter(p => p.packs?.includes(packNumber));

      setIncluded(inc);
      setOptions(opt);

      const restored: Record<string, boolean> = {};
      opt.forEach(o => {
        if (existingPack.products.some(p => p.id === o.id)) restored[o.id] = true;
      });

      setSelectedOptions(restored);
      setLoading(false);
      return;
    }

    const result = computePackProducts({
      packNumber,
      surface,
      pasDePose,
      tuyauType,
      typeAgrafe,
    });

    setProducts(result.products);
    setQuantities(result.quantities);
    setInitialQuantities(result.quantities);
    setIncluded(result.included);
    setOptions(result.options);
    setSelectedOptions({});
    setLoading(false);
  }, [packNumber, surface, pasDePose, tuyauType, typeAgrafe, existingPack]);

  return {
    products,
    included,
    options,
    quantities,
    setQuantities,
    initialQuantities,
    selectedOptions,
    setSelectedOptions,
    loading,
  };
}
