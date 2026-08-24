"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthProvider";

export function useUserProfile() {
  const { user, loading: loadingAuth } = useAuth();

  const [isPro, setIsPro] = useState<boolean | null>(null);
  const [profileName, setProfileName] = useState<string | null>(null);
  const [categoryDiscounts, setCategoryDiscounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    if (loadingAuth) return;

    if (!user) {
      setIsPro(false);
      setProfileName(null);
      setCategoryDiscounts({});
      setLoading(false);
      return;
    }

    const loadProfile = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("profiles")
        .select("is_pro, name, company_name")
        .eq("id", user.id)
        .maybeSingle();

      if (!alive) return;

      if (error) {
        console.error("Profile fetch error:", error);
        setIsPro(false);
        setProfileName(null);
        setCategoryDiscounts({});
      } else {
        const nextIsPro = !!data?.is_pro;
        setIsPro(nextIsPro);
        setProfileName(data?.name || data?.company_name || null);
        if (nextIsPro) {
          const { data: discounts, error: discountsError } = await supabase
            .from("pro_category_discounts")
            .select("category_id, subcategory_id, subsubcategory_id, discount_percent")
            .eq("user_id", user.id);
          if (!alive) return;
          if (discountsError) {
            console.error("Custom PRO discounts fetch error:", discountsError);
            setCategoryDiscounts({});
          } else {
            setCategoryDiscounts(
              Object.fromEntries(
                (discounts || []).flatMap((item) => {
                  const key = item.subsubcategory_id
                    ? `subsubcategory:${item.subsubcategory_id}`
                    : item.subcategory_id
                    ? `subcategory:${item.subcategory_id}`
                    : item.category_id
                    ? `category:${item.category_id}`
                    : null;
                  return key ? [[key, Number(item.discount_percent)]] : [];
                })
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
    profileName,
    categoryDiscounts,
    loading: loading || loadingAuth,
  };
}
