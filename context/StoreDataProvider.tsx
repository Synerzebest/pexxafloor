"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Category } from "@/types/CategoryType";

type PackImage = { slug: string; image_url: string | null };

type StoreDataContextType = {
  categories: Category[];
  loading: boolean;
  refetch: () => Promise<void>;
  /** Pack photo from the catalog; undefined while packs are still loading */
  getPackImage: (slug: string) => string | undefined;
};

const PACK_IMAGE_FALLBACK = "/images/box.png";

const StoreDataContext = createContext<StoreDataContextType>({
  categories: [],
  loading: true,
  refetch: async () => {},
  getPackImage: () => undefined,
});

export function StoreDataProvider({ children }: { children: React.ReactNode }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [packImages, setPackImages] = useState<Record<string, string | null> | null>(null);

  const fetchCategories = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("categories")
      .select(`
        id, slug, name_fr, name_nl, name_en, image_url,
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

    supabase
      .from("packs")
      .select("slug, image_url")
      .then(({ data, error }) => {
        if (error) console.error("Erreur fetch packs:", error);
        setPackImages(
          Object.fromEntries(((data as PackImage[] | null) || []).map((pack) => [pack.slug, pack.image_url]))
        );
      });
  }, []);

  const getPackImage = (slug: string) =>
    packImages === null ? undefined : packImages[slug] || PACK_IMAGE_FALLBACK;

  return (
    <StoreDataContext.Provider
      value={{
        categories,
        loading,
        refetch: fetchCategories,
        getPackImage,
      }}
    >
      {children}
    </StoreDataContext.Provider>
  );
}

export const useStoreData = () => useContext(StoreDataContext);
