import { useCallback, useEffect, useRef, useState } from "react";
import type { StorekeeperProduct } from "@/types/StorekeeperProductType";
import type { Order } from "@/types/OrderType";

type PickingStep = "picking" | "verification";
type Action = "save_progress" | "save_internal" | "start_verification" | "finish_verification";

export function useOrder(orderId: string) {
  const [order, setOrder] = useState<Order | null>(null);
  const [products, setProducts] = useState<StorekeeperProduct[]>([]);
  const [step, setStep] = useState<PickingStep>("picking");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const loaded = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const response = await fetch(`/api/orders/${orderId}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load order");
      setOrder(data.order);
      setProducts(data.products || []);
      setStep(data.step || "picking");
      loaded.current = true;
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Unable to load order");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    load();
  }, [load]);

  const runAction = useCallback(async (action: Action, extra: Record<string, unknown> = {}) => {
    setSaving(true);
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, products, ...extra }),
      });
      const data = await response.json();
      if (!response.ok) return { error: data.error || "Unable to save" };
      if (data.products && action !== "save_progress") setProducts(data.products);
      if (data.step) setStep(data.step);
      return { error: null };
    } catch {
      return { error: "Network error" };
    } finally {
      setSaving(false);
    }
  }, [orderId, products]);

  useEffect(() => {
    if (!loaded.current || loading) return;
    const timeout = window.setTimeout(() => {
      runAction("save_progress");
    }, 700);
    return () => window.clearTimeout(timeout);
  }, [products, loading, runAction]);

  return {
    order,
    products,
    setProducts,
    step,
    setStep,
    loading,
    saving,
    loadError,
    reload: load,
    saveInternal: (internalNote: string, internalComment: string) =>
      runAction("save_internal", { internalNote, internalComment }),
    startVerification: () => runAction("start_verification"),
    finishVerification: () => runAction("finish_verification"),
  };
}
