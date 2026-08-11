"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";   // ⬅️ NEW
import { ProApplication } from "@/types/ProApplicationType";
import dayjs from "dayjs";
import { Tag, Spin } from "antd";
import { 
  CheckCircleOutlined, 
  ClockCircleOutlined, 
  StopOutlined 
} from "@ant-design/icons";
import { useTranslations } from "next-intl";

export default function UserProApplicationCard({ userId }: { userId: string }) {
  const t = useTranslations("ProApplicationCard");
  const supabase = createBrowserClient(                 // ⬅️ NEW API
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [app, setApp] = useState<ProApplication | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);

      const { data, error } = await supabase
        .from("pro_applications")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (!error) {
        setApp(data as ProApplication | null);
      }

      setLoading(false);
    }

    load();
  }, [userId]);

  const statusColors: Record<ProApplication["status"], string> = {
    PENDING: "default",
    IN_REVIEW: "processing",
    VERIFIED: "success",
    REJECTED: "error",
    SUSPENDED: "warning",
    REVISION: "purple",
  };

  const statusLabels: Record<ProApplication["status"], string> = {
    PENDING: t("statuses.pending"),
    IN_REVIEW: t("statuses.inReview"),
    VERIFIED: t("statuses.verified"),
    REJECTED: t("statuses.rejected"),
    SUSPENDED: t("statuses.suspended"),
    REVISION: t("statuses.revision"),
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-10">
        <Spin />
      </div>
    );
  }

  if (!app) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-700">
          {t("noApplication")}
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition p-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-lg font-semibold text-gray-900">
          {app.company_name}
        </h3>
        <Tag color={statusColors[app.status]}>
          {statusLabels[app.status]}
        </Tag>
      </div>

      <div className="mt-4 grid md:grid-cols-2 gap-x-6 gap-y-3 text-sm">
        <p>
          <span className="font-medium text-gray-700">{t("createdAt")} : </span>
          {dayjs(app.created_at).format("DD/MM/YYYY HH:mm")}
        </p>

        {app.verified_at && (
          <p>
            <span className="font-medium text-gray-700">{t("verifiedAt")} : </span>
            {dayjs(app.verified_at).format("DD/MM/YYYY HH:mm")}
          </p>
        )}

        <p>
          <span className="font-medium text-gray-700">{t("name")} : </span>
          {app.first_name} {app.last_name}
        </p>
        <p>
          <span className="font-medium text-gray-700">{t("email")} : </span>
          {app.email}
        </p>
        <p>
          <span className="font-medium text-gray-700">{t("phone")} : </span>
          {app.phone}
        </p>

        {app.whatsapp && (
          <p>
            <span className="font-medium text-gray-700">WhatsApp : </span>
            {app.whatsapp}
          </p>
        )}

        <p>
          <span className="font-medium text-gray-700">{t("businessType")} : </span>
          {app.business_type}
        </p>
        <p>
          <span className="font-medium text-gray-700">TVA : </span>
          {app.vat}
        </p>
      </div>

      <div className="mt-4 text-sm text-gray-600 border-t border-gray-100 pt-4">
        <p>
          <span className="font-medium text-gray-700">{t("address")} :</span>{" "}
          {app.address_line1}
          {app.address_line2 ? `, ${app.address_line2}` : ""},{" "}
          {app.postcode} {app.town}
          {app.county ? `, ${app.county}` : ""}
        </p>
      </div>

      {app.status === "VERIFIED" && (
        <div className="mt-6 flex items-center gap-2 rounded-xl bg-green-50 px-4 py-3 border border-green-200 text-green-700">
          <CheckCircleOutlined />
          <span>{t("messages.active")}</span>
        </div>
      )}

      {app.status === "PENDING" && (
        <div className="mt-6 flex items-center gap-2 rounded-xl bg-yellow-50 px-4 py-3 border border-yellow-200 text-yellow-700">
          <ClockCircleOutlined />
          <span>{t("messages.pending")}</span>
        </div>
      )}

      {app.status === "REJECTED" && (
        <div className="mt-6 flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 border border-red-200 text-red-700">
          <StopOutlined />
          <span>{t("messages.rejected")}</span>
        </div>
      )}
    </div>
  );
}
