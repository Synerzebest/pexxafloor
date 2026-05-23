"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";

type Item = {
  id: string;
  description: string;
  image?: string;
};

type Props = {
  included: Item[];
};

export function PackIncluded({ included }: Props) {
  const t = useTranslations('PackIncluded');
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-100">
      <h2 className="font-semibold text-xl mb-4 text-gray-800 border-b pb-3">
        {t('title')}
      </h2>

      <ul className="space-y-3">
        {included.map((item) => (
          <li
            key={item.id}
            className="flex items-center justify-between gap-4 bg-gray-50 rounded-lg px-4 py-3 border border-gray-200"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-white">
                <Image
                  src={item.image || "/images/box.png"}
                  alt={item.description}
                  fill
                  sizes="48px"
                  className="object-contain p-1"
                />
              </div>

              <span className="min-w-0 text-sm font-medium text-gray-800">
                {item.description}
              </span>
            </div>

              {/* Icône check verte */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-5 h-5 shrink-0 text-green-600"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z"
                  clipRule="evenodd"
                />
              </svg>
          </li>
        ))}
      </ul>
    </div>
  );
}
