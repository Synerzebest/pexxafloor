import { useEffect, useState } from "react";

export function useCartPricing(items: any, user: any) {
  const [pricedItems, setPricedItems] = useState(items);
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    if (!user) return;

    fetch("/api/cart/pricing", {
      method: "POST",
      body: JSON.stringify({
        items,
        user_id: user.id,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        setPricedItems(data.items);
        setIsPro(data.isPro);
      });
  }, [items, user]);

  return { pricedItems, isPro };
}