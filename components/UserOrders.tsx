"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { List, Card, Tag, Collapse, Spin, Empty } from "antd";
import {
  ShoppingOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  AppstoreOutlined,
} from "@ant-design/icons";

type Order = {
  id: string;
  status: string;
  total: number;
  items: any[];
  created_at: string;
};

export default function UserOrders() {
  const supabase = createClientComponentClient();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrders() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setOrders([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!error && data) setOrders(data as Order[]);
      setLoading(false);
    }

    fetchOrders();
  }, [supabase]);

  const renderStatus = (status: string) => {
    switch (status) {
      case "paid":
        return (
          <Tag icon={<CheckCircleOutlined />} color="success">
            Payée
          </Tag>
        );
      case "pending":
        return (
          <Tag icon={<ClockCircleOutlined />} color="warning">
            En attente
          </Tag>
        );
      case "cancelled":
        return (
          <Tag icon={<CloseCircleOutlined />} color="error">
            Annulée
          </Tag>
        );
      default:
        return <Tag color="default">{status}</Tag>;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Spin size="large" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <Empty
        description="Aucune commande pour le moment"
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        style={{ marginTop: 40 }}
      />
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Mes commandes</h2>

      <List
        grid={{ gutter: 16, column: 1 }}
        dataSource={orders}
        renderItem={(o) => (
          <List.Item>
            <Card
              title={
                <div className="flex justify-between items-center">
                  <span>
                    <ShoppingOutlined className="mr-2 text-orange-500" />
                    Commande du {new Date(o.created_at).toLocaleDateString()}
                  </span>
                  <div className="flex items-center gap-3">
                    {renderStatus(o.status)}
                    <span className="font-bold text-lg">
                      {o.total.toFixed(2)} €
                    </span>
                  </div>
                </div>
              }
            >
              <Collapse
                ghost
                items={[
                  {
                    key: "1",
                    label: "Voir les articles",
                    children: (
                      <List
                        dataSource={o.items}
                        renderItem={(item: any, idx: number) => (
                          <List.Item>
                            {item.type === "pack" ? (
                              <div className="w-full">
                                <div className="flex justify-between items-center">
                                  <span className="font-semibold">
                                    <AppstoreOutlined className="mr-1 text-orange-500" />
                                    Pack {item.slug} — {item.surface} m², pas{" "}
                                    {item.pasDePose} cm, {item.tuyauType}
                                  </span>
                                  <span className="font-medium">
                                    {(item.total * item.quantity).toFixed(2)} €
                                  </span>
                                </div>

                                {/* Sous-produits du pack */}
                                <Collapse
                                  size="small"
                                  className="mt-2"
                                  items={[
                                    {
                                      key: `sub-${idx}`,
                                      label: `${item.products?.length || 0} produits inclus`,
                                      children: (
                                        <ul className="ml-5 list-disc text-sm text-gray-700">
                                          {item.products?.map((p: any) => (
                                            <li key={p.id}>
                                              {p.description} —{" "}
                                              {p.unit_price.toFixed(2)} €
                                            </li>
                                          ))}
                                        </ul>
                                      ),
                                    },
                                  ]}
                                />
                              </div>
                            ) : (
                              <div className="flex justify-between w-full">
                                <span>
                                  {item.product?.name ||
                                    item.name ||
                                    "Produit"}{" "}
                                  × {item.quantity}
                                </span>
                                <span className="font-medium">
                                  {(
                                    (item.product?.price || item.price) *
                                    item.quantity
                                  ).toFixed(2)}{" "}
                                  €
                                </span>
                              </div>
                            )}
                          </List.Item>
                        )}
                      />
                    ),
                  },
                ]}
              />
            </Card>
          </List.Item>
        )}
      />
    </div>
  );
}
