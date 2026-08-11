"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import {
  ArrowRight,
  BadgePercent,
  FilePenLine,
  Layers3,
  Truck,
} from "lucide-react";

const cards = [
  {
    key: "delivery",
    href: null,
    icon: Truck,
    accent: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    featured: false,
  },
  {
    key: "quote",
    href: "quote",
    icon: FilePenLine,
    accent: "bg-orange-50 text-orange-700 ring-orange-100",
    featured: false,
  },
  {
    key: "installation",
    href: "quote",
    icon: Layers3,
    accent: "bg-sky-50 text-sky-700 ring-sky-100",
    featured: false,
  },
  {
    key: "pro",
    href: "pro-signup",
    icon: BadgePercent,
    accent: "bg-slate-800 text-white ring-slate-700",
    featured: true,
  },
] as const;

export default function HomeInfoSidebar() {
  const locale = useLocale();
  const t = useTranslations("HomeInfoSidebar");

  return (
    <aside
      className="mx-auto w-full max-w-xl lg:mx-0 lg:max-w-none"
      aria-label={t("ariaLabel")}
    >
      <div className="mb-5 flex items-center gap-3">
        <span className="h-px flex-1 bg-gray-200" />
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
          {t("eyebrow")}
        </p>
        <span className="h-px flex-1 bg-gray-200" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
        {cards.map(({ key, href, icon: Icon, accent, featured }) => {
          const content = (
            <>
              <div className="flex items-start justify-between gap-3">
                <span
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 ${accent}`}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                {href && (
                  <ArrowRight
                    className={`h-4 w-4 transition-transform group-hover:translate-x-1 ${
                      featured ? "text-white/60" : "text-gray-400"
                    }`}
                    aria-hidden="true"
                  />
                )}
              </div>

              <div className="mt-5">
                <h3
                  className={`text-lg font-bold leading-snug ${
                    featured ? "text-white" : "text-gray-900"
                  }`}
                >
                  {t(`${key}.title`)}
                </h3>
                <p
                  className={`mt-2 text-sm leading-relaxed ${
                    featured ? "text-slate-300" : "text-gray-500"
                  }`}
                >
                  {t(`${key}.description`)}
                </p>
              </div>

              {href && (
                <span
                  className={`mt-5 inline-flex items-center gap-1.5 text-sm font-semibold ${
                    featured ? "text-orange-300" : "text-orange-600"
                  }`}
                >
                  {t(`${key}.cta`)}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </span>
              )}
            </>
          );

          const className = `group block overflow-hidden rounded-2xl border p-5 shadow-sm transition duration-300 ${
            featured
              ? "border-slate-700 bg-slate-900 hover:-translate-y-0.5 hover:shadow-lg"
              : "border-gray-200 bg-white hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-md"
          }`;

          return href ? (
            <Link key={key} href={`/${locale}/${href}`} className={className}>
              {content}
            </Link>
          ) : (
            <article key={key} className={className}>
              {content}
            </article>
          );
        })}
      </div>
    </aside>
  );
}
