"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthProvider";

export function useUserProfile() {
  const { user, loading: loadingAuth } = useAuth();

  const [isPro, setIsPro] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    if (loadingAuth) return;

    if (!user) {
      setIsPro(false);
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
      } else {
        setIsPro(!!data?.is_pro);
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
    loading: loading || loadingAuth,
  };
}
