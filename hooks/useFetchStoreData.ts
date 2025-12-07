"use client";
import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export function useFetchStoreData() {
  const supabase = createClientComponentClient();
  const [categories, setCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [subsubcategories, setSubsubcategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  async function fetchAll() {
    setLoading(true);
    const [cats, subs, subsubs, prods] = await Promise.all([
      supabase.from("categories").select("*").order("order"),
      supabase.from("subcategories").select("*").order("order"),
      supabase.from("subsubcategories").select("*").order("order"),
      supabase.from("products").select("*").order("created_at", { ascending: false }),
    ]);

    const prodsWithImages = await Promise.all(
      (prods.data || []).map(async (p) => {
        const { data: imgs } = await supabase
          .from("product_images")
          .select("id, image_url, order")
          .eq("product_id", p.id)
          .order("order");
        return { ...p, product_images: imgs || [] };
      })
    );

    setCategories(cats.data || []);
    setSubcategories(subs.data || []);
    setSubsubcategories(subsubs.data || []);
    setProducts(prodsWithImages);
    setLoading(false);
  }

  useEffect(() => {
    fetchAll();
  }, []);

  return {
    categories,
    subcategories,
    subsubcategories,
    products,
    loading,
    fetchAll,
    supabase,
  };
}
