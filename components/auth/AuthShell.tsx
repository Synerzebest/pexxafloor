"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

export const authInputClass =
  "w-full rounded-xl border border-gray-300 bg-white py-2.5 text-gray-900 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-100";

export default function AuthShell({
  locale,
  title,
  subtitle,
  children,
  footer,
}: {
  locale: string;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const t = useTranslations("AuthShell");
  const benefits = t.raw("benefits") as string[];

  return (
    <div className="min-h-dvh bg-gray-50 lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      {/* Brand panel */}
      <aside className="relative hidden overflow-hidden lg:block">
        <Image
          src="/images/hero.png"
          alt=""
          fill
          priority
          sizes="45vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-gray-950/90 via-gray-900/75 to-orange-900/60" />

        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <Link href={`/${locale}`} className="w-fit">
            <Image src="/images/logo.png" alt="PexxaFloor" width={330} height={220} priority className="h-auto w-[260px] brightness-0 invert xl:w-[330px]" />
          </Link>

          <div className="max-w-md">
            <p className="text-3xl font-semibold leading-tight tracking-tight">{t("tagline")}</p>
            <ul className="mt-8 space-y-4">
              {benefits.map((benefit) => (
                <li key={benefit} className="flex items-start gap-3 text-white/85">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-orange-400" aria-hidden="true" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          <p className="text-sm text-white/50">© {new Date().getFullYear()} PexxaFloor</p>
        </div>
      </aside>

      {/* Form panel */}
      <main className="flex min-h-dvh flex-col px-4 py-4 sm:px-8 sm:py-6">
        <div className="flex shrink-0 items-center justify-between">
          <Link href={`/${locale}`} className="lg:hidden">
            <Image src="/images/logo.png" alt="PexxaFloor" width={210} height={140} priority className="h-auto w-[170px] sm:w-[210px]" />
          </Link>
          <Link
            href={`/${locale}`}
            className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            {t("backHome")}
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center py-4">
          <div className="w-full max-w-md">
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
              {title && (
                <div className="border-b border-gray-100 px-6 pb-5 pt-7 sm:px-8 sm:pt-8">
                  <h1 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">{title}</h1>
                  {subtitle && <p className="mt-2 text-sm text-gray-500">{subtitle}</p>}
                </div>
              )}
              <div className="px-6 py-6 sm:px-8">
                {children}
              </div>
            </div>
            {footer && <div className="mt-4 text-center text-sm text-gray-600">{footer}</div>}
          </div>
        </div>
      </main>
    </div>
  );
}

export function AuthDivider({ label }: { label: string }) {
  return (
    <div className="my-6 flex items-center gap-3" aria-hidden="true">
      <div className="h-px flex-1 bg-gray-200" />
      <span className="text-xs font-medium uppercase tracking-wider text-gray-400">{label}</span>
      <div className="h-px flex-1 bg-gray-200" />
    </div>
  );
}

export function GoogleButton({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-300 bg-white py-3 text-sm font-medium text-gray-700 shadow-sm transition hover:border-gray-400 hover:bg-gray-50"
    >
      <Image src="/images/google.png" alt="" width={18} height={18} />
      {label}
    </a>
  );
}

export function AuthAlert({ tone, children }: { tone: "error" | "success"; children: ReactNode }) {
  const styles =
    tone === "error"
      ? "border-red-200 bg-red-50 text-red-700"
      : "border-emerald-200 bg-emerald-50 text-emerald-800";
  return (
    <p role={tone === "error" ? "alert" : "status"} className={`rounded-xl border px-4 py-3 text-sm ${styles}`}>
      {children}
    </p>
  );
}
