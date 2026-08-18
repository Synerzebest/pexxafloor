import { Tag } from "antd";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  InboxOutlined,
  CarOutlined,
  CloseCircleOutlined,
  DeliveredProcedureOutlined,
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

const STATUS_CONFIG: Record<
  StatusKey,
  { label: string; icon: React.ReactNode; bg: string; text: string; border: string }
> = {
  paid: {
    label: "Payée",
    icon: <CheckCircleOutlined />,
    bg: "#e6f4ea",
    text: "#1a7f37",
    border: "#b5e0bb",
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

export const renderStatus = (status: string) => {
  const key = status.toLowerCase() as StatusKey;
  const cfg = STATUS_CONFIG[key];

  if (!cfg)
    return (
      <Tag color="default" className="uppercase px-3 py-1 text-sm font-semibold">
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
      className="uppercase px-3 py-1 text-sm font-semibold"
    >
      {cfg.label}
    </Tag>
  );
};
