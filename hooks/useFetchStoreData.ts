"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export function useFetchStoreData() {
  const [categories, setCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [subsubcategories, setSubsubcategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  async function fetchAll() {
    setLoading(true);
  
    const [
      cats,
      subs,
      subsubs,
      prods,
    ] = await Promise.all([
      supabase
        .from("categories")
        .select("*")
        .order("name_fr", { ascending: true }),
  
      supabase
        .from("subcategories")
        .select("*")
        .order("name_fr", { ascending: true }),
  
      supabase
        .from("subsubcategories")
        .select("*")
        .order("name_fr", { ascending: true }),
  
      supabase
        .from("products")
        .select(`
          id,
          slug,
          name_fr,
          name_nl,
          name_en,
          description_fr,
          description_nl,
          description_en,
          price,
          reference,
          is_best_seller,
          created_at,
  
          product_images!fk_product (
            id,
            image_url,
            order
          ),
  
          subcategory:subcategories (
            id,
            slug,
            name_fr,
            name_nl,
            name_en,
  
            category:categories (
              id,
              slug,
              name_fr,
              name_nl,
              name_en,
              discount
            )
          ),
  
          subsubcategory:subsubcategories!left (
            id,
            slug,
            name_fr,
            name_nl,
            name_en
          )
        `)
        .order("created_at", { ascending: false }),
    ]);
  
    setCategories(cats.data || []);
    setSubcategories(subs.data || []);
    setSubsubcategories(subsubs.data || []);
    setProducts(prods.data || []);
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
