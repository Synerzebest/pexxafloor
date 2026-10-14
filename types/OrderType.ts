export type Order = {
    id: string;
    user_id: string;
    stripe_session_id?: string | null;
    paid_at?: string | null;
    status: string;
    total: number;
    items: any;
    client_name: string;
    company_name?: string | null;
    created_at: string;
    address: string;
    postal_code: string;
    city: string;
    country: string;
    cartons: number;
    rouleaux: number;
    bottes: number;
    language: string;
    internal_note: string;
    internal_comment: string;
    picking_items?: import("@/types/StorekeeperProductType").StorekeeperProduct[];
    picking_step?: "picking" | "verification";
    picking_updated_at?: string | null;
  };

export type OrderMode = "live" | "test" | "unknown";

// Stripe Checkout session IDs encode the mode: cs_live_… / cs_test_…
export function getOrderMode(order: Pick<Order, "stripe_session_id">): OrderMode {
  if (order.stripe_session_id?.startsWith("cs_live_")) return "live";
  if (order.stripe_session_id?.startsWith("cs_test_")) return "test";
  return "unknown";
}

/**
 * Payment is tracked apart from the fulfilment status: paid_at is set once the order is paid.
 * Before the paid_at migration the column is absent; Stripe orders were then always paid.
 */
export function isOrderPaid(order: { paid_at?: string | null; stripe_session_id?: string | null }) {
  if (order.paid_at !== undefined) return order.paid_at !== null;
  return Boolean(order.stripe_session_id);
}
