"use client";

import { useState, useEffect } from "react";
import { Input, Dropdown } from "antd";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";

type Product = {
    id: string;
    slug: string;
    price: string;
    name_fr: string;
    name_nl: string;
    name_en: string;
    subcategory: {
      id: string;
      slug: string;
      name_fr: string;
      name_nl: string;
      name_en: string;
      category: {
        id: string;
        slug: string;
        name_fr: string;
        name_nl: string;
        name_en: string;
      };
    };
    product_images: { image_url: string }[];
  };
  
export default function ProductSearch() {
  const supabase = createClientComponentClient();
  const locale = useLocale();
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Product[]>([]);

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    const fetchProducts = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("products")
        .select(
            `
            id, slug, name_fr, name_nl, name_en, price,
            subcategory:subcategories(
            id, name_fr, name_nl, name_en,
            category:categories(id, slug, name_fr, name_nl, name_en)
            ),
            product_images!fk_product ( image_url )
            `
        )
        .ilike(`name_${locale}`, `%${query}%`)
        .limit(8);

      console.log(data)
      if (!error) setResults(data as Product[]);
      setLoading(false);
    };

    const timer = setTimeout(fetchProducts, 300); // debounce
    return () => clearTimeout(timer);
  }, [query, locale, supabase]);

  const menuItems = results.map((p) => {
    const name =
      locale === "fr" ? p.name_fr : locale === "nl" ? p.name_nl : p.name_en;
  
    const sub =
      locale === "fr"
        ? p.subcategory?.name_fr
        : locale === "nl"
        ? p.subcategory?.name_nl
        : p.subcategory?.name_en;
  
    const cat =
      locale === "fr"
        ? p.subcategory?.category?.name_fr
        : locale === "nl"
        ? p.subcategory?.category?.name_nl
        : p.subcategory?.category?.name_en;
  
    const img = p.product_images?.[0]?.image_url;
    const url = `/categories/${p.subcategory?.category?.slug}/${p.subcategory?.slug}/${p.slug}`;
  
    return {
      key: p.id,
      label: (
        <div
          onClick={() => router.push(url)}
          className="flex items-center gap-3 cursor-pointer"
        >
          {img && (
            <img
              src={img}
              alt={name}
              className="w-12 h-12 object-cover rounded"
            />
          )}
          <div className="flex flex-col">
            <strong>{name}</strong>
            <div className="text-xs text-gray-500">
              {cat} → {sub}
            </div>
            <div className="text-sm font-medium text-gray-800">
              {Number(p.price).toFixed(2)} €
            </div>
          </div>
        </div>
      ),
    };
  });
  

  return (
    <Dropdown
      open={results.length > 0 || loading}
      menu={{ items: menuItems }}
      placement="bottom"
      overlayClassName="w-96"
    >
      <Input.Search
        placeholder="Rechercher un produit..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        loading={loading}
        allowClear
        className="w-full"
      />
    </Dropdown>
  );
}
