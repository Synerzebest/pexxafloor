"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";

export function useCartCheckout() {
  const [user, setUser] = useState<User | null>(null);
  const [clientName, setClientName] = useState("");
  const [address, setAddress] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
    });

    const { data: { subscription } } =
      supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
      });

    return () => subscription.unsubscribe();
  }, []);

  const isClientNameValid = clientName.trim() !== "";
  const isAddressValid =
    address && postalCode && city && country;

  return {
    user,
    clientName,
    setClientName,
    address,
    setAddress,
    postalCode,
    setPostalCode,
    city,
    setCity,
    country,
    setCountry,
    isClientNameValid,
    isAddressValid,
  };
}
