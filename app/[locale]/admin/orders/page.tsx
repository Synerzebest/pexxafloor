"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Table, Tag, Button, Modal, Card, Avatar, message, Select } from "antd";
import type { ColumnsType } from "antd/es/table";
import { Navbar, Footer } from "@/components";
import { useLocale } from "next-intl";
import { EyeOutlined, ReloadOutlined } from "@ant-design/icons";

const { Option } = Select;

type Order = {
  id: string;
  user_id: string;
  status: string;
  total: number;
  items: any;
  created_at: string;
};

export default function OrdersAdminPage() {
  const supabase = createClientComponentClient();
  const locale = useLocale();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Order | null>(null);
  const [validating, setValidating] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const filteredOrders = orders.filter((order) =>
    filterStatus === "all" ? true : order.status === filterStatus
  );

  // 🔁 Charger les commandes
  async function loadOrders() {
    setLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) console.error("Erreur fetch orders:", error);
    else setOrders(data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadOrders();
  }, []);

  // ✅ Nouvelle fonction : validation de commande
  const handleValidateOrder = async (orderId: string) => {
    try {
      setValidating(true);
      const res = await fetch("/api/orders/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: orderId }),
      });

      const data = await res.json();

      if (!res.ok) {
        message.error(data.error || "Erreur lors de la validation");
        return;
      }

      message.success("Commande validée avec succès ✅");

      // 🔄 Met à jour le state local instantanément
      setSelected((prev) => (prev ? { ...prev, status: "validated" } : prev));
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId ? { ...o, status: "validated" } : o
        )
      );
    } catch (err) {
      console.error(err);
      message.error("Erreur réseau");
    } finally {
      setValidating(false);
    }
  };

  const columns: ColumnsType<Order> = [
    {
      title: "ID",
      dataIndex: "id",
      render: (id) => <span className="font-mono text-gray-500">{id.slice(0, 8)}...</span>,
    },
    {
      title: "Utilisateur",
      dataIndex: "user_id",
      render: (u) => <span className="text-gray-800">{u.slice(0, 6)}...</span>,
    },
    {
      title: "Statut",
      dataIndex: "status",
      render: (status: string) => {
        const color =
          status === "paid"
            ? "green"
            : status === "pending"
            ? "orange"
            : status === "cancelled"
            ? "red"
            : status === "validated"
            ? "blue"
            : "default";
        return (
          <Tag color={color} className="uppercase px-3 py-1 text-sm font-semibold">
            {status}
          </Tag>
        );
      },
    },
    {
      title: "Total",
      dataIndex: "total",
      render: (t: number) => <b>{parseFloat(t.toString()).toFixed(2)} €</b>,
    },
    {
      title: "Date",
      dataIndex: "created_at",
      render: (d: string) => (
        <span className="text-gray-500">{new Date(d).toLocaleString(locale)}</span>
      ),
    },
    {
      title: "Actions",
      render: (_, record) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => setSelected(record)}
        >
          Détails
        </Button>
      ),
    },
  ];

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 py-10 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Commandes</h1>

            <div className="flex items-center gap-3">
              <Select
                value={filterStatus}
                onChange={(value) => setFilterStatus(value)}
                style={{ width: 180 }}
              >
                <Option value="all">Toutes</Option>
                <Option value="paid">Payées</Option>
                <Option value="validated">Validées</Option>
                <Option value="pending">En attente</Option>
                <Option value="cancelled">Annulées</Option>
              </Select>

              <Button
                icon={<ReloadOutlined />}
                onClick={loadOrders}
                loading={loading}
              >
                Recharger
              </Button>
            </div>
          </div>

          <Card className="shadow-md rounded-2xl">
            <Table
              dataSource={filteredOrders}
              rowKey="id"
              columns={columns}
              loading={loading}
              pagination={{ pageSize: 8 }}
            />
          </Card>

          <Modal
            open={!!selected}
            onCancel={() => setSelected(null)}
            footer={null}
            title={`Commande ${selected?.id.slice(0, 8)}...`}
            width={750}
          >
            {selected && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-500">Status</p>
                    <Tag
                      color={
                        selected.status === "paid"
                          ? "green"
                          : selected.status === "pending"
                          ? "orange"
                          : selected.status === "cancelled"
                          ? "red"
                          : "blue"
                      }
                    >
                      {selected.status.toUpperCase()}
                    </Tag>
                  </div>
                  <div>
                    <p className="text-gray-500">Total</p>
                    <p className="text-lg font-semibold">
                      {parseFloat(selected.total.toString()).toFixed(2)} €
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Utilisateur</p>
                    <p>{selected.user_id}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Date</p>
                    <p>{new Date(selected.created_at).toLocaleString(locale)}</p>
                  </div>
                </div>

                <h3 className="text-lg font-semibold mt-6 mb-2">Articles</h3>
                <div className="grid gap-3">
                {(typeof selected.items === "string"
                  ? JSON.parse(selected.items)
                  : selected.items
                ).map((item: any, idx: number) => (
                  <Card
                    key={idx}
                    className="border border-gray-100 shadow-sm hover:shadow-md transition rounded-xl"
                  >
                    {/* ---- PRODUIT SIMPLE ---- */}
                    {item.type === "product" ? (
                      <div className="flex items-center gap-4">
                        <Avatar
                          shape="square"
                          size={60}
                          src={item.product?.image || item.image || "/images/box.png"}
                          alt={item.product?.name || item.name}
                        />
                        <div>
                          <p className="font-medium">
                            {item.product?.name || item.name || "Produit"}
                          </p>
                          <p className="text-gray-500 text-sm">
                            {(item.product?.price || item.price)?.toFixed(2)} € ×{" "}
                            {item.quantity}
                          </p>
                        </div>
                      </div>
                    ) : (
                      /* ---- PACK ---- */
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-semibold text-lg text-orange-600">
                              Pack {item.slug}
                            </p>
                            <p className="text-gray-500 text-sm">
                              {item.surface} m² · pas {item.pasDePose} cm · {item.tuyauType}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">
                              {(item.total * (item.quantity ?? 1)).toFixed(2)} €
                            </p>
                          </div>
                        </div>

                        {/* Sous-produits du pack */}
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-sm font-medium mb-1 text-gray-700">
                            Produits inclus :
                          </p>
                          <ul className="ml-4 list-disc text-sm text-gray-600">
                            {item.products?.map((p: any) => (
                              <li key={p.id}>
                                {p.description} — {p.unit_price.toFixed(2)} €
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
                </div>

                {/* Bouton de validation */}
                {selected.status !== "validated" && (
                  <div className="flex justify-end pt-6">
                    <Button
                      type="primary"
                      loading={validating}
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => handleValidateOrder(selected.id)}
                    >
                      Valider la commande
                    </Button>
                  </div>
                )}
              </div>
            )}
          </Modal>
        </div>
      </div>
      <Footer />
    </>
  );
}
