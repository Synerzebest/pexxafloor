import { Button, Image, InputNumber, Progress, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { BadgeCheck } from "lucide-react";
import type { StorekeeperProduct } from "@/types/StorekeeperProductType";

type Props = {
  products: StorekeeperProduct[];
  setProducts: (fn: (prev: StorekeeperProduct[]) => StorekeeperProduct[]) => void;
  onFinish: () => void;
  saving?: boolean;
};

export default function VerificationTable({ products, setProducts, onFinish, saving }: Props) {
  const update = (id: string, quantity: number) => setProducts((previous) =>
    previous.map((product) => product.id === id
      ? { ...product, verified_quantity: Math.max(0, Math.min(quantity, product.quantity_ordered)) }
      : product)
  );
  const completed = products.filter((product) => product.verified_quantity === product.quantity_ordered).length;
  const canFinish = products.length > 0 && completed === products.length;
  const percent = products.length ? Math.round((completed / products.length) * 100) : 0;

  const columns: ColumnsType<StorekeeperProduct> = [
    {
      title: "Produit",
      key: "product",
      render: (_, record) => <div className="flex min-w-60 items-center gap-3 py-1"><Image src={record.image || "/images/placeholder.png"} fallback="/images/placeholder.png" alt={record.description} width={60} height={60} preview={Boolean(record.image)} className="rounded-xl border border-slate-200 bg-white object-contain p-1" /><div><p className="font-semibold text-slate-900">{record.description}</p><p className="mt-1 font-mono text-xs text-slate-500">Réf. {record.reference || "—"}</p></div></div>,
    },
    { title: "Piquée", dataIndex: "picked_quantity", align: "center", render: (quantity) => <span className="font-bold text-slate-700">{quantity}</span> },
    {
      title: "Quantité vérifiée",
      key: "verified_quantity",
      render: (_, record) => <div className="flex items-center gap-2"><InputNumber min={0} max={record.quantity_ordered} value={record.verified_quantity ?? 0} onChange={(value) => update(record.id, value ?? 0)} className="w-20" /><Button onClick={() => update(record.id, record.quantity_ordered)}>Tout</Button>{record.verified_quantity === record.quantity_ordered && <BadgeCheck className="text-emerald-600" size={21} />}</div>,
    },
  ];

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-white px-5 py-4"><div className="flex items-center justify-between gap-4"><div><h2 className="font-bold text-slate-950">Double vérification</h2><p className="mt-1 text-sm text-slate-500">Recomptez chaque référence avant emballage.</p></div><span className="text-sm font-semibold text-slate-700">{completed}/{products.length}</span></div><Progress percent={percent} showInfo={false} strokeColor="#059669" className="mt-3" /></div>
      <Table rowKey="id" columns={columns} dataSource={products} pagination={false} scroll={{ x: 680 }} rowClassName={(record) => record.verified_quantity === record.quantity_ordered ? "bg-emerald-50/60" : ""} />
      <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs text-slate-500">{saving ? "Sauvegarde en cours…" : "La progression est sauvegardée automatiquement."}</p><Button type="primary" size="large" icon={<BadgeCheck size={18} />} disabled={!canFinish} loading={saving} onClick={onFinish}>Valider et emballer</Button></div>
    </section>
  );
}
