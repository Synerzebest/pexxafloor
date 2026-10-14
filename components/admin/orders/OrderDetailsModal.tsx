"use client";

import { Modal, Popconfirm } from "antd";
import Image from "next/image";
import { ArrowLeftOutlined, ArrowRightOutlined, CreditCardOutlined, DownOutlined, UserOutlined } from "@ant-design/icons";
import { useState } from "react";
import { renderStatus, renderPaymentStatus, statusLabel } from "@/utils/renderStatus";
import { formatEuro } from "@/lib/pricing/vat";
import { useStoreData } from "@/context/StoreDataProvider";
import { Loader } from "@/components/ui/Loader";

import { getOrderMode, isOrderPaid, type Order } from "@/types/OrderType";
import type { ProductItem, PackItem, CartItem } from "@/context/CartContext";

type ProcessingState = {
  moving: boolean;
  paying: boolean;
};

type Props = {
  selected: Order | null;
  setSelected: (order: Order | null) => void;
  locale: string;
  processing: ProcessingState;
  moveOrderStatus: (order: Order, direction: "next" | "previous") => void;
  setOrderPaid: (id: string, paid: boolean) => void;
};

export function OrderDetailsModal({
  selected,
  setSelected,
  locale,
  processing,
  moveOrderStatus,
  setOrderPaid,
}: Props) {
  if (!selected) return null;

  // items peut être string -> JSON.parse
  const items: CartItem[] =
    typeof selected.items === "string"
      ? (JSON.parse(selected.items) as CartItem[])
      : (selected.items as CartItem[]);

  const paid = isOrderPaid(selected);
  const addressLine = [selected.address, [selected.postal_code, selected.city].filter(Boolean).join(" "), selected.country]
    .filter(Boolean)
    .join(", ");

  return (
    <Modal
      open={true}
      onCancel={() => setSelected(null)}
      footer={null}
      width={760}
      title={
        <div className="flex flex-wrap items-center gap-2 pr-6">
          <span className="font-mono">#{selected.id.slice(0, 8)}</span>
          {getOrderMode(selected) === "test" && (
            <span className="rounded bg-orange-100 px-1.5 py-0.5 text-[11px] font-semibold uppercase text-orange-700">Test</span>
          )}
          <span className="text-sm font-normal text-gray-400">
            {new Date(selected.created_at).toLocaleString(`${locale}-BE`, { dateStyle: "medium", timeStyle: "short" })}
          </span>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Status: one step back or forward along the workflow */}
        <StatusStepper order={selected} busy={processing.moving} onMove={(direction) => moveOrderStatus(selected, direction)} />

        {/* Summary bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-gray-50 px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            {renderPaymentStatus(paid)}
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Total TVAC</p>
            <p className="text-xl font-bold tabular-nums text-gray-900">{formatEuro(selected.total, locale)}</p>
          </div>
        </div>

        {/* Customer + payment */}
        <div className="grid gap-3 sm:grid-cols-2">
          <InfoCard icon={<UserOutlined />} title="Client">
            <p className="font-medium text-gray-900">{selected.company_name || selected.client_name || "—"}</p>
            {selected.company_name && selected.client_name && <p className="text-gray-600">{selected.client_name}</p>}
            {addressLine && <p className="mt-1 text-gray-500">{addressLine}</p>}
          </InfoCard>

          <InfoCard icon={<CreditCardOutlined />} title="Paiement">
            <p className={paid ? "font-medium text-emerald-700" : "font-medium text-red-600"}>
              {paid ? "Payée" : "Non payée"}
              {selected.paid_at && (
                <span className="font-normal text-gray-500">
                  {" "}· {new Date(selected.paid_at).toLocaleDateString(`${locale}-BE`)}
                </span>
              )}
            </p>
            <Popconfirm
              title={paid ? "Marquer comme non payée ?" : "Marquer comme payée ?"}
              okText="Confirmer"
              cancelText="Annuler"
              onConfirm={() => setOrderPaid(selected.id, !paid)}
            >
              <button
                type="button"
                disabled={processing.paying}
                className="mt-1 text-xs font-medium text-blue-600 hover:underline disabled:opacity-50"
              >
                {paid ? "Marquer non payée" : "Marquer payée"}
              </button>
            </Popconfirm>
          </InfoCard>
        </div>

        {/* Items */}
        <section>
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Articles · {items.length}
          </h3>
          <div className="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200">
            {items.map((item, idx) =>
              item.type === "product" ? (
                <ProductRow key={idx} item={item} locale={locale} />
              ) : (
                <PackRow key={idx} item={item} locale={locale} />
              )
            )}
          </div>
          <p className="mt-1.5 text-right text-xs text-gray-400">Prix des articles HTVA</p>
        </section>

      </div>
    </Modal>
  );
}

