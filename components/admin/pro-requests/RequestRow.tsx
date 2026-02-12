'use client';

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

import type { AppRow } from "@/types/AppRowType";
import type { ActionType } from "@/hooks/useProRequestsLogic";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { updateProApplication } from "./actionsUpdateProApplication";

import { StatusBadge } from "./StatusBadge";
import { RowActions } from "./RowActions";
import { DetailsRow } from "./DetailsRow";

type Props = {
  request: AppRow;
  open: boolean;
  toggle: () => void;
  busyId: string | null;
  act: (id: string, action: ActionType) => void;
  t: (key: string) => string;
};

export function RequestRow({
  request,
  open,
  toggle,
  busyId,
  act,
  t,
}: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);


  async function handleSave(updated: AppRow) {
    try {
      setSaving(true);
      setSaveError(null);
  
      await updateProApplication(updated.id, {
        first_name: updated.first_name,
        last_name: updated.last_name,
        email: updated.email,
        phone: updated.phone,
        whatsapp: updated.whatsapp,
        company_name: updated.company_name,
        vat: updated.vat,
        business_type: updated.business_type,
        address_line1: updated.address_line1,
        address_line2: updated.address_line2,
        town: updated.town,
        county: updated.county,
        postcode: updated.postcode,
      });
  
      setIsEditing(false);
      router.refresh();
  
    } catch (err: any) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  }    

  return (
    <>
      <tr className="border-t border-orange-100">
        {/* Entreprise */}
        <td className="px-3 py-3 align-top">
          <div className="font-medium text-gray-900">{request.company_name}</div>
          <div className="text-xs text-gray-600">{request.business_type}</div>
        </td>

        {/* Contact */}
        <td className="px-3 py-3 align-top">
          <div className="text-gray-900">
            {request.first_name} {request.last_name}
          </div>
          <div className="text-xs text-gray-600 truncate max-w-[160px]">
            {request.email}
          </div>
        </td>

        {/* Statut */}
        <td className="px-3 py-3 align-top">
          <StatusBadge
            status={request.status}
            label={t(`status.${request.status.toLowerCase()}`)}
          />
        </td>

        {/* Actions */}
        <td className="px-3 py-3 align-top">
          <div className="flex justify-end gap-2">
            {/* bouton détails */}
            <button
              onClick={toggle}
              className="inline-flex items-center gap-1 rounded-lg border border-orange-200 px-3 py-1.5 text-gray-800 hover:bg-orange-50"
            >
              {open ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">
                {open ? t("hide") : t("view")}
              </span>
            </button>

            {/* boutons status actions */}
            <RowActions
              status={request.status}
              id={request.id}
              busyId={busyId}
              act={act}
              t={t}
            />
          </div>
        </td>
      </tr>

      {open && (
        <DetailsRow
            request={request}
            isEditing={isEditing}
            onStartEdit={() => setIsEditing(true)}
            onCancel={() => setIsEditing(false)}
            onSave={handleSave}
            saving={saving}
            error={saveError}
            t={t}
        />
      )}
    </>
  );
}
