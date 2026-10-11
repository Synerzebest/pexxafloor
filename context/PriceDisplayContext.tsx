"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthProvider";

type PriceDisplayContextType = {
  /** Logged-in PRO customers see prices excluding VAT; everyone else sees prices including VAT. */
  showExclVat: boolean;
  ready: boolean;
};

const PriceDisplayContext = createContext<PriceDisplayContextType>({ showExclVat: false, ready: false });

// Loads the PRO flag once for the whole app instead of once per displayed price.
export function PriceDisplayProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: loadingAuth } = useAuth();
  const [state, setState] = useState<PriceDisplayContextType>({ showExclVat: false, ready: false });

  useEffect(() => {
    if (loadingAuth) return;
    if (!user) {
      setState({ showExclVat: false, ready: true });
      return;
    }

    let alive = true;
    setState((current) => ({ ...current, ready: false }));
    supabase
      .from("profiles")
      .select("is_pro")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!alive) return;
        if (error) console.error("Price display profile fetch error:", error);
        setState({ showExclVat: !error && data?.is_pro === true, ready: true });
      });

    return () => {
      alive = false;
    };
  }, [user, loadingAuth]);

  return <PriceDisplayContext.Provider value={state}>{children}</PriceDisplayContext.Provider>;
}

export const usePriceDisplayContext = () => useContext(PriceDisplayContext);
