'use client';

import { useEffect, useState } from "react";
import {
  User,
  Mail,
  Phone,
  Building2,
  Factory,
  MapPin,
  MessageCircleMore,
  HandCoins
} from "lucide-react";
import { Status } from "@/types/StatusType";


export type AppRow = {
    id: string;
    created_at: string;
    status: Status;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    whatsapp: string | null;
    company_name: string;
    vat: string | null;
    business_type: string;
    address_line1: string | null;
    address_line2: string | null;
    town: string | null;
    county: string | null;
    postcode: string | null;
  };

type Props = {
  request: AppRow;
  isEditing: boolean;
  onStartEdit: () => void;
  onCancel: () => void;
  onSave: (data: AppRow) => void;
  t: (key: string) => string;
  saving: boolean;
  error: string | null;
};

export function DetailsRow({
  request,
  isEditing,
  onStartEdit,
  onCancel,
  onSave,
  saving,
  error,
  t,
}: Props) {

  const [formData, setFormData] = useState<AppRow>(request);

  useEffect(() => {
    setFormData(request);
  }, [request]);

  function update<K extends keyof AppRow>(key: K, value: AppRow[K]) {
    setFormData(prev => ({ ...prev, [key]: value }));
  }

  function Field({
    label,
    icon,
    value,
    children,
  }: {
    label: string;
    icon?: React.ReactNode;
    value?: string | null;
    children?: React.ReactNode;
  }) {
    return (
      <div>
        <div className="text-xs font-medium text-gray-600 flex gap-1 items-center">
          {icon}
          {label}
        </div>
        {children ? (
          children
        ) : (
          <div className="text-gray-900">
            {value || "-"}
          </div>
        )}
      </div>
    );
  }

  function Input({
    name,
  }: {
    name: keyof AppRow;
  }) {
    return (
      <input
        className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
        value={(formData[name] as string) ?? ""}
        onChange={(e) => update(name, e.target.value)}
      />
    );
  }

  return (
    <tr className="border-t border-orange-100 bg-orange-50/40">
      <td colSpan={4} className="px-4 py-4">

        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 text-sm">

          <Field
            label={t("labels.name")}
            icon={<User className="w-3.5 h-3.5" />}
          >
            {isEditing ? (
              <div className="flex flex-col gap-1">
                <Input name="first_name" />
                <Input name="last_name" />
              </div>
            ) : (
              <div className="text-gray-900">
                {request.first_name} {request.last_name}
              </div>
            )}
          </Field>

          <Field
            label={t("labels.email")}
            icon={<Mail className="w-3.5 h-3.5" />}
          >
            {isEditing ? (
              <Input name="email" />
            ) : (
              request.email
            )}
          </Field>

          <Field
            label={t("labels.phone")}
            icon={<Phone className="w-3.5 h-3.5" />}
          >
            {isEditing ? (
              <Input name="phone" />
            ) : (
              request.phone
            )}
          </Field>

          {request.whatsapp && (
            <Field
              label="WhatsApp"
              icon={<MessageCircleMore className="w-3.5 h-3.5" />}
            >
              {isEditing ? (
                <Input name="whatsapp" />
              ) : (
                request.whatsapp
              )}
            </Field>
          )}

          <Field
            label={t("labels.company")}
            icon={<Building2 className="w-3.5 h-3.5" />}
          >
            {isEditing ? (
              <Input name="company_name" />
            ) : (
              request.company_name
            )}
          </Field>

          {request.vat && (
            <Field
              label={t("labels.vat")}
              icon={<HandCoins className="w-3.5 h-3.5" />}
            >
              {isEditing ? (
                <Input name="vat" />
              ) : (
                request.vat
              )}
            </Field>
          )}

          <Field
            label={t("labels.type")}
            icon={<Factory className="w-3.5 h-3.5" />}
          >
            {isEditing ? (
              <Input name="business_type" />
            ) : (
              request.business_type
            )}
          </Field>

          {/* Address full width */}
          <div className="sm:col-span-2 md:col-span-3">
            <Field
              label={t("labels.address")}
              icon={<MapPin className="w-3.5 h-3.5" />}
            >
              {isEditing ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  <Input name="address_line1" />
                  <Input name="address_line2" />
                  <Input name="postcode" />
                  <Input name="town" />
                  <Input name="county" />
                </div>
              ) : (
                <div className="text-gray-900">
                  {request.address_line1 || "-"}
                  {request.address_line2 && `, ${request.address_line2}`}
                  {", "}
                  {request.postcode || ""} {request.town || ""}
                  {request.county && `, ${request.county}`}
                </div>
              )}
            </Field>
          </div>

          <Field
            label={t("labels.created")}
            value={new Date(request.created_at).toLocaleString()}
          />

          <Field
            label={t("labels.status")}
            value={t(`status.${request.status.toLowerCase()}`)}
          />

        </div>

        {/* Buttons */}
        <div className="mt-6 flex gap-3">
          {isEditing ? (
            <>
              <button
                onClick={() => onSave(formData)}
                type="button"
                disabled={saving}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700"
              >
                {t("save")}
              </button>

              <button
                onClick={onCancel}
                type="button"
                className="rounded-lg bg-gray-200 px-4 py-2 hover:bg-gray-300"
              >
                {t("cancel")}
              </button>
              {error && (
                <p className="text-sm text-red-600 mt-2">
                    {error}
                </p>
               )}
            </>
          ) : (
            <button
              onClick={onStartEdit}
              className="rounded-lg border border-orange-200 px-4 py-2 hover:bg-orange-50"
            >
              {t("edit")}
            </button>
          )}
        </div>

      </td>
    </tr>
  );
}
