"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import type {
  PackQuoteAdditionalItem,
  PackQuoteDetails,
} from "@/context/QuoteContext";

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

const ADDITIONAL_ITEM_TYPES = [
  "Installation",
  "Étude de projet",
  "Préparation de chantier",
  "Déblayage des déchets de travaux",
  "Mise en service",
];

type EditableAdditionalItem = PackQuoteAdditionalItem & {
  type: string;
  customLabel: string;
};

function createAdditionalItem(): EditableAdditionalItem {
  return {
    id: crypto.randomUUID(),
    type: "Installation",
    label: "Installation",
    customLabel: "",
    amount: 0,
  };
}

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
  const [additionalItems, setAdditionalItems] = useState<EditableAdditionalItem[]>([]);

  useEffect(() => {
    if (!open) return;

    setProjectReference(initialDetails?.projectReference || "");
    setCustomerName(initialDetails?.customerName || "");
    setCustomerPhone(initialDetails?.customerPhone || "");
    setCustomerEmail(initialDetails?.customerEmail || "");
    setProjectType(initialDetails?.projectType || "");
    setAdditionalItems(
      (initialDetails?.additionalItems || []).map((item) => ({
        ...item,
        type: ADDITIONAL_ITEM_TYPES.includes(item.label) ? item.label : "Autre",
        customLabel: ADDITIONAL_ITEM_TYPES.includes(item.label) ? "" : item.label,
      }))
    );
  }, [open, initialDetails]);

  if (!open) return null;

  const canSave = projectReference.trim().length > 0 && !saving;

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/40 px-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-5 shadow-xl">
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

        <div className="mt-6 border-t border-gray-100 pt-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                Postes supplémentaires
              </h3>
              <p className="mt-1 text-xs text-gray-500">
                Ces montants ne sont pas concernés par la remise sur la fourniture.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                setAdditionalItems((items) => [...items, createAdditionalItem()])
              }
              className="inline-flex items-center gap-1.5 rounded-lg border border-orange-200 px-3 py-2 text-sm font-medium text-orange-700 hover:bg-orange-50"
            >
              <Plus className="h-4 w-4" /> Ajouter un poste
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {additionalItems.map((item) => (
              <div
                key={item.id}
                className="grid gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3 sm:grid-cols-[1fr_150px_auto]"
              >
                <div className="space-y-2">
                  <select
                    value={item.type}
                    onChange={(event) => {
                      const type = event.target.value;
                      setAdditionalItems((items) =>
                        items.map((current) =>
                          current.id === item.id
                            ? {
                                ...current,
                                type,
                                label: type === "Autre" ? current.customLabel : type,
                              }
                            : current
                        )
                      );
                    }}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                  >
                    {ADDITIONAL_ITEM_TYPES.map((type) => (
                      <option key={type}>{type}</option>
                    ))}
                    <option>Autre</option>
                  </select>
                  {item.type === "Autre" && (
                    <input
                      value={item.customLabel}
                      placeholder="Nom du poste"
                      onChange={(event) => {
                        const customLabel = event.target.value;
                        setAdditionalItems((items) =>
                          items.map((current) =>
                            current.id === item.id
                              ? { ...current, customLabel, label: customLabel }
                              : current
                          )
                        );
                      }}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                    />
                  )}
                </div>
                <label>
                  <span className="sr-only">Prix HTVA</span>
                  <div className="flex rounded-lg border border-gray-300 bg-white">
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={item.amount || ""}
                      placeholder="Prix HTVA"
                      onChange={(event) =>
                        setAdditionalItems((items) =>
                          items.map((current) =>
                            current.id === item.id
                              ? {
                                  ...current,
                                  amount: Math.max(
                                    0,
                                    Number(event.target.value) || 0
                                  ),
                                }
                              : current
                          )
                        )
                      }
                      className="min-w-0 flex-1 rounded-l-lg px-3 py-2 text-sm outline-none"
                    />
                    <span className="border-l border-gray-200 px-3 py-2 text-sm text-gray-500">
                      €
                    </span>
                  </div>
                </label>
                <button
                  type="button"
                  aria-label="Supprimer ce poste"
                  onClick={() =>
                    setAdditionalItems((items) =>
                      items.filter((current) => current.id !== item.id)
                    )
                  }
                  className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
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
                additionalItems: additionalItems
                  .filter((item) => item.label.trim() && item.amount > 0)
                  .map(({ id, label, amount }) => ({
                    id,
                    label: label.trim(),
                    amount,
                  })),
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
