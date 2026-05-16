import { useMemo } from "react";

export function usePackTotal({
  products,
  quantities,
  included,
  options,
  selectedOptions,
}: any) {
  return useMemo(() => {
    let total = 0;

    products.forEach((p: any) => {
      total += (quantities[p.id] || 0) * p.price;
    });

    included.forEach((p: any) => {
      total += (quantities[p.id] || 1) * p.price;
    });

    Object.keys(selectedOptions).forEach(id => {
      if (selectedOptions[id]) {
        const opt = options.find((o: any) => o.id === id);
        if (opt) total += opt.price;
      }
    });

    return total;
  }, [products, quantities, included, options, selectedOptions]);
}
