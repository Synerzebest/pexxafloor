"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";

type Option = {
  id: string;
  description: string;
  price: number;
  image?: string;
};

type Props = {
  options: Option[];
  selectedOptions: Record<string, boolean>;
  setSelectedOptions: React.Dispatch<
    React.SetStateAction<Record<string, boolean>>
  >;
};

export function PackOptions({
  options,
  selectedOptions,
  setSelectedOptions,
}: Props) {
  const t = useTranslations('PackOptions');
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-100">
      <h2 className="font-semibold text-xl mb-4 text-gray-800 border-b pb-3">
        {t('title')}
      </h2>

      <div className="flex flex-col gap-3">
        {options.map((opt) => {
          const checked = selectedOptions[opt.id] || false;

          return (
            <label
              key={opt.id}
              className={`flex items-center justify-between gap-4 border rounded-xl px-4 py-3 cursor-pointer transition duration-300 ${
                checked
                  ? "border-orange-500 bg-orange-50"
                  : "border-gray-200 hover:border-orange-400 hover:bg-gray-50"
              }`}
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-white">
                  <Image
                    src={opt.image || "/images/box.png"}
                    alt={opt.description}
                    fill
                    sizes="48px"
                    className="object-contain p-1"
                  />
                </div>
  
                <div className="min-w-0">
                  <span className="block min-w-0 text-sm font-medium text-gray-800">
                    {opt.description}
                  </span>
                  <span className="block text-sm font-bold text-gray-700">
                    + {opt.price.toFixed(2)} €
                  </span>
                </div>
              </div>

              <input
                type="checkbox"
                checked={checked}
                onChange={(e) =>
                  setSelectedOptions((prev) => ({
                    ...prev,
                    [opt.id]: e.target.checked,
                  }))
                }
                className="h-5 w-5 shrink-0 accent-orange-600"
              />
            </label>
          );
        })}
      </div>
    </div>
  );
}
