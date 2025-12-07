import { Table, Button, InputNumber } from "antd";
import type { ColumnsType } from "antd/es/table";
import { StorekeeperProduct } from "@/types/StorekeeperProductType";

export default function VerificationTable({
  products,
  setProducts,
  onFinish,
}: {
  products: StorekeeperProduct[];
  setProducts: (fn: (prev: StorekeeperProduct[]) => StorekeeperProduct[]) => void;
  onFinish: () => void;
}) {
  function updateQuantity(
    id: string,
    key: "picked_quantity" | "verified_quantity",
    delta: number
  ) {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              [key]: Math.max(
                0,
                Math.min((p[key] ?? 0) + delta, p.quantity_ordered)
              ),
            }
          : p
      )
    );
  }

  // -------------------------
  //   COLUMNS TYPÉES
  // -------------------------
  const columns: ColumnsType<StorekeeperProduct> = [
    {
      title: "Produit",
      dataIndex: "description",
      key: "description",
    },
    {
      title: "Qté commandée",
      dataIndex: "quantity_ordered",
      key: "quantity_ordered",
    },
    {
      title: "Qté piquée",
      key: "picked_quantity",
      render: (_: unknown, record) => (
        <div className="flex items-center gap-2">
          <Button
            onClick={() => updateQuantity(record.id, "picked_quantity", -1)}
          >
            –
          </Button>

          <InputNumber
            min={0}
            max={record.quantity_ordered}
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

          <Button
            onClick={() => updateQuantity(record.id, "picked_quantity", +1)}
          >
            +
          </Button>
        </div>
      ),
    },
    {
      title: "Qté vérifiée",
      key: "verified_quantity",
      render: (_: unknown, record) => (
        <div className="flex items-center gap-2">
          <Button
            onClick={() => updateQuantity(record.id, "verified_quantity", -1)}
          >
            –
          </Button>

          <InputNumber
            min={0}
            max={record.quantity_ordered}
            value={record.verified_quantity ?? 0}
            onChange={(v) =>
              setProducts((prev) =>
                prev.map((p) =>
                  p.id === record.id
                    ? { ...p, verified_quantity: v ?? 0 }
                    : p
                )
              )
            }
          />

          <Button
            onClick={() => updateQuantity(record.id, "verified_quantity", +1)}
          >
            +
          </Button>
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
      />

      <div className="flex justify-end pt-4">
        <Button type="primary" onClick={onFinish}>
          Terminer la vérification
        </Button>
      </div>
    </>
  );
}
