"use client";

import { Navbar, Footer } from "@/components";
import { useState, useEffect } from "react";
import { Table, Select, Space, Tooltip, message } from "antd";
import { LucideShoppingBasket, ShoppingCart, Truck } from "lucide-react";
import { useStorekeeperOrders } from "@/hooks/useStorekeeperOrders";
import jsPDF from "jspdf";
import { addHeader, addProductsTable, addSignatureAndStampSection, addFooter } from "@/utils/pdfUtils";
import { renderStatus } from "@/utils/renderStatus";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { Order } from "@/types/OrderType";
import type { ColumnsType } from "antd/es/table";

const { Option } = Select;

export default function StorekeeperPage() {
  const router = useRouter();
  const locale = useLocale();

  const {
    orders,
    loading,
    loadOrders,
    markAsPacked,
  } = useStorekeeperOrders();

  const [statusFilter, setStatusFilter] = useState("preparing");

  useEffect(() => {
    loadOrders(statusFilter);
  }, [statusFilter]);

  function generateDeliveryNote(order: Order) {
    const doc = new jsPDF();
    try {
      addHeader(doc, order);
      addProductsTable(doc, order);
      addSignatureAndStampSection(doc);
      addFooter(doc);

      doc.save(`bon_livraison_${order.id.slice(0, 8)}.pdf`);
    } catch (err) {
      message.error("Erreur lors de la génération du PDF");
    }
  }

  const columns: ColumnsType<Order> = [
    {
      title: "N° Commande",
      dataIndex: "id",
      render: (id) => <span className="font-mono">{id.slice(0, 8)}...</span>,
    },
    {
      title: "Client",
      dataIndex: "client_name",
    },
    {
      title: "Statut",
      dataIndex: "status",
      render: renderStatus,
    },
    {
      title: "Total (€)",
      dataIndex: "total",
      render: (v) => Number(v).toFixed(2),
    },
    {
      title: "Date",
      dataIndex: "created_at",
      render: (d) => new Date(d).toLocaleString(),
    },
    {
      title: "Actions",
      render: (_, record) => (
        <Space>
          <Tooltip title="Piquer cette commande">
            <button
              className="bg-gray-100 text-gray-800 p-2 rounded-lg cursor-pointer"
              onClick={() => router.push(`/${locale}/storekeeper/${record.id}`)}
            >
              <LucideShoppingBasket size={20} />
            </button>
          </Tooltip>

          <Tooltip title="Piquer tout">
            <button
              className="bg-purple-500 text-white p-2 rounded-lg cursor-pointer"
              onClick={() => markAsPacked(record.id)}
            >
              <ShoppingCart size={20} />
            </button>
          </Tooltip>

          <Tooltip title="Bon de livraison">
            <button
              className="bg-gray-100 text-gray-800 p-2 rounded-lg cursor-pointer"
              onClick={() => generateDeliveryNote(record)}
            >
              <Truck size={20} />
            </button>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Navbar />
      <div className="p-6 relative top-28">
        <h1 className="text-2xl font-semibold mb-4">
          Commandes en préparation
        </h1>

        <Select
          value={statusFilter}
          onChange={setStatusFilter}
          style={{ width: 200 }}
        >
          <Option value="">Toutes</Option>
          <Option value="paid">Payées</Option>
          <Option value="preparing">En préparation</Option>
          <Option value="verification">En vérification</Option>
          <Option value="packed">Emballées</Option>
          <Option value="ready">Prêtes</Option>
          <Option value="delivering">En livraison</Option>
          <Option value="delivered">Livrées</Option>
          <Option value="cancelled">Annulées</Option>
        </Select>

        <Table
          loading={loading}
          dataSource={orders}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </div>
      <div className="relative top-36">
        <Footer />
      </div>
    </>
  );
}
