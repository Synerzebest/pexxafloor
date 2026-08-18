"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthProvider";

export function useUserProfile() {
  const { user, loading: loadingAuth } = useAuth();

  const [isPro, setIsPro] = useState<boolean | null>(null);
  const [categoryDiscounts, setCategoryDiscounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    if (loadingAuth) return;

    if (!user) {
      setIsPro(false);
      setCategoryDiscounts({});
      setLoading(false);
      return;
    }

    const loadProfile = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("profiles")
        .select("is_pro")
        .eq("id", user.id)
        .maybeSingle();

      if (!alive) return;

      if (error) {
        console.error("Profile fetch error:", error);
        setIsPro(false);
        setCategoryDiscounts({});
      } else {
        const nextIsPro = !!data?.is_pro;
        setIsPro(nextIsPro);
        if (nextIsPro) {
          const { data: discounts, error: discountsError } = await supabase
            .from("pro_category_discounts")
            .select("category_id, discount_percent")
            .eq("user_id", user.id);
          if (!alive) return;
          if (discountsError) {
            console.error("Custom PRO discounts fetch error:", discountsError);
            setCategoryDiscounts({});
          } else {
            setCategoryDiscounts(
              Object.fromEntries(
                (discounts || []).map((item) => [item.category_id, Number(item.discount_percent)])
              )
            );
          }
        } else {
          setCategoryDiscounts({});
        }
      }

      setLoading(false);
    };

    loadProfile();

    return () => {
      alive = false;
    };
  }, [user, loadingAuth]);

  return {
    isPro,
    categoryDiscounts,
    loading: loading || loadingAuth,
  };
}
