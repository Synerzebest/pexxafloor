"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

export default function ProButton({ locale }: { locale: string }) {
  const t = useTranslations("Profile");

  return (
    <div className="w-full my-12">
      <div className="rounded-2xl border border-orange-200 bg-orange-50 p-6 flex flex-col gap-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {t("pro.title")}
          </h3>
          <p className="mt-1 text-sm text-gray-700">
            {t("pro.desc")}
          </p>
        </div>
        <Link
          href={`/${locale}/pro-signup`}
          className="w-fit mt-4 sm:mt-0 inline-block rounded-xl bg-orange-600 hover:bg-orange-700 px-4 py-2 text-white font-medium"
        >
          {t("pro.button")}
        </Link>
      </div>
    </div>
  );
}
