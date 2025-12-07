"use client";

import { Navbar, Footer } from "@/components";
import { useState } from "react";
import { Table, Card, Select, Button } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import { useLocale } from "next-intl";
import { useOrdersAdmin } from "@/hooks/useOrdersAdmin";
import { getOrdersColumns } from "@/components/admin/orders/OrdersColumns";
import { OrderDetailsModal } from "@/components/admin/orders/OrderDetailsModal";

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

      <div className="max-w-6xl mx-auto py-10">
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

      <Footer />
    </>
  );
}
