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
  proName: string;
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
  const title = isCustomer ? "Devis particulier" : "Devis PRO";
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

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  doc.setFillColor(248, 250, 252);
  doc.rect(0, 0, pageWidth, 48, "F");

  doc.setTextColor(17, 24, 39);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(19);
  doc.text(s(pricing.proName), 14, 18);

  doc.setFontSize(12);
  doc.setTextColor(245, 126, 32);
  doc.text(s(title), 14, 29);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(75, 85, 99);
  doc.text(s(`Date : ${new Date().toLocaleDateString("fr-BE")}`), pageWidth - 14, 18, {
    align: "right",
  });
  doc.text(s(`Reference projet : ${pricing.projectReference || "-"}`), pageWidth - 14, 25, {
    align: "right",
  });

  doc.setTextColor(17, 24, 39);
  doc.setFontSize(11);
  doc.text(s(`Pack : ${pricing.packName}`), 14, 58);

  if (isCustomer && customerDiscount > 0) {
    doc.setTextColor(75, 85, 99);
    doc.setFontSize(9);
    doc.text(s(`Remise appliquee : ${customerDiscount}%`), 14, 65);
  }

  autoTable(doc, {
    startY: isCustomer && customerDiscount > 0 ? 74 : 68,
    head: [[s("Reference"), s("Produit"), s("Qte"), s("PU HTVA"), s("Total HTVA")]],
    body: lines,
    margin: { left: 14, right: 14, bottom: 34 },
    styles: {
      fontSize: 8.5,
      cellPadding: 3,
      font: "helvetica",
      lineColor: [229, 231, 235],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: [17, 24, 39],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251],
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
  const rightX = pageWidth - 14;

  doc.setFillColor(249, 250, 251);
  doc.roundedRect(pageWidth - 80, finalY - 7, 66, 26, 3, 3, "F");
  doc.setTextColor(17, 24, 39);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(s(`Total HTVA : ${formatPrice(totalHTVA)} EUR`), rightX, finalY, {
    align: "right",
  });
  doc.text(s(`Total TVAC : ${formatPrice(totalTVAC)} EUR`), rightX, finalY + 8, {
    align: "right",
  });

  const footerLines = [
    "UNISIS BELGIUM SPRL Brusselstraat 107 D 1702 Groot Bijgaarden",
    "TEL: +32 2 343 92 00 - Fax: +32 2 343 92 02 info@discoveryshop.be - www.discoveryshop.be",
    "BNP PARIBAS FORTIS BE51 0014 4682 9162 - TVA/BTW BE 0871.407.121",
  ];

  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.setDrawColor(229, 231, 235);
    doc.line(14, pageHeight - 25, pageWidth - 14, pageHeight - 25);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(107, 114, 128);
    footerLines.forEach((line, index) => {
      doc.text(s(line), pageWidth / 2, pageHeight - 19 + index * 5, {
        align: "center",
      });
    });
  }

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
      text: "Voici le devis.",
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
      await sharePdf(doc, `devis-${suffix}.pdf`);
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
