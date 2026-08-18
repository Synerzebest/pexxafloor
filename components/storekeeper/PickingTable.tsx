import { Button, Image, InputNumber, Progress, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { Check, PackageCheck } from "lucide-react";
import type { StorekeeperProduct } from "@/types/StorekeeperProductType";

type Props = {
  products: StorekeeperProduct[];
  setProducts: (fn: (prev: StorekeeperProduct[]) => StorekeeperProduct[]) => void;
  onFinish: () => void;
  saving?: boolean;
};

export default function PickingTable({ products, setProducts, onFinish, saving }: Props) {
  const update = (id: string, quantity: number) => {
    setProducts((previous) => previous.map((product) =>
      product.id === id
        ? {
            ...product,
            picked_quantity: Math.max(0, Math.min(quantity, product.quantity_ordered)),
            isPicked: quantity === product.quantity_ordered ? product.isPicked : false,
          }
        : product
    ));
  };

  const validate = (id: string) => {
    setProducts((previous) => previous.map((product) =>
      product.id === id && product.picked_quantity === product.quantity_ordered
        ? { ...product, isPicked: true }
        : product
    ));
  };

  const completed = products.filter(
    (product) => product.isPicked && product.picked_quantity === product.quantity_ordered
  ).length;
  const canFinish = products.length > 0 && completed === products.length;
  const percent = products.length ? Math.round((completed / products.length) * 100) : 0;

  const columns: ColumnsType<StorekeeperProduct> = [
    {
      title: "Produit",
      key: "product",
      render: (_, record) => (
        <div className="flex min-w-60 items-center gap-3 py-1">
          <Image src={record.image || "/images/placeholder.png"} fallback="/images/placeholder.png" alt={record.description} width={60} height={60} preview={Boolean(record.image)} className="rounded-xl border border-slate-200 bg-white object-contain p-1" />
          <div className="min-w-0">
            <p className="font-semibold text-slate-900">{record.description}</p>
            <p className="mt-1 font-mono text-xs text-slate-500">Réf. {record.reference || "—"}</p>
          </div>
        </div>
      ),
    },
    {
      title: "À préparer",
      dataIndex: "quantity_ordered",
      align: "center",
      render: (quantity) => <span className="inline-flex min-w-10 justify-center rounded-full bg-slate-100 px-3 py-1 font-bold text-slate-800">{quantity}</span>,
    },
    {
      title: "Quantité piquée",
      key: "picked_quantity",
      render: (_, record) => (
        <div className="flex flex-wrap items-center gap-2">
          <InputNumber min={0} max={record.quantity_ordered} value={record.picked_quantity ?? 0} disabled={record.isPicked} onChange={(value) => update(record.id, value ?? 0)} className="w-20" />
          {!record.isPicked && (
            <Button onClick={() => update(record.id, record.quantity_ordered)}>Tout</Button>
          )}
          <Button type={record.isPicked ? "default" : "primary"} disabled={!record.isPicked && record.picked_quantity !== record.quantity_ordered} icon={<Check size={15} />} onClick={() => record.isPicked ? update(record.id, 0) : validate(record.id)}>
            {record.isPicked ? "Modifier" : "Valider"}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-5 py-4">
        <div className="flex items-center justify-between gap-4">
          <div><h2 className="font-bold text-slate-950">Préparation des produits</h2><p className="mt-1 text-sm text-slate-500">Comptez puis validez chaque référence.</p></div>
          <span className="text-sm font-semibold text-slate-700">{completed}/{products.length}</span>
        </div>
        <Progress percent={percent} showInfo={false} strokeColor="#ea580c" className="mt-3" />
      </div>
      <Table rowKey="id" columns={columns} dataSource={products} pagination={false} scroll={{ x: 760 }} rowClassName={(record) => record.isPicked ? "bg-emerald-50/60" : ""} />
      <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-slate-500">{saving ? "Sauvegarde en cours…" : "La progression est sauvegardée automatiquement."}</p>
        <Button type="primary" size="large" icon={<PackageCheck size={18} />} disabled={!canFinish} loading={saving} onClick={onFinish}>Passer à la vérification</Button>
      </div>
    </section>
  );
}
