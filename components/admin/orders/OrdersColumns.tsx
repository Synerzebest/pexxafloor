import { RightOutlined } from "@ant-design/icons";
import { renderStatusCompact } from "@/utils/renderStatus";
import { getOrderMode, isOrderPaid, type Order } from "@/types/OrderType";
import { formatEuro } from "@/lib/pricing/vat";
import type { ColumnsType } from "antd/es/table";

// Compact layout: related fields share a cell, the whole row opens the details
export const getOrdersColumns = (locale: string): ColumnsType<Order> => [
  {
    title: "Commande",
    key: "order",
    sorter: (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    defaultSortOrder: "descend",
    render: (_: unknown, order: Order) => (
      <div className="leading-tight">
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-xs font-semibold text-gray-700">#{order.id.slice(0, 8)}</span>
          {getOrderMode(order) === "test" && (
            <span className="rounded bg-orange-100 px-1 text-[10px] font-semibold uppercase text-orange-700">Test</span>
          )}
        </div>
        <div className="mt-0.5 text-xs text-gray-400">
          {new Date(order.created_at).toLocaleString(`${locale}-BE`, {
            day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit",
          })}
        </div>
      </div>
    ),
  },
  {
    title: "Client",
    key: "client",
    render: (_: unknown, order: Order) => (
      <div className="max-w-[220px] leading-tight">
        <div className="truncate font-medium text-gray-900">{order.company_name || order.client_name || "—"}</div>
        {order.company_name && order.client_name && (
          <div className="mt-0.5 truncate text-xs text-gray-500">{order.client_name}</div>
        )}
      </div>
    ),
  },
  {
    title: "Statut",
    key: "status",
    render: (_: unknown, order: Order) => {
      const paid = isOrderPaid(order);
      return (
        <div className="flex flex-col items-start gap-1">
          {renderStatusCompact(order.status)}
          <span className={`inline-flex items-center gap-1 text-xs font-medium ${paid ? "text-emerald-600" : "text-red-600"}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${paid ? "bg-emerald-500" : "bg-red-500"}`} />
            {paid ? "Payée" : "Non payée"}
          </span>
        </div>
      );
    },
  },
  {
    title: "Total TVAC",
    dataIndex: "total",
    align: "right",
    sorter: (a, b) => a.total - b.total,
    render: (total: number) => (
      <span className="whitespace-nowrap font-semibold tabular-nums text-gray-900">{formatEuro(total, locale)}</span>
    ),
  },
  {
    key: "open",
    width: 32,
    render: () => <RightOutlined className="text-xs text-gray-300" />,
  },
];
