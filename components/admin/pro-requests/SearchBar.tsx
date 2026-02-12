'use client';

import { Input } from "antd";
import { useTranslations } from "next-intl";

export default function SearchBar({ search, setSearch }: { search: string; setSearch: (s: string) => void }) {
  const t = useTranslations("AdminPro");

  return (
    <div className="mb-6">
      <Input
        placeholder={t("searchPlaceholder")}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        allowClear
      />
    </div>
  );
}
