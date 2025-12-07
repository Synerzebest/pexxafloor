import { useEffect, useState } from "react";
import { Order } from "@/types/OrderType";
import { toast } from "sonner";

// Définition du type Locale pour le hook
type Locale = 'fr' | 'en' | 'nl';

export function useOrdersAdmin(currentLocale: Locale = 'fr') { 
  const [orders, setOrders] = useState<Order[]>([]);
  const [selected, setSelected] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);

  const [processing, setProcessing] = useState({
    validating: false,
    delivering: false,
    delivered: false,
    readying: false,
  });

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

  async function updateStatus(
    api: string,
    orderId: string,
    newStatus: string,
    key: string,
    // 👈 NOUVEAU PARAMÈTRE POUR LA LOCALE
    locale: Locale 
  ) {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return toast.error("Commande introuvable");

    setProcessing((prev) => ({ ...prev, [key]: true }));

    try {
      const res = await fetch(api, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            order_id: orderId,
            locale: locale, // 👈 AJOUT DE LA LOCALE DANS LE BODY
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Erreur lors de la mise à jour");
        return;
      }

      toast.success("Statut mis à jour");

      // Mettre à jour la liste des commandes
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId ? { ...o, status: newStatus } : o
        )
      );

      // Mettre à jour la commande sélectionnée si elle est ouverte
      setSelected((prev) =>
        prev ? { ...prev, status: newStatus } : prev
      );
    } catch (err) {
      toast.error("Erreur réseau");
    }

    setProcessing((prev) => ({ ...prev, [key]: false }));
  }

  return {
    orders,
    loading,
    selected,
    setSelected,
    loadOrders,
    processing,
    validateOrder: (id: string) =>
      updateStatus("/api/orders/validate", id, "preparing", "validating", currentLocale),
    confirmOrder: (id: string) =>
      updateStatus("/api/orders/deliver", id, "delivering", "delivering", currentLocale),
    readyOrder: (id: string) =>
      updateStatus("/api/orders/ready", id, "ready", "readying", currentLocale),
    finalizeOrder: (id: string) =>
      updateStatus("/api/orders/delivered", id, "delivered", "delivered", currentLocale),
  };
}