"use client";

import { useEffect, useMemo, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Box,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Home,
  PackageCheck,
  ShoppingBag,
  Truck,
  XCircle,
} from "lucide-react";
import type { CartItem } from "@/context/CartContext";
import type { PackProduct } from "@/types/PackProductType";
import { useLocale, useTranslations } from "next-intl";
import { getPackImage } from "@/utils/getPackImage";

type Order = {
  id: string;
  status: string;
  total: number;
  items: CartItem[];
  created_at: string;
};

const statusStyles: Record<string, string> = {
  paid: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  preparing: "bg-amber-50 text-amber-700 ring-amber-200",
  packed: "bg-blue-50 text-blue-700 ring-blue-200",
  ready: "bg-cyan-50 text-cyan-700 ring-cyan-200",
  delivering: "bg-violet-50 text-violet-700 ring-violet-200",
  delivered: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  cancelled: "bg-red-50 text-red-700 ring-red-200",
};

function StatusIcon({ status }: { status: string }) {
  const className = "h-3.5 w-3.5";
  if (status === "cancelled") return <XCircle className={className} />;
  if (status === "preparing") return <Clock3 className={className} />;
  if (status === "packed" || status === "ready") return <PackageCheck className={className} />;
  if (status === "delivering") return <Truck className={className} />;
  return <CheckCircle2 className={className} />;
}

export default function UserOrders() {
  const locale = useLocale();
  const tc = useTranslations("Common");
  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      ),
    []
  );
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function fetchOrders() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (mounted) {
          setOrders([]);
          setLoading(false);
        }
        return;
      }

      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!error && data && mounted) setOrders(data as Order[]);
      if (mounted) setLoading(false);
    }

    fetchOrders();
    const { data: subscription } = supabase.auth.onAuthStateChange(fetchOrders);
    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, [supabase]);

  const formatPrice = (value: number) =>
    new Intl.NumberFormat(locale, { style: "currency", currency: "EUR" }).format(value);

  const statusLabel = (status: string) => {
    const knownStatuses = ["paid", "preparing", "packed", "ready", "delivering", "delivered", "cancelled"];
    return knownStatuses.includes(status) ? tc(`orderStatus.${status}`) : status;
  };

  return (
    <section className="mx-auto max-w-5xl">
      <div className="mb-7 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-600">
            PexxaFloor
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-gray-950 sm:text-3xl">
            {tc("myOrders")}
          </h2>
        </div>
        {!loading && orders.length > 0 && (
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
            {tc("orderCount", { count: orders.length })}
          </span>
        )}
      </div>

      {loading ? (
        <div className="space-y-4" aria-label={tc("loadingOrders")}>
          {[0, 1].map((item) => (
            <div key={item} className="h-40 animate-pulse rounded-2xl border border-gray-100 bg-gray-50" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-gray-200 bg-gray-50/70 px-6 py-12 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-white text-orange-500 shadow-sm ring-1 ring-gray-100">
            <ShoppingBag className="h-7 w-7" />
          </div>
          <h3 className="mt-5 text-lg font-semibold text-gray-900">{tc("noOrders")}</h3>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
            {tc("noOrdersDescription")}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const status = order.status.toLowerCase();
            return (
              <article key={order.id} className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:border-gray-300 hover:shadow-md">
                <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-orange-50 text-orange-600">
                      <Box className="h-6 w-6" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-950">
                        {tc("orderFrom", { date: new Date(order.created_at).toLocaleDateString(locale, { day: "2-digit", month: "long", year: "numeric" }) })}
                      </p>
                      <p className="mt-1 truncate text-xs text-gray-400">
                        {tc("orderNumber")} #{order.id.slice(0, 8).toUpperCase()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-4 sm:justify-end">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset ${statusStyles[status] || "bg-gray-50 text-gray-600 ring-gray-200"}`}>
                      <StatusIcon status={status} />
                      {statusLabel(status)}
                    </span>
                    <span className="text-xl font-bold tracking-tight text-gray-950">
                      {formatPrice(Number(order.total))}
                    </span>
                  </div>
                </div>

                <details className="group border-t border-gray-100">
                  <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 sm:px-6 [&::-webkit-details-marker]:hidden">
                    <span>{tc("viewItems")} · {tc("itemCount", { count: order.items.length })}</span>
                    <ChevronDown className="h-4 w-4 text-gray-400 transition-transform group-open:rotate-180" />
                  </summary>
                  <div className="space-y-3 bg-gray-50/70 px-4 pb-4 pt-1 sm:px-6 sm:pb-6">
                    {order.items.map((item, index) =>
                      item.type === "pack" ? (
                        <div key={`${item.id}-${index}`} className="rounded-xl border border-gray-100 bg-white p-4">
                          <div className="flex items-center gap-4">
                            <Image src={getPackImage(item.slug)} alt={`Pack ${item.slug}`} width={72} height={72} className="h-16 w-16 rounded-xl bg-gray-50 object-cover" />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="font-semibold text-gray-900">Pack {item.slug}</p>
                                  <p className="mt-1 text-xs text-gray-500">{item.surface} m² · {tc("installationSpacing")} {item.pasDePose} cm · {item.tuyauType}</p>
                                </div>
                                <p className="shrink-0 font-semibold text-gray-900">{formatPrice(item.total * item.quantity)}</p>
                              </div>
                            </div>
                          </div>
                          <div className="mt-4 border-t border-gray-100 pt-3">
                            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">{tc("includedProducts")}</p>
                            <div className="grid gap-2 sm:grid-cols-2">
                              {item.products?.map((product: PackProduct) => (
                                <div key={product.id} className="flex items-center gap-3 rounded-lg bg-gray-50 p-2.5">
                                  <Image src={product.image || "/images/box.png"} alt={product.description} width={44} height={44} className="h-11 w-11 shrink-0 rounded-lg bg-white object-contain" />
                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-medium text-gray-700">{product.description}</p>
                                    <p className="mt-0.5 text-xs text-gray-400">{tc("quantityShort")} {item.quantities?.[product.id] ?? 1}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div key={`${item.product_id}-${index}`} className="flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-4">
                          <Image src={item.product?.image || item.image || "/images/box.png"} alt={item.product?.name || item.name || tc("product")} width={64} height={64} className="h-16 w-16 shrink-0 rounded-xl bg-gray-50 object-contain" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-semibold text-gray-900">{item.product?.name || item.name || tc("product")}</p>
                            <p className="mt-1 text-sm text-gray-500">{tc("quantityShort")} {item.quantity}</p>
                          </div>
                          <p className="shrink-0 font-semibold text-gray-900">{formatPrice((item.product?.price ?? item.price ?? 0) * item.quantity)}</p>
                        </div>
                      )
                    )}
                  </div>
                </details>
              </article>
            );
          })}
        </div>
      )}

      <div className="mt-10 flex justify-center">
        <Link href={`/${locale}`} className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gray-950 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600">
          <Home className="h-4 w-4" />
          {tc("backHome")}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </section>
  );
}
