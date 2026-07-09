"use client";

import { useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { X } from "lucide-react";
import type { PackQuoteDraft } from "@/context/QuoteContext";
import { sanitizeForPDF as s } from "@/utils/sanitize";

type ShareLine = {
  id: string;
  description: string;
  quantity: number;
  reference?: string | null;
  proUnitPrice: number;
  customerUnitPrice: number;
  proTotal: number;
  customerTotal: number;
  discountPercent: number;
};

type SharePricing = {
  packName: string;
  projectReference?: string | null;
  lines: ShareLine[];
  proTotal: number;
  customerTotal: number;
  margin: number;
};

type ShareMode = "pro" | "customer";

type Props = {
  open: boolean;
  draft: PackQuoteDraft;
  onClose: () => void;
};

function formatPrice(value: number) {
  return new Intl.NumberFormat("fr-BE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function buildQuotePdf({
  pricing,
  mode,
  customerDiscount,
}: {
  pricing: SharePricing;
  mode: ShareMode;
  customerDiscount: number;
}) {
  const doc = new jsPDF();
  const isCustomer = mode === "customer";
  const title = isCustomer ? "DEVIS PARTICULIER" : "DEVIS PRO";
  const discountRate = isCustomer ? customerDiscount / 100 : 0;
  const lines = pricing.lines.map((line) => {
    const unitPrice = isCustomer ? line.customerUnitPrice * (1 - discountRate) : line.proUnitPrice;
    const total = unitPrice * line.quantity;

    return [
      s(line.reference || "-"),
      s(line.description),
      s(String(line.quantity)),
      s(`${formatPrice(unitPrice)} EUR`),
      s(`${formatPrice(total)} EUR`),
    ];
  });

  const totalHTVA = isCustomer
    ? pricing.customerTotal * (1 - discountRate)
    : pricing.proTotal;
  const totalTVAC = totalHTVA * 1.21;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(s("PexxaFloor"), 14, 18);

  doc.setFontSize(14);
  doc.text(s(title), 14, 32);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(s(`Pack : ${pricing.packName}`), 14, 42);
  doc.text(s(`Reference projet : ${pricing.projectReference || "-"}`), 14, 48);
  doc.text(s(`Date : ${new Date().toLocaleDateString("fr-BE")}`), 14, 54);

  if (isCustomer && customerDiscount > 0) {
    doc.text(s(`Remise appliquee : ${customerDiscount}%`), 14, 60);
  }

  autoTable(doc, {
    startY: isCustomer && customerDiscount > 0 ? 70 : 64,
    head: [[s("Ref."), s("Produit"), s("Qte"), s("PU HTVA"), s("Total HTVA")]],
    body: lines,
    styles: { fontSize: 9, cellPadding: 2.5, font: "helvetica" },
    headStyles: {
      fillColor: [245, 126, 32],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    columnStyles: {
      0: { cellWidth: 26 },
      1: { cellWidth: 76 },
      2: { halign: "center", cellWidth: 18 },
      3: { halign: "right", cellWidth: 30 },
      4: { halign: "right", cellWidth: 34 },
    },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 12;
  const rightX = doc.internal.pageSize.getWidth() - 14;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(s(`Total HTVA : ${formatPrice(totalHTVA)} EUR`), rightX, finalY, {
    align: "right",
  });
  doc.text(s(`Total TVAC : ${formatPrice(totalTVAC)} EUR`), rightX, finalY + 8, {
    align: "right",
  });

  return doc;
}

async function sharePdf(doc: jsPDF, filename: string) {
  const blob = doc.output("blob");
  const file = new File([blob], filename, { type: "application/pdf" });
  const nav = navigator as Navigator & {
    canShare?: (data: ShareData) => boolean;
  };

  if (navigator.share && (!nav.canShare || nav.canShare({ files: [file] }))) {
    await navigator.share({
      title: filename,
      text: "Voici le devis PexxaFloor.",
      files: [file],
    });
    return;
  }

  doc.save(filename);
  window.alert("Le PDF a été téléchargé. Vous pouvez maintenant l’envoyer au client.");
}

export function PackShareQuoteModal({ open, draft, onClose }: Props) {
  const [pricing, setPricing] = useState<SharePricing | null>(null);
  const [loading, setLoading] = useState(false);
  const [sharingMode, setSharingMode] = useState<ShareMode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [customerDiscount, setCustomerDiscount] = useState(0);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    async function loadPricing() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/pack-quotes/share", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(draft),
        });

        if (!response.ok) {
          throw new Error(await response.text());
        }

        const data = (await response.json()) as SharePricing;
        if (!cancelled) setPricing(data);
      } catch (err) {
        if (!cancelled) {
          console.error(err);
          setError("Impossible de préparer le partage du devis.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadPricing();

    return () => {
      cancelled = true;
    };
  }, [open, draft]);

  const customerTotalAfterDiscount = useMemo(() => {
    if (!pricing) return 0;
    return pricing.customerTotal * (1 - customerDiscount / 100);
  }, [pricing, customerDiscount]);

  const marginAfterDiscount = pricing
    ? customerTotalAfterDiscount - pricing.proTotal
    : 0;

  const handleShare = async (mode: ShareMode) => {
    if (!pricing) return;

    try {
      setSharingMode(mode);
      const doc = buildQuotePdf({ pricing, mode, customerDiscount });
      const suffix = mode === "customer" ? "particulier" : "pro";
      await sharePdf(doc, `devis-pexxafloor-${suffix}.pdf`);
    } catch (err) {
      console.error(err);
      window.alert("Impossible de partager le PDF.");
    } finally {
      setSharingMode(null);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-2xl rounded-xl bg-white p-5 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Partager ce devis
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Choisissez le type de prix à envoyer.
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

        {loading && (
          <div className="mt-6 rounded-lg bg-gray-50 p-5 text-sm text-gray-500">
            Préparation des montants...
          </div>
        )}

        {error && (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {pricing && !loading && (
          <div className="mt-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Remise pour le devis particulier
              </label>
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={customerDiscount}
                  onChange={(event) =>
                    setCustomerDiscount(
                      Math.min(100, Math.max(0, Number(event.target.value) || 0))
                    )
                  }
                  className="w-28 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
                <span className="text-sm text-gray-500">%</span>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <button
                type="button"
                onClick={() => handleShare("pro")}
                disabled={!!sharingMode}
                className="rounded-xl border border-orange-200 bg-orange-50 p-4 text-left transition hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="block font-semibold text-orange-800">
                  Partager devis avec prix PRO
                </span>
                <span className="mt-2 block text-sm text-gray-600">
                  Total HTVA : {formatPrice(pricing.proTotal)} €
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleShare("customer")}
                disabled={!!sharingMode}
                className="rounded-xl border border-gray-200 bg-white p-4 text-left transition hover:border-orange-200 hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="block font-semibold text-gray-900">
                  Partager devis avec prix particuliers
                </span>
                <span className="mt-2 block text-sm text-gray-600">
                  Total HTVA : {formatPrice(customerTotalAfterDiscount)} €
                </span>
              </button>
            </div>

            <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-600">
              Bénéfice estimé HTVA :{" "}
              <span className="font-semibold text-gray-900">
                {formatPrice(marginAfterDiscount)} €
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
