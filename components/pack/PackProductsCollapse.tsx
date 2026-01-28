"use client";

import { Collapse, InputNumber, Button } from "antd";
import Image from "next/image";

type Product = {
  id: string;
  description: string;
  price: number;
  image?: string;
};

type Props = {
  products: Product[];
  quantities: Record<string, number>;
  initialQuantities: Record<string, number>;
  setQuantities: React.Dispatch<
    React.SetStateAction<Record<string, number>>
  >;
};

export function PackProductsCollapse({
  products,
  quantities,
  initialQuantities,
  setQuantities,
}: Props) {
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-100">
      <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-3">
        Tout ce dont vous avez besoin pour votre surface !
      </h2>

      <Collapse
        className="border-none [&_.ant-collapse-item]:border-b [&_.ant-collapse-item-last]:border-b-0"
        accordion
        items={products.map((item) => {
          const qty = quantities[item.id] ?? 1;
          const isModified = initialQuantities[item.id] !== qty;

          return {
            key: item.id,

            /* =========================
               HEADER (label)
            ========================= */

            label: (
              <div className="flex items-center justify-between py-1">
                <div className="flex items-center gap-3">
                  <Image
                    src={item.image || "/images/box.png"}
                    alt={item.description}
                    width={30}
                    height={30}
                    className="rounded-md border border-gray-200"
                  />

                  <div>
                    <p className="font-medium text-gray-700 leading-tight">
                      {item.description}
                    </p>
                    <p className="text-xs text-gray-500">
                      Prix unitaire : {item.price.toFixed(2)} €
                    </p>
                  </div>
                </div>

                <p className="text-sm font-semibold text-gray-900 text-right">
                  <span
                    className={
                      isModified ? "text-orange-600" : "text-gray-900"
                    }
                  >
                    {qty}
                  </span>{" "}
                  x {item.price.toFixed(2)} € ={" "}
                  <span className="font-bold">
                    {(qty * item.price).toFixed(2)} €
                  </span>
                </p>
              </div>
            ),

            /* =========================
               CONTENU
            ========================= */

            children: (
              <div className="space-y-3 p-3 bg-gray-50 rounded-md">
                <p className="text-sm text-gray-600">
                  {item.description}
                </p>

                <div className="flex items-center gap-3">
                  <InputNumber
                    min={1}
                    value={qty}
                    onChange={(val) =>
                      setQuantities((prev) => ({
                        ...prev,
                        [item.id]: Math.ceil(Number(val) || 1),
                      }))
                    }
                    size="middle"
                    className="w-24"
                  />

                  {isModified && (
                    <Button
                      size="small"
                      type="default"
                      onClick={() =>
                        setQuantities((prev) => ({
                          ...prev,
                          [item.id]: initialQuantities[item.id],
                        }))
                      }
                      className="border-orange-400 text-orange-600 hover:border-orange-500 hover:text-orange-700"
                    >
                      Réinitialiser ({initialQuantities[item.id]})
                    </Button>
                  )}
                </div>
              </div>
            ),
          };
        })}
      />
    </div>
  );
}
