"use client";

import { Price } from "@/components/ui/Price";
import { useState, useEffect } from "react";
import { Input, Dropdown } from "antd";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { Loader2, Search, X } from "lucide-react";
import type { Product } from "@/types/ProductType";
import Image from "next/image";

type Props = {
  /** "inline" renders results in the flow (mobile drawer) instead of a floating dropdown */
  variant?: "dropdown" | "inline";
  onNavigate?: () => void;
  onFocusChange?: (focused: boolean) => void;
};

export default function ProductSearch({ variant = "dropdown", onNavigate, onFocusChange }: Props) {
  const supabase = createClientComponentClient();
  const locale = useLocale();
  const t = useTranslations("Navbar.search");
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Product[]>([]);
  // Query whose results are currently displayed; avoids flashing "no results" during the debounce
  const [searchedQuery, setSearchedQuery] = useState("");

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    const fetchProducts = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("products")
        .select(`
          id,
          slug,
          name_fr,
          name_nl,
          name_en,
          price,
          sort_order,

          subcategory:subcategories(
            id,
            slug,
            name_fr,
            name_nl,
            name_en,
            category:categories(
              id,
              slug,
              name_fr,
              name_nl,
              name_en
            )
          ),

          subsubcategory:subsubcategories!left(
            id,
            slug,
            name_fr,
            name_nl,
            name_en
          ),

          product_images!fk_product (
            image_url
          )
        `)
        .ilike(`name_${locale}`, `%${query}%`)
        .order("sort_order", { ascending: true })
        .limit(4);

      if (!error) setResults(data as unknown as Product[]);
      setSearchedQuery(query);
      setLoading(false);
    };

    const timer = setTimeout(fetchProducts, 300); // debounce
    return () => clearTimeout(timer);
  }, [query, locale, supabase]);

  const entries = results.map((p) => {
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
    const url = p.subsubcategory
      ? `/${locale}/categories/${p.subcategory.category.slug}/${p.subcategory.slug}/${p.subsubcategory.slug}/${p.slug}`
      : `/${locale}/categories/${p.subcategory.category.slug}/${p.subcategory.slug}/default/${p.slug}`;
  
    return { id: p.id, name, sub, cat, img, url, price: Number(p.price) };
  });

  const menuItems = entries.map(({ id, name, sub, cat, img, url, price }) => {
    return {
      key: id,
      label: (
        <div
          onClick={() => router.push(url)}
          className="flex items-center gap-3 cursor-pointer"
        >
          {img && (
            <Image
              src={img}
              alt={name}
              width={100}
              height={100}
              className="w-12 h-12 object-cover rounded"
            />
          )}
          <div className="flex flex-col">
            <strong>{name}</strong>
            <div className="text-xs text-gray-500">
              {cat} → {sub}
            </div>
            <Price exclVat={price} className="text-sm font-medium text-gray-800" />
          </div>
        </div>
      ),
    };
  });
  

  if (variant === "inline") {
    const searching = query.length >= 2 && searchedQuery === query;
    return (
      <div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" aria-hidden="true" />
          <input
            type="search"
            enterKeyHint="search"
            autoComplete="off"
            placeholder={t("placeholder")}
            aria-label={t("placeholder")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => onFocusChange?.(true)}
            onBlur={() => onFocusChange?.(false)}
            className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 pl-11 pr-11 text-base text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-100 [&::-webkit-search-cancel-button]:hidden"
          />
          {loading ? (
            <Loader2 className="absolute right-3.5 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin text-orange-500" aria-hidden="true" />
          ) : query ? (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setQuery("")}
              aria-label={t("clear")}
              className="absolute right-1.5 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        {searching && !loading && (
          <div
            className="mt-2 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm"
            aria-live="polite"
            // Keep the input focused while tapping a result so the full-width drawer stays put
            onMouseDown={(e) => e.preventDefault()}
          >
            {entries.length === 0 ? (
              <p className="px-4 py-5 text-center text-sm text-gray-500">{t("noResults")}</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {entries.map(({ id, name, sub, cat, img, url, price }) => (
                  <li key={id}>
                    <Link
                      href={url}
                      onClick={() => {
                        setQuery("");
                        onNavigate?.();
                      }}
                      className="flex items-center gap-3 px-3 py-2.5 transition active:bg-orange-50"
                    >
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-gray-100 bg-gray-50">
                        <Image src={img || "/images/box.png"} alt="" fill sizes="48px" className="object-contain p-1" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-sm font-medium leading-snug text-gray-900">{name}</p>
                        <p className="truncate text-xs text-gray-500">{[cat, sub].filter(Boolean).join(" › ")}</p>
                      </div>
                      <Price
                        exclVat={price}
                        className="shrink-0 text-right text-sm font-semibold text-orange-600"
                        labelClassName="block text-[10px] font-normal text-gray-500"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <Dropdown
      open={results.length > 0 || loading}
      menu={{ items: menuItems }}
      placement="bottom"
      overlayClassName="w-96"
    >
      <Input.Search
        placeholder={t("placeholder")}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        loading={loading}
        allowClear
        className="w-full"
      />
    </Dropdown>
  );
}
