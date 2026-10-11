import { Tag } from "antd";
import type { OrderMode } from "@/types/OrderType";

const MODE_CONFIG: Record<OrderMode, { label: string; color: string }> = {
  live: { label: "Production", color: "green" },
  test: { label: "Test", color: "orange" },
  unknown: { label: "Inconnu", color: "default" },
};

export function renderOrderMode(mode: OrderMode) {
  const { label, color } = MODE_CONFIG[mode];
  return <Tag color={color}>{label}</Tag>;
}
