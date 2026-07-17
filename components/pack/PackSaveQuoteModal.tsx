"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import type { PackQuoteDetails } from "@/context/QuoteContext";

type Props = {
  open: boolean;
  initialDetails?: Partial<PackQuoteDetails>;
  saving?: boolean;
  onClose: () => void;
  onSave: (details: PackQuoteDetails) => void;
};

const PROJECT_TYPES = [
  { value: "", label: "Sélectionner" },
  { value: "maison", label: "Maison" },
  { value: "appartement", label: "Appartement" },
  { value: "bureaux", label: "Bureaux" },
  { value: "commerce", label: "Commerce" },
  { value: "autre", label: "Autre" },
];

export function PackSaveQuoteModal({
  open,
  initialDetails,
  saving = false,
  onClose,
  onSave,
}: Props) {
  const [projectReference, setProjectReference] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [projectType, setProjectType] = useState("");

  useEffect(() => {
    if (!open) return;

    setProjectReference(initialDetails?.projectReference || "");
    setCustomerName(initialDetails?.customerName || "");
    setCustomerPhone(initialDetails?.customerPhone || "");
    setCustomerEmail(initialDetails?.customerEmail || "");
    setProjectType(initialDetails?.projectType || "");
  }, [open, initialDetails]);

  if (!open) return null;

  const canSave = projectReference.trim().length > 0 && !saving;

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-xl rounded-xl bg-white p-5 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Enregistrer le devis
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Seule la référence du projet est obligatoire.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="sm:col-span-2">
            <span className="block text-sm font-medium text-gray-700">
              Référence du projet *
            </span>
            <input
              value={projectReference}
              onChange={(event) => setProjectReference(event.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
            />
          </label>

          <label>
            <span className="block text-sm font-medium text-gray-700">
              Nom du client
            </span>
            <input
              value={customerName}
              onChange={(event) => setCustomerName(event.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
            />
          </label>

          <label>
            <span className="block text-sm font-medium text-gray-700">
              N° de GSM
            </span>
            <input
              value={customerPhone}
              onChange={(event) => setCustomerPhone(event.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
            />
          </label>

          <label>
            <span className="block text-sm font-medium text-gray-700">
              Adresse email
            </span>
            <input
              type="email"
              value={customerEmail}
              onChange={(event) => setCustomerEmail(event.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
            />
          </label>

          <label>
            <span className="block text-sm font-medium text-gray-700">
              Type de projet
            </span>
            <select
              value={projectType}
              onChange={(event) => setProjectType(event.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
            >
              {PROJECT_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            type="button"
            disabled={!canSave}
            onClick={() =>
              onSave({
                projectReference: projectReference.trim(),
                customerName: customerName.trim() || undefined,
                customerPhone: customerPhone.trim() || undefined,
                customerEmail: customerEmail.trim() || undefined,
                projectType: projectType || undefined,
              })
            }
            className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  );
}