// Admin workflow path, one step at a time. "verification" is a storekeeper sub-step of preparing.
const ORDER_PATH = ["paid", "preparing", "packed", "ready", "delivering", "delivered"];
// Steps the customer is not emailed about (see CUSTOMER_EMAIL_STATUSES in lib/email/orderMessage.ts)
const INTERNAL_STATUSES = ["packed", "verification"];

function StatusStepper({
  order,
  busy,
  onMove,
}: {
  order: Order;
  busy: boolean;
  onMove: (direction: "next" | "previous") => void;
}) {
  const position = order.status === "verification" ? 1 : ORDER_PATH.indexOf(order.status);

  if (position < 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
        Statut « {statusLabel(order.status)} » : hors du parcours de commande.
      </div>
    );
  }

  const previous = order.status === "verification" ? "preparing" : ORDER_PATH[position - 1];
  const next = ORDER_PATH[position + 1];
  const arrowClass =
    "grid h-11 w-11 shrink-0 place-items-center rounded-full border transition disabled:cursor-not-allowed disabled:opacity-30";

  return (
    <div className="rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between gap-3">
        <Popconfirm
          title={`Revenir à « ${previous ? statusLabel(previous) : ""} » ?`}
          description="Aucun e-mail n’est envoyé au client."
          okText="Revenir"
          cancelText="Annuler"
          disabled={!previous || busy}
          onConfirm={() => onMove("previous")}
        >
          <button
            type="button"
            disabled={!previous || busy}
            aria-label={previous ? `Revenir à ${statusLabel(previous)}` : "Aucun statut précédent"}
            className={`${arrowClass} border-gray-300 bg-white text-gray-600 hover:border-gray-400 hover:bg-gray-50`}
          >
            <ArrowLeftOutlined />
          </button>
        </Popconfirm>

        <div className="flex min-w-0 flex-col items-center gap-1 text-center">
          {busy ? <Loader /> : renderStatus(order.status)}
          <span className="text-[11px] text-gray-400">
            {previous ? `← ${statusLabel(previous)}` : ""}
            {previous && next ? "  ·  " : ""}
            {next ? `${statusLabel(next)} →` : ""}
          </span>
        </div>

        <Popconfirm
          title={`Passer à « ${next ? statusLabel(next) : ""} » ?`}
          description={
            next && INTERNAL_STATUSES.includes(next)
              ? "Étape interne : aucun e-mail n’est envoyé au client."
              : "Le client sera prévenu par e-mail."
          }
          okText="Confirmer"
          cancelText="Annuler"
          disabled={!next || busy}
          onConfirm={() => onMove("next")}
        >
          <button
            type="button"
            disabled={!next || busy}
            aria-label={next ? `Passer à ${statusLabel(next)}` : "Dernier statut atteint"}
            className={`${arrowClass} border-orange-600 bg-orange-600 text-white hover:bg-orange-700`}
          >
            <ArrowRightOutlined />
          </button>
        </Popconfirm>
      </div>

      {/* Path overview */}
      <ol className="mt-4 flex items-start">
        {ORDER_PATH.map((step, index) => (
          <li key={step} className="flex flex-1 flex-col items-center gap-1">
            <div className="flex w-full items-center">
              <span className={`h-0.5 flex-1 ${index === 0 ? "bg-transparent" : index <= position ? "bg-orange-500" : "bg-gray-200"}`} />
              <span
                className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                  index < position ? "bg-orange-500" : index === position ? "bg-orange-600 ring-4 ring-orange-100" : "bg-gray-300"
                }`}
              />
              <span className={`h-0.5 flex-1 ${index === ORDER_PATH.length - 1 ? "bg-transparent" : index < position ? "bg-orange-500" : "bg-gray-200"}`} />
            </div>
            <span
              className={`hidden text-center text-[10px] leading-tight sm:block ${
                index === position ? "font-semibold text-gray-900" : "text-gray-400"
              }`}
            >
              {statusLabel(step)}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function InfoCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 p-3 text-sm">
      <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">
        {icon}
        {title}
      </p>
      {children}
    </div>
  );
}

function Thumb({ src, size }: { src?: string | null; size: number }) {
  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-lg border border-gray-100 bg-gray-50"
      style={{ width: size, height: size }}
    >
      <Image src={src || "/images/box.png"} alt="" fill sizes={`${size}px`} className="object-contain p-1" />
    </div>
  );
}

function ProductRow({ item, locale }: { item: ProductItem; locale: string }) {
  const price = item.product?.price ?? item.price ?? 0;
  return (
    <div className="flex items-center gap-3 p-3">
      <Thumb src={item.product?.image || item.image} size={56} />
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 font-medium text-gray-900">{item.product?.name || item.name}</p>
        <p className="text-xs text-gray-500 tabular-nums">
          {item.quantity} × {formatEuro(price, locale)}
          {(item.product?.reference || item.reference) && ` · Réf. ${item.product?.reference || item.reference}`}
        </p>
      </div>
      <p className="shrink-0 font-semibold tabular-nums text-gray-900">{formatEuro(price * item.quantity, locale)}</p>
    </div>
  );
}

function PackRow({ item, locale }: { item: PackItem; locale: string }) {
  const { getPackImage } = useStoreData();
  const [open, setOpen] = useState(false);
  const thumbnails = item.products.slice(0, 5);
  const hiddenCount = item.products.length - thumbnails.length;
  return (
    <div className="p-3">
      <div className="flex items-center gap-3">
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-gray-100">
          {getPackImage(item.slug) && (
            <Image src={getPackImage(item.slug)!} alt="" fill sizes="56px" className="object-cover" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-gray-900">
            Pack {item.slug}
            {item.quantity > 1 && <span className="font-normal text-gray-500"> × {item.quantity}</span>}
          </p>
          <p className="text-xs text-gray-500">
            {item.surface} m² · pas {item.pasDePose} cm · {item.tuyauType}
            {item.calepinage && " · calepinage"}
          </p>
        </div>
        <p className="shrink-0 font-semibold tabular-nums text-gray-900">
          {formatEuro(item.total * item.quantity, locale)}
        </p>
      </div>

      {/* Included products: collapsed by default to keep the modal short */}
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        className="mt-2 flex w-full items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-left transition hover:bg-gray-100"
      >
        <span className="flex shrink-0 -space-x-2">
          {thumbnails.map((p) => (
            <span
              key={p.id}
              className="relative h-7 w-7 overflow-hidden rounded-full border-2 border-white bg-white ring-1 ring-gray-200"
            >
              <Image src={p.image || "/images/box.png"} alt="" fill sizes="28px" className="object-contain p-0.5" />
            </span>
          ))}
          {hiddenCount > 0 && (
            <span className="grid h-7 w-7 place-items-center rounded-full border-2 border-white bg-gray-200 text-[10px] font-semibold text-gray-600">
              +{hiddenCount}
            </span>
          )}
        </span>
        <span className="flex-1 text-sm font-medium text-gray-700">
          {item.products.length} produit{item.products.length > 1 ? "s" : ""} inclus
        </span>
        <DownOutlined className={`text-xs text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
      <ul className="mt-2 grid gap-2 sm:grid-cols-2">
        {item.products.map((p) => (
          <li key={p.id} className="flex items-center gap-2 rounded-lg bg-gray-50 p-2">
            <Thumb src={p.image} size={40} />
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-xs font-medium leading-snug text-gray-800">{p.description}</p>
              <p className="text-[11px] text-gray-500 tabular-nums">
                × {item.quantities?.[p.id] ?? 1}
                {p.reference && ` · ${p.reference}`}
              </p>
            </div>
          </li>
        ))}
      </ul>
      )}
    </div>
  );
}
