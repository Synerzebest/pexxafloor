"use client";

import Image from "next/image";
import { Switch } from "antd";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Product } from "../../../types/ProductType";

type Props = {
  products: Product[];
  supabase: SupabaseClient;
  fetchAll: () => void;
};

export default function AdminBestSellerSection({
  products,
  supabase,
  fetchAll,
}: Props) {
  const toggle = async (id: string, value: boolean) => {
    await supabase
      .from("products")
      .update({ is_best_seller: value })
      .eq("id", id);

    fetchAll();
  };

  const formatPrice = (value: number) =>
    new Intl.NumberFormat("fr-BE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);

  return (
    <div className="space-y-4">
      {products.map((p) => {
        const image = p.product_images?.[0]?.image_url;

        const basePrice = p.price;
        const categoryDiscount =
          p.subcategory.category.discount ?? 0;

        const priceNetHTVA =
          categoryDiscount > 0
            ? basePrice * (1 - categoryDiscount / 100)
            : basePrice;

        return (
          <div
            key={p.id}
            className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4"
          >
            <div className="flex items-center gap-4">
              {image && (
                <div className="relative h-16 w-16 overflow-hidden rounded-lg">
                  <Image
                    src={image}
                    alt={p.name_fr}
                    fill
                    className="object-cover"
                  />
                </div>
              )}

              <div>
                <p className="font-medium text-gray-800">
                  {p.name_fr}
                </p>

                {categoryDiscount > 0 ? (
                  <>
                    <p className="text-sm text-gray-400 line-through">
                      {formatPrice(basePrice)} €
                    </p>
                    <p className="text-sm font-medium text-orange-700">
                      {formatPrice(priceNetHTVA)} € HTVA
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-gray-500">
                    {formatPrice(basePrice)} € HTVA
                  </p>
                )}
              </div>
            </div>

            <Switch
              checked={!!p.is_best_seller}
              onChange={(checked) =>
                toggle(p.id, checked)
              }
              checkedChildren="Oui"
              unCheckedChildren="Non"
            />
          </div>
        );
      })}
    </div>
  );
}
