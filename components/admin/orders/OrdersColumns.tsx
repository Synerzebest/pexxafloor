import { renderStatus } from "@/utils/renderStatus";
import { EyeOutlined } from "@ant-design/icons";
import type { Order } from "@/types/OrderType";
import type { ColumnsType } from "antd/es/table";

export const getOrdersColumns = (
  locale: string,
  setSelected: (order: Order) => void
): ColumnsType<Order> => [
  {
    title: "ID",
    dataIndex: "id",
    render: (id: string) => (
      <span className="font-mono text-gray-500">{id.slice(0, 8)}...</span>
    ),
  },
  {
    title: "Client",
    dataIndex: "client_name",
    render: (u: string) => <span>{u.slice(0, 6)}...</span>,
  },
  {
    title: "Statut",
    dataIndex: "status",
    render: renderStatus,
  },
  {
    title: "Total",
    dataIndex: "total",
    render: (t: number) => <b>{t.toFixed(2)} €</b>,
  },
  {
    title: "Date",
    dataIndex: "created_at",
    render: (d: string) => (
      <span>{new Date(d).toLocaleString(locale)}</span>
    ),
  },
  {
    title: "Actions",
    render: (_: unknown, record: Order) => (
      <button
        className="text-blue-600"
        onClick={() => setSelected(record)}
      >
        <EyeOutlined /> Détails
      </button>
    ),
  },
];
