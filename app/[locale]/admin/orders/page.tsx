"use client";

import { Navbar, Footer } from "@/components";
import { useState } from "react";
import { Table, Card, Select, Button } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import { useLocale } from "next-intl";
import { useOrdersAdmin } from "@/hooks/useOrdersAdmin";
import { getOrdersColumns } from "@/components/admin/orders/OrdersColumns";
import { OrderDetailsModal } from "@/components/admin/orders/OrderDetailsModal";
import Link from "next/link";

export default function OrdersAdminPage() {
  const locale = useLocale() as 'fr' | 'en' | 'nl';
  const {
    orders,
    loading,
    selected,
    setSelected,
    loadOrders,
    validateOrder,
    confirmOrder,
    readyOrder,
    finalizeOrder,
    processing,
  } = useOrdersAdmin(locale);

  const [filterStatus, setFilterStatus] = useState("all");

  const filtered = filterStatus === "all"
    ? orders
    : orders.filter((o) => o.status === filterStatus);

  return (
    <>
      <Navbar />

      <div className="absolute top-36 left-4">
        <Link
          href={`/${locale}/admin`}
          className="inline-flex items-center gap-2 text-orange-500 font-medium hover:text-orange-600 transition"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Retour au panneau d’administration
        </Link>
      </div>

      <div className="max-w-6xl mx-auto py-10 relative top-44">
        {/* Filtres */}
        <div className="flex justify-between mb-4">
          <Select value={filterStatus} onChange={setFilterStatus} style={{ width: 180 }}>
            <Select.Option value="all">Toutes</Select.Option>
            <Select.Option value="paid">Payées</Select.Option>
            <Select.Option value="preparing">En préparation</Select.Option>
            <Select.Option value="packed">Emballées</Select.Option>
            <Select.Option value="ready">Prêtes</Select.Option>
            <Select.Option value="delivering">En livraison</Select.Option>
            <Select.Option value="delivered">Livrées</Select.Option>
            <Select.Option value="cancelled">Annulées</Select.Option>
          </Select>

          <Button icon={<ReloadOutlined />} loading={loading} onClick={loadOrders}>
            Recharger
          </Button>
        </div>

        {/* Table */}
        <Card>
          <Table
            dataSource={filtered}
            columns={getOrdersColumns(locale, setSelected)}
            rowKey="id"
            loading={loading}
          />
        </Card>

        {/* Modal */}
        <OrderDetailsModal
          selected={selected}
          setSelected={setSelected}
          locale={locale}
          processing={processing}
          validateOrder={validateOrder}
          confirmOrder={confirmOrder}
          readyOrder={readyOrder}
          finalizeOrder={finalizeOrder}
        />
      </div>

      <div className="relative top-32">
        <Footer />
      </div>
    </>
  );
}
