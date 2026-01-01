"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Product } from "@/types/ProductType";
import { supabase } from "@/lib/supabaseClient";

type Props = {
  product: Product;
  locale: "fr" | "nl" | "en";
  categorySlug: string;
  subcategorySlug: string;
  subsubcategorySlug: string;
};

type Translatable = {
  name_fr: string;
  name_en: string;
  name_nl: string;
};

export default function ProductCard({
  product,
  locale,
  categorySlug,
  subcategorySlug,
  subsubcategorySlug,
}: Props) {
  const [isPro, setIsPro] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      // 1️⃣ lire la session existante
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user && mounted) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("is_pro")
          .eq("id", session.user.id)
          .maybeSingle();

        setIsPro(!!profile?.is_pro);
      }

      setLoadingAuth(false);
    }

    initAuth();

    // 2️⃣ écouter les changements d’auth
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      if (session?.user) {
        supabase
          .from("profiles")
          .select("is_pro")
          .eq("id", session.user.id)
          .maybeSingle()
          .then(({ data }) => {
            setIsPro(!!data?.is_pro);
          });
      } else {
        setIsPro(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const getName = (obj: Translatable) =>
    locale === "fr"
      ? obj.name_fr
      : locale === "nl"
      ? obj.name_nl
      : obj.name_en;

  const imageUrl =
    product.product_images?.[0]?.image_url ?? "/images/placeholder.png";

  // ---------------- PRIX ----------------
  const TVA = 1.21;

  const priceBrutHTVA = product.price;
  const priceNetHTVA =
    product.price_after_discount ?? product.price;

  const priceBrutTVAC = priceBrutHTVA * TVA;

  const showProPrices = !loadingAuth && isPro;
  const discount = product.applied_discount ?? 0;
  const hasProDiscount =
    showProPrices && discount > 0 && priceNetHTVA < priceBrutHTVA;
  
  const formatPrice = (value: number) =>
    new Intl.NumberFormat("fr-BE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
  }).format(value);



  return (
    <>
    <li className="rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-lg transition-shadow overflow-hidden group">
      <Link
        href={`/${locale}/categories/${categorySlug}/${subcategorySlug}/${subsubcategorySlug}/${product.slug}`}
      >
        <div className="relative w-full h-40 bg-white flex items-center justify-center p-4">
          <Image
            src={imageUrl}
            alt={getName(product)}
            fill
            className="object-contain transition-transform duration-200 group-hover:scale-105"
          />
        </div>

        <div className="p-4 space-y-3">
          <h3 className="text-gray-800 font-medium text-sm leading-snug line-clamp-2 group-hover:text-orange-600 transition">
            {getName(product)}
          </h3>

          <div className="h-px bg-gray-100 w-full"></div>

          {/* -------- PRIX -------- */}
          <div>
            {showProPrices ? (
              hasProDiscount ? (
                <>
                  <div className="text-sm text-gray-400 line-through">
                    {formatPrice(priceBrutHTVA)} € TVA excl.
                  </div>

                  <div className="text-lg font-semibold text-orange-700">
                    {formatPrice(priceNetHTVA)} € TVA excl.
                  </div>

                  <div className="text-xs font-medium text-green-600">
                    Remise PRO −{discount}%
                  </div>
                </>
              ) : (
                <div className="text-lg font-semibold text-orange-700">
                  {formatPrice(priceBrutHTVA)} € TVA excl.
                </div>
              )
            ) : (
              <div className="text-lg font-semibold text-gray-900">
                {formatPrice(priceBrutTVAC)}{" "} €
                <span className="text-xs text-gray-500 pl-1">TVA incl.</span>
              </div>
            )}
          </div>
        </div>
      </Link>
    </li>
    </>
  );
}
