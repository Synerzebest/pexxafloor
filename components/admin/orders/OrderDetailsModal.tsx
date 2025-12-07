"use client";

import { Modal, Card, Avatar } from "antd";
import { renderStatus } from "@/utils/renderStatus";
import { Loader } from "@/components/ui/Loader";

import type { Order } from "@/types/OrderType";
import type { ProductItem, PackItem, CartItem } from "@/context/CartContext";

type ProcessingState = {
  validating: boolean;
  delivering: boolean;
  delivered: boolean;
};

type Props = {
  selected: Order | null;
  setSelected: (order: Order | null) => void;
  locale: string;
  processing: ProcessingState;
  validateOrder: (id: string) => void;
  confirmOrder: (id: string) => void;
  readyOrder: (id: string) => void;
  finalizeOrder: (id: string) => void;
};

export function OrderDetailsModal({
  selected,
  setSelected,
  locale,
  processing,
  validateOrder,
  confirmOrder,
  readyOrder,
  finalizeOrder,
}: Props) {
  if (!selected) return null;

  // items peut être string -> JSON.parse
  const items: CartItem[] =
    typeof selected.items === "string"
      ? (JSON.parse(selected.items) as CartItem[])
      : (selected.items as CartItem[]);

  return (
    <Modal
      open={true}
      onCancel={() => setSelected(null)}
      footer={null}
      width={750}
      title={`Commande ${selected.id.slice(0, 8)}...`}
    >
      <div className="space-y-4">
        {/* Infos générales */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-gray-500">Statut</p>
            {renderStatus(selected.status)}
          </div>

          <div>
            <p className="text-gray-500">Total</p>
            <p className="text-lg font-semibold">
              {selected.total.toFixed(2)} €
            </p>
          </div>

          <div>
            <p className="text-gray-500">Client</p>
            <p>{selected.client_name}</p>
            <p>{selected.address}</p>
          </div>

          <div>
            <p className="text-gray-500">Date</p>
            <p>{new Date(selected.created_at).toLocaleString(locale)}</p>
          </div>
        </div>

        {/* Articles */}
        <h3 className="text-lg font-semibold mt-6 mb-2">Articles</h3>
        <div className="grid gap-3">
          {items.map((item, idx) => (
            <Card
              key={idx}
              className="border border-gray-100 shadow-sm hover:shadow-md transition rounded-xl"
            >
              {/* PRODUIT SIMPLE */}
              {item.type === "product" ? (
                <ProductCard item={item} />
              ) : (
                <PackCard item={item} />
              )}
            </Card>
          ))}
        </div>

        {/* Actions selon statut */}
        {selected.status === "paid" && (
          <ActionButton
            disabled={processing.validating}
            onClick={() => validateOrder(selected.id)}
            label="Valider la commande"
            loading={processing.validating}
          />
        )}

        {selected.status === "packed" && (
          <ActionButton
            disabled={processing.validating}
            onClick={() => readyOrder(selected.id)}
            label="Passer en statut prête"
            loading={processing.validating}
          />
        )}

        {selected.status === "ready" && (
          <ActionButton
            disabled={processing.delivering}
            onClick={() => confirmOrder(selected.id)}
            label="Passer statut en livraison"
            loading={processing.delivering}
          />
        )}

        {selected.status === "delivering" && (
          <ActionButton
            disabled={processing.delivered}
            onClick={() => finalizeOrder(selected.id)}
            label="Passer statut en livrée"
            loading={processing.delivered}
          />
        )}
      </div>
    </Modal>
  );
}

function ProductCard({ item }: { item: ProductItem }) {
  const price = item.product?.price ?? item.price ?? 0;
  return (
    <div className="flex items-center gap-4">
      <Avatar
        shape="square"
        size={60}
        src={item.product?.image || item.image || "/images/box.png"}
      />
      <div>
        <p className="font-medium">{item.product?.name || item.name}</p>
        <p className="text-gray-500 text-sm">
          {price.toFixed(2)} € × {item.quantity}
        </p>
      </div>
    </div>
  );
}

function PackCard({ item }: { item: PackItem }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <div>
          <p className="font-semibold text-lg text-orange-600">Pack {item.slug}</p>
          <p className="text-gray-500 text-sm">
            {item.surface} m² · pas {item.pasDePose} cm · {item.tuyauType}
          </p>
        </div>
        <div className="text-right">
          <p className="font-semibold">{(item.total * item.quantity).toFixed(2)} €</p>
        </div>
      </div>

      {/* Produits inclus */}
      <div className="bg-gray-50 rounded-lg p-3">
        <p className="text-sm font-medium mb-1 text-gray-700">Produits inclus :</p>
        <ul className="ml-4 list-disc text-sm text-gray-600">
          {item.products.map((p) => (
            <li key={p.id}>
              {p.description} — {p.unit_price.toFixed(2)} €
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function ActionButton({
  disabled,
  loading,
  onClick,
  label,
}: {
  disabled: boolean;
  loading: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <div className="flex justify-end pt-6">
      <button
        disabled={disabled}
        onClick={onClick}
        className="px-4 py-1 text-white cursor-pointer rounded-lg bg-green-600 hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed duration-300 flex items-center gap-2"
      >
        {loading ? <Loader /> : label}
      </button>
    </div>
  );
}
