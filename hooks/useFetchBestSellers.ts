"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { Product } from "@/types/ProductType";

export function useFetchBestSellers(limit = 6) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    const fetchBestSellers = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data, error } = await supabase
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
          .eq("is_best_seller", true)
          .order("created_at", { ascending: false })
          .limit(limit);

        if (error) throw error;

        if (alive) {
          setProducts((data as unknown as Product[]) || []);
        }
      } catch (err) {
        console.error("Error fetching best sellers:", err);
        if (alive) {
          setError("Impossible de charger les best sellers");
        }
      } finally {
        if (alive) setLoading(false);
      }
    };

    fetchBestSellers();

    return () => {
      alive = false;
    };
  }, [limit]);

  return {
    products,
    loading,
    error,
  };
}
