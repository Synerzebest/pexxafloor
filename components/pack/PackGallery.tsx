"use client";

import Image from "next/image";
import { useState } from "react";

type Product = {
  id: string;
  description: string;
  image?: string;
};

type Props = {
  products: Product[];
};

export function PackGallery({ products }: Props) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  return (
    <div className="lg:col-span-1">
      <div className="lg:sticky lg:top-24 self-start bg-white p-4 rounded-xl border border-gray-100">
        <div className="flex flex-col items-center">
          {/* Image principale */}
          <div className="w-full max-w-[300px] mb-4">
            <Image
              src={selectedImage || products[0]?.image || "/images/box.png"}
              alt="Image du pack"
              width={300}
              height={200}
              className="rounded-lg w-full h-auto object-contain"
            />
          </div>

          {/* Miniatures */}
          <div className="mt-2 grid grid-cols-4 gap-2 max-w-[300px] w-full">
            {products
              .filter((p) => p.image)
              .slice(0, 4)
              .map((p, idx) => (
                <div key={p.id}>
                  <Image
                    src={p.image || "/images/box.png"}
                    alt={p.description}
                    width={70}
                    height={70}
                    className={`rounded-md cursor-pointer object-cover w-full h-16 border transition-all duration-200 ${
                      selectedImage === p.image ||
                      (!selectedImage && idx === 0)
                        ? "border-orange-600 ring-1 ring-orange-500"
                        : "border-gray-200 hover:border-orange-400"
                    }`}
                    onClick={() =>
                      setSelectedImage(p.image || "/images/box.png")
                    }
                  />
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
