"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

type Product = {
  id: string;
  description: string;
  image?: string;
};

type Props = {
  products: Product[];
};

export function PackGallery({ products }: Props) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const uniqueGalleryProducts = useMemo(
    () =>
      products
        .filter((p) => p.image)
        .filter(
          (product, index, all) =>
            all.findIndex((item) => item.image === product.image) === index
        ),
    [products]
  );
  const selectedProduct = uniqueGalleryProducts[selectedIndex];
  const mainImage = selectedProduct?.image || "/images/box.png";
  const hasMultipleImages = uniqueGalleryProducts.length > 1;

  useEffect(() => {
    if (selectedIndex >= uniqueGalleryProducts.length) {
      setSelectedIndex(0);
    }
  }, [selectedIndex, uniqueGalleryProducts.length]);

  const selectPrevious = () => {
    if (!hasMultipleImages) return;
    setSelectedIndex((current) =>
      current === 0 ? uniqueGalleryProducts.length - 1 : current - 1
    );
  };

  const selectNext = () => {
    if (!hasMultipleImages) return;
    setSelectedIndex((current) =>
      current === uniqueGalleryProducts.length - 1 ? 0 : current + 1
    );
  };

  return (
    <div className="lg:col-span-1">
      <div className="lg:sticky lg:top-24 self-start rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4">
          <div className="group relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl border border-gray-100 bg-gray-50">
            <Image
              src={mainImage}
              alt={selectedProduct?.description || "Image du pack"}
              fill
              sizes="(min-width: 1024px) 33vw, 100vw"
              priority
              className="object-contain p-5 transition-transform duration-300 group-hover:scale-[1.03]"
            />

            {hasMultipleImages && (
              <>
                <button
                  type="button"
                  onClick={selectPrevious}
                  aria-label="Image précédente"
                  className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white/90 text-gray-700 shadow-sm transition hover:border-orange-400 hover:text-orange-600"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={selectNext}
                  aria-label="Image suivante"
                  className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white/90 text-gray-700 shadow-sm transition hover:border-orange-400 hover:text-orange-600"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}
          </div>

          {selectedProduct && (
            <p className="line-clamp-2 min-h-10 text-sm font-medium leading-5 text-gray-700">
              {selectedProduct.description}
            </p>
          )}

          <div className="grid max-h-48 w-full grid-cols-4 gap-2 overflow-y-auto pr-1">
            {uniqueGalleryProducts.map((p, idx) => {
              const selected = selectedIndex === idx;

              return (
                <button
                  key={`${p.id}-${p.image}`}
                  type="button"
                  onClick={() => setSelectedIndex(idx)}
                  aria-label={`Afficher ${p.description}`}
                  className={`relative aspect-square overflow-hidden rounded-lg border bg-white transition ${
                    selected
                      ? "border-orange-600 ring-2 ring-orange-200"
                      : "border-gray-200 hover:border-orange-400"
                  }`}
                >
                  <Image
                    src={p.image || "/images/box.png"}
                    alt={p.description}
                    fill
                    sizes="80px"
                    className="object-contain p-1.5"
                  />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
