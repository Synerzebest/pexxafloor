'use client';

import { Fragment, useState } from "react";
import type { AppRow } from "@/types/AppRowType";
import type { ActionType } from "@/hooks/useProRequestsLogic";
import { RequestRow } from "./RequestRow";

type Props = {
  title: string;
  rows: AppRow[];
  busyId: string | null;
  act: (id: string, action: ActionType) => void;
  t: (key: string) => string;
};

export function RequestsSection({
  title,
  rows,
  busyId,
  act,
  t,
}: Props) {
  const [openRowId, setOpenRowId] = useState<string | null>(null);

  return (
    <section className="mt-8">
      <h2 className="mb-3 text-lg font-semibold text-gray-900">{title}</h2>

      <div className="overflow-x-auto rounded-xl border border-orange-100 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-orange-50 text-gray-700">
            <tr>
              <th className="px-3 py-2 text-left">{t("th.company")}</th>
              <th className="px-3 py-2 text-left">{t("th.contact")}</th>
              <th className="px-3 py-2 text-left">{t("th.status")}</th>
              <th className="px-3 py-2 text-right">{t("th.actions")}</th>
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 && (
              <tr>
                <td className="px-3 py-6 text-center text-gray-500" colSpan={4}>
                  {t("empty")}
                </td>
              </tr>
            )}

            {rows.map((r) => (
              <Fragment key={r.id}>
                <RequestRow
                  request={r}
                  open={openRowId === r.id}
                  toggle={() =>
                    setOpenRowId((prev) => (prev === r.id ? null : r.id))
                  }
                  busyId={busyId}
                  act={act}
                  t={t}
                />
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
