import { useEffect, useState } from "react";
import { Order } from "@/types/OrderType";
import { toast } from "sonner";

export function useOrdersAdmin() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selected, setSelected] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);

  const [processing, setProcessing] = useState({
    moving: false,
    paying: false,
  });

  async function setOrderPaid(orderId: string, paid: boolean) {
    setProcessing((prev) => ({ ...prev, paying: true }));
    try {
      const res = await fetch("/api/orders/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: orderId, paid }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Erreur lors de la mise à jour du paiement");
        return;
      }
      const paidAt: string | null = json.order?.paid_at ?? null;
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, paid_at: paidAt } : o)));
      setSelected((prev) => (prev && prev.id === orderId ? { ...prev, paid_at: paidAt } : prev));
      toast.success(paid ? "Commande marquée comme payée" : "Commande marquée comme non payée");
    } catch {
      toast.error("Erreur réseau");
    } finally {
      setProcessing((prev) => ({ ...prev, paying: false }));
    }
  }

  async function loadOrders() {
    setLoading(true);

    try {
      const res = await fetch("/api/orders/fetchOrders");
      const json = await res.json();

      if (json.error) {
        toast.error(json.error || "Erreur lors du chargement");
      } else {
        setOrders(json.data || []);
      }
    } catch (err) {
      toast.error("Erreur réseau");
    }

    setLoading(false);
  }

  useEffect(() => {
    loadOrders();
  }, []);

  // Moves the order one step along the workflow; only moving forward emails the customer
  async function moveOrderStatus(order: Order, direction: "next" | "previous") {
    setProcessing((prev) => ({ ...prev, moving: true }));
    try {
      const res = await fetch("/api/orders/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: order.id, direction, from: order.status }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Erreur lors de la mise à jour");
        return;
      }

      const newStatus: string = json.order.status;
      if (direction === "previous") {
        toast.success("Statut précédent rétabli (aucun e-mail envoyé)");
      } else if (json.notification?.pending) {
        toast.warning("Statut mis à jour. L’e-mail est en attente d’envoi.");
      } else {
        toast.success("Statut mis à jour, le client a été prévenu");
      }

      setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status: newStatus } : o)));
      setSelected((prev) => (prev && prev.id === order.id ? { ...prev, status: newStatus } : prev));
    } catch {
      toast.error("Erreur réseau");
    } finally {
      setProcessing((prev) => ({ ...prev, moving: false }));
    }
  }

  return {
    orders,
    loading,
    selected,
    setSelected,
    loadOrders,
    processing,
    moveOrderStatus,
    setOrderPaid,
  };
}
