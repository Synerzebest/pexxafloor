"use client";
import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Table, Tag } from "antd";
import dayjs from "dayjs";

export default function UserProApplications({ userId }: { userId: string }) {
  const supabase = createClientComponentClient();
  const [apps, setApps] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("pro_applications")
        .select("id,  company_name, status, created_at, verified_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (!error) setApps(data ?? []);
    }
    load();
  }, [userId]);

  const statusColors: Record<string, string> = {
    PENDING: "default",
    IN_REVIEW: "processing",
    VERIFIED: "success",
    REJECTED: "error",
    SUSPENDED: "warning",
    REVISION: "purple",
  };

  return (
    <Table
      rowKey="id"
      dataSource={apps}
      columns={[
        {
          title: "Demande",
          dataIndex: "company_name",
        },
        {
          title: "Statut",
          dataIndex: "status",
          render: (s: string) => (
            <Tag color={statusColors[s] || "blue"}>{s}</Tag>
          ),
        },
        {
          title: "Créée le",
          dataIndex: "created_at",
          render: (date: string) =>
            date ? dayjs(date).format("DD/MM/YYYY HH:mm") : "-",
        },
        {
          title: "Vérifiée le",
          dataIndex: "verified_at",
          render: (date: string) =>
            date ? dayjs(date).format("DD/MM/YYYY HH:mm") : "-",
        },
      ]}
    />
  );
}
