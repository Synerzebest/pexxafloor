import { Table, Button, InputNumber } from "antd";
import type { ColumnsType } from "antd/es/table";
import { StorekeeperProduct } from "@/types/StorekeeperProductType";

export default function PickingTable({
  products,
  setProducts,
  onFinish,
}: {
  products: StorekeeperProduct[];
  setProducts: (fn: (prev: StorekeeperProduct[]) => StorekeeperProduct[]) => void;
  onFinish: () => void;
}) {
  function updateQuantity(id: string, delta: number) {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              picked_quantity: Math.max(
                0,
                Math.min((p.picked_quantity ?? 0) + delta, p.quantity_ordered)
              ),
            }
          : p
      )
    );
  }

  function pick(id: string) {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isPicked: true } : p))
    );
  }

  function unpick(id: string) {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isPicked: false } : p))
    );
  }

  const columns: ColumnsType<StorekeeperProduct> = [
    {
      title: "Produit",
      dataIndex: "description",
      key: "description",
    },
    {
      title: "Quantité commandée",
      dataIndex: "quantity_ordered",
      key: "quantity_ordered",
    },
    {
      title: "Qté piquée",
      key: "picked_quantity",
      render: (_: unknown, record) => (
        <div className="flex items-center gap-2">
          {/* Bouton - */}
          <Button
            onClick={() => updateQuantity(record.id, -1)}
            disabled={record.isPicked}
          >
            –
          </Button>

          {/* Input */}
          <InputNumber
            min={0}
            max={record.quantity_ordered}
            disabled={record.isPicked}
            value={record.picked_quantity ?? 0}
            onChange={(v) =>
              setProducts((prev) =>
                prev.map((p) =>
                  p.id === record.id
                    ? { ...p, picked_quantity: v ?? 0 }
                    : p
                )
              )
            }
          />

          {/* Bouton + */}
          <Button
            onClick={() => updateQuantity(record.id, +1)}
            disabled={record.isPicked}
          >
            +
          </Button>

          {/* Valider / Dévalider */}
          {record.isPicked ? (
            <Button danger onClick={() => unpick(record.id)}>
              Dévalider
            </Button>
          ) : (
            <Button type="primary" onClick={() => pick(record.id)}>
              Valider
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <Table
        rowKey="id"
        columns={columns}
        dataSource={products}
        pagination={false}
        rowClassName={(record) => (record.isPicked ? "bg-green-50" : "")}
      />

      <div className="flex justify-end pt-4">
        <Button type="primary" onClick={onFinish}>
          Terminer le picking
        </Button>
      </div>
    </>
  );
}
