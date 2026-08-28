"use client";

import { Link, usePathname } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  BadgePercent,
  FolderKanban,
  LayoutDashboard,
  Package,
  ShieldCheck,
  ShoppingBasket,
} from "lucide-react";

const items = [
  { href: "/admin", label: "dashboard", icon: LayoutDashboard },
  { href: "/admin/catalog", label: "catalog", icon: Package },
  { href: "/admin/pro-requests", label: "requests", icon: FolderKanban },
  { href: "/admin/orders", label: "orders", icon: ShoppingBasket },
  { href: "/admin/roles", label: "roles", icon: ShieldCheck },
  { href: "/admin/pro-discounts", label: "discounts", icon: BadgePercent },
] as const;

export default function AdminNavbar() {
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations("AdminNavigation");

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200/80 bg-white/90 shadow-[0_1px_12px_rgba(15,23,42,0.04)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center gap-5 px-4 sm:px-6 lg:px-8">
        <Link href="/admin" locale={locale} className="hidden shrink-0 items-center gap-2 py-3 sm:flex">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-orange-600 text-sm font-black text-white shadow-sm shadow-orange-200">P</span>
          <span className="leading-tight"><span className="block text-sm font-bold text-gray-950">PexxaFloor</span><span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-orange-600">Admin</span></span>
        </Link>

        <nav aria-label={t("ariaLabel")} className="min-w-0 flex-1 overflow-x-auto py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex min-w-max items-center gap-1 sm:justify-end">
            {items.map((item) => {
              const active = item.href === "/admin" ? pathname === item.href : pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  locale={locale}
                  aria-current={active ? "page" : undefined}
                  className={`group flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm font-semibold transition-colors ${active ? "bg-orange-600 text-white shadow-sm shadow-orange-200" : "text-gray-600 hover:bg-orange-50 hover:text-orange-700"}`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{t(item.label)}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </header>
  );
}
