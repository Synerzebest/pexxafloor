"use client";

import { useTranslations } from "next-intl";

type Props = {
  calepinage: boolean;
  setCalepinage: (v: boolean) => void;
};

export function PackCalepinageOption({
  calepinage,
  setCalepinage,
}: Props) {
  const t = useTranslations('PackCalepinageOption');

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-100">
      <div
        className={`
          rounded-xl border p-4 transition
          ${
            calepinage
              ? "border-orange-500 bg-orange-50"
              : "border-gray-200 bg-gray-50"
          }
        `}
      >
        <label className="flex items-start gap-4 cursor-pointer">
          <input
            type="checkbox"
            checked={calepinage}
            onChange={(e) => setCalepinage(e.target.checked)}
            className="mt-1 h-5 w-5 accent-orange-600"
          />

          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-800">
              {t('title')}
              <span className="ml-2 text-gray-400 line-through text-xs">
                125,00 €
              </span>
              <span className="ml-2 text-green-600 text-xs font-medium">
                {t('gift')}
              </span>
            </p>

            <p className="mt-1 text-xs text-gray-500 leading-relaxed">
              {t('description')}
            </p>
          </div>
        </label>
      </div>
    </div>
  );
}
