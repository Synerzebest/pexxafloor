"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Category } from "@/types/CategoryType";

type StoreDataContextType = {
  categories: Category[];
  loading: boolean;
  refetch: () => Promise<void>;
};

const StoreDataContext = createContext<StoreDataContextType>({
  categories: [],
  loading: true,
  refetch: async () => {},
});

export function StoreDataProvider({ children }: { children: React.ReactNode }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCategories = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("categories")
      .select(`
        id, slug, name_fr, name_nl, name_en,
        subcategories:subcategories!category_id (
          id, slug, name_fr, name_nl, name_en,
          subsubcategories:subsubcategories!subsubcategories_subcategory_id_fkey (
            id, slug, name_fr, name_nl, name_en
          )
        )
      `)
      .order("order");

    if (error) {
      console.error("Erreur fetch catégories:", error);
    } else {
      setCategories(data as unknown as Category[]);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return (
    <StoreDataContext.Provider
      value={{
        categories,
        loading,
        refetch: fetchCategories,
      }}
    >
      {children}
    </StoreDataContext.Provider>
  );
}

export const useStoreData = () => useContext(StoreDataContext);
