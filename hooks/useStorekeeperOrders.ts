import { useState } from "react";
import { message } from "antd";
import type { Order } from "@/types/OrderType";

export function useStorekeeperOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  async function loadOrders(status?: string) {
    setLoading(true);

    try {
      const url = status ? `/api/orders/fetchOrders?status=${status}` : `/api/orders/fetchOrders`;
      const res = await fetch(url);
      const json = await res.json();

      if (json.error) message.error(json.error);
      else setOrders(json.data || []);
    } catch (err) {
      message.error("Erreur réseau");
    }

    setLoading(false);
  }

  async function markAsPacked(id: string) {
    try {
      const res = await fetch("/api/orders/pack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: id }),
      });

      const json = await res.json();
      if (!res.ok) return message.error(json.error);

      message.success("Commande passée en 'packed'");

      setOrders(prev =>
        prev.map(o => (o.id === id ? { ...o, status: "packed" } : o))
      );
    } catch (e) {
      message.error("Erreur réseau");
    }
  }

  return {
    orders,
    loading,
    loadOrders,
    markAsPacked,
  };
}
