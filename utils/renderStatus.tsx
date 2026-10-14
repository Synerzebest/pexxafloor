import { Tag } from "antd";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  InboxOutlined,
  CarOutlined,
  CloseCircleOutlined,
  DeliveredProcedureOutlined,
  CreditCardOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import React from "react";

type StatusKey =
  | "paid"
  | "preparing"
  | "verification"
  | "packed"
  | "ready"
  | "delivering"
  | "delivered"
  | "cancelled";

export const ORDER_STATUS_ORDER: StatusKey[] = [
  "paid", "preparing", "verification", "packed", "ready", "delivering", "delivered", "cancelled",
];

const STATUS_CONFIG: Record<
  StatusKey,
  { label: string; icon: React.ReactNode; bg: string; text: string; border: string }
> = {
  // First fulfilment step; whether the order is paid is shown by renderPaymentStatus
  paid: {
    label: "Confirmée",
    icon: <CheckCircleOutlined />,
    bg: "#f3f4f6",
    text: "#374151",
    border: "#d1d5db",
  },
  preparing: {
    label: "En préparation",
    icon: <ClockCircleOutlined />,
    bg: "#fef3c7",
    text: "#92400e",
    border: "#fde68a",
  },
  verification: {
    label: "En vérification",
    icon: <ClockCircleOutlined />,
    bg: "#ecfdf5",
    text: "#047857",
    border: "#a7f3d0",
  },
  packed: {
    label: "Emballée",
    icon: <InboxOutlined />,
    bg: "#ede9fe",
    text: "#4c1d95",
    border: "#ddd6fe",
  },
  ready: {
    label: "Prête",
    icon: <InboxOutlined />,
    bg: "#d1fae5",
    text: "#065f46",
    border: "#a7f3d0",
  },
  delivering: {
    label: "En livraison",
    icon: <CarOutlined />,
    bg: "#e0f2fe",
    text: "#1e3a8a",
    border: "#bfdbfe",
  },
  delivered: {
    label: "Livrée",
    icon: <DeliveredProcedureOutlined />,
    bg: "#f0fdf4",
    text: "#15803d",
    border: "#bbf7d0",
  },
  cancelled: {
    label: "Annulée",
    icon: <CloseCircleOutlined />,
    bg: "#f3f4f6",
    text: "#4b5563",
    border: "#e5e7eb",
  },
};

export const statusLabel = (status: string) =>
  STATUS_CONFIG[status as StatusKey]?.label ?? status;

// Smaller tag for dense tables. Kept separate from renderStatus, which antd calls as render(value, record).
export const renderStatusCompact = (status: string) => renderStatusTag(status, true);

export const renderStatus = (status: string) => renderStatusTag(status, false);

const renderStatusTag = (status: string, compact: boolean) => {
  const key = status.toLowerCase() as StatusKey;
  const cfg = STATUS_CONFIG[key];
  const sizeClass = compact ? "m-0 px-2 py-0.5 text-xs font-medium" : "uppercase px-3 py-1 text-sm font-semibold";

  if (!cfg)
    return (
      <Tag color="default" className={sizeClass}>
        {status}
      </Tag>
    );

  return (
    <Tag
      icon={cfg.icon}
      style={{
        backgroundColor: cfg.bg,
        color: cfg.text,
        borderColor: cfg.border,
      }}
      className={sizeClass}
    >
      {cfg.label}
    </Tag>
  );
};

export const renderPaymentStatus = (paid: boolean) => (
  <Tag
    icon={paid ? <CreditCardOutlined /> : <ExclamationCircleOutlined />}
    color={paid ? "success" : "error"}
    className="uppercase px-3 py-1 text-sm font-semibold"
  >
    {paid ? "Payée" : "Non payée"}
  </Tag>
);
