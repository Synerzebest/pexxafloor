"use client";

import { Input } from "antd";
import { SearchOutlined } from "@ant-design/icons";

export function normalizeCatalogSearch(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase()
    .trim();
}

export function matchesCatalogSearch(search: string, values: unknown[]) {
  const query = normalizeCatalogSearch(search);
  if (!query) return true;
  return normalizeCatalogSearch(values.filter(Boolean).join(" ")).includes(query);
}

export default function CatalogSearch({
  value,
  onChange,
  placeholder,
  resultCount,
  totalCount,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  resultCount: number;
  totalCount: number;
}) {
  return (
    <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <Input
        allowClear
        value={value}
        onChange={(event) => onChange(event.target.value)}
        prefix={<SearchOutlined className="text-gray-400" />}
        placeholder={placeholder}
        className="max-w-xl rounded-xl"
        size="large"
      />
      <span className="shrink-0 text-xs font-medium text-gray-500">
        {value.trim() ? `${resultCount} résultat${resultCount > 1 ? "s" : ""}` : `${totalCount} élément${totalCount > 1 ? "s" : ""}`}
      </span>
    </div>
  );
}
