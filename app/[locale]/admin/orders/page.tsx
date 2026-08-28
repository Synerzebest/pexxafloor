"use client";

import { Footer } from "@/components";
import { useState } from "react";
import { Table, Card, Select, Button, Input } from "antd";
import { ReloadOutlined, SearchOutlined } from "@ant-design/icons";
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
  const [search, setSearch] = useState("");

  const normalizedSearch = search.trim().toLocaleLowerCase();
  const filtered = orders.filter((order) => {
    const matchesStatus = filterStatus === "all" || order.status === filterStatus;
    const matchesSearch = !normalizedSearch || order.company_name
      ?.toLocaleLowerCase()
      .includes(normalizedSearch);
    return matchesStatus && matchesSearch;
  });

  return (
    <>
      <div className="mx-auto max-w-6xl px-4 py-10">
        {/* Filtres */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            allowClear
            prefix={<SearchOutlined />}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher par nom d’entreprise…"
            className="sm:max-w-sm"
          />
          <Select value={filterStatus} onChange={setFilterStatus} className="w-full sm:w-48">
            <Select.Option value="all">Toutes</Select.Option>
            <Select.Option value="paid">Payées</Select.Option>
            <Select.Option value="preparing">En préparation</Select.Option>
            <Select.Option value="verification">En vérification</Select.Option>
            <Select.Option value="packed">Emballées</Select.Option>
            <Select.Option value="ready">Prêtes</Select.Option>
            <Select.Option value="delivering">En livraison</Select.Option>
            <Select.Option value="delivered">Livrées</Select.Option>
            <Select.Option value="cancelled">Annulées</Select.Option>
          </Select>

          <Button className="sm:ml-auto" icon={<ReloadOutlined />} loading={loading} onClick={loadOrders}>
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
