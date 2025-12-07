import { useState, useEffect } from "react";
import { parseOrderItems } from "@/utils/parseOrderItems";
import { StorekeeperProduct } from "@/types/StorekeeperProductType";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Order } from "@/types/OrderType";

export function useOrder(orderId: string) {
  const supabase = createClientComponentClient();

  const [order, setOrder] = useState<Order | null>(null);
  const [products, setProducts] = useState<StorekeeperProduct[]>([]);
  const [step, setStep] = useState<"picking" | "verification">("picking");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);

    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    const parsed = parseOrderItems(data.items);

    setOrder(data);
    setProducts(parsed);
    setStep(data.status === "verification" ? "verification" : "picking");
    setLoading(false);
  }

  async function updateOrder(fields: any) {
    if (!order) {
        return { error: "Order not loaded" }; 
    }
    return supabase.from("orders").update(fields).eq("id", order.id);
  }

  return {
    order,
    products,
    setProducts,
    step,
    setStep,
    loading,

    reload: load,
    updateOrder,
  };
}
