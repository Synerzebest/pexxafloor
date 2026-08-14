"use client";

import { useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { ArrowLeft, Download, X } from "lucide-react";
import { useTranslations } from "next-intl";
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
  proIssuer: QuoteIssuer;
  packName: string;
  projectReference?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  customerEmail?: string | null;
  projectType?: string | null;
  lines: ShareLine[];
  proTotal: number;
  customerTotal: number;
  margin: number;
};

type QuoteIssuer = {
  name: string;
  addressLine1?: string | null;
  addressLine2?: string | null;
  postcode?: string | null;
  town?: string | null;
  country?: string | null;
  phone?: string | null;
  email?: string | null;
  vat?: string | null;
};

const UNISIS_ISSUER: QuoteIssuer = {
  name: "Unisis Development SRL",
  addressLine1: "Brusselstraat 107 D",
  postcode: "1702",
  town: "Groot-Bijgaarden",
  phone: "+32 2 343 92 00",
  email: "info@discoveryshop.be",
  vat: "BE 0871.407.121",
};

type ShareMode = "pro" | "customer" | "guest";

type Props = {
  open: boolean;
  draft: PackQuoteDraft;
  isPro: boolean;
  onClose: () => void;
};

type GuestPdfLabels = {
  title: string;
  product: string;
  quantity: string;
  totalExclVat: string;
  totalInclVat: string;
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
  const issuer = isCustomer ? pricing.proIssuer : UNISIS_ISSUER;
  const title = "Devis";
  const discountRate = isCustomer ? customerDiscount / 100 : 0;
  const visibleLines = isCustomer
    ? pricing.lines
    : pricing.lines.filter((line) => !line.id.startsWith("additional-item:"));
  const lines = visibleLines.map((line) => {
    if (isCustomer) {
      return [
        s(line.reference || "-"),
        s(line.description),
        s(String(line.quantity)),
      ];
    }

    const unitPrice = line.proUnitPrice;
    const total = unitPrice * line.quantity;

    return [
      s(line.reference || "-"),
      s(line.description),
      s(String(line.quantity)),
      s(`${formatPrice(unitPrice)} EUR`),
      s(`${formatPrice(total)} EUR`),
    ];
  });

  const additionalItemsTotal = pricing.lines
    .filter((line) => line.id.startsWith("additional-item:"))
    .reduce((sum, line) => sum + line.customerTotal, 0);
  const supplyCustomerTotal = pricing.customerTotal - additionalItemsTotal;
  const totalHTVA = isCustomer
    ? supplyCustomerTotal * (1 - discountRate) + additionalItemsTotal
    : pricing.proTotal;
  const totalTVAC = totalHTVA * 1.21;

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  doc.setFillColor(248, 250, 252);
  doc.rect(0, 0, pageWidth, 48, "F");

  doc.setTextColor(17, 24, 39);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(19);
  doc.text(s(issuer.name), 14, 16);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(75, 85, 99);
  const headerAddress = [issuer.addressLine1, issuer.addressLine2].filter(Boolean).join(", ");
  const headerTown = [issuer.postcode, issuer.town].filter(Boolean).join(" ");
  if (headerAddress) doc.text(s(headerAddress), 14, 22);
  if (headerTown) doc.text(s(headerTown), 14, 27);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(245, 126, 32);
  doc.text(s(title), 14, 38);

  doc.setFontSize(9);
  doc.text("PexxaFloor", pageWidth - 14, 38, { align: "right" });

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

  const customerDetails = [
    pricing.customerName ? `Client : ${pricing.customerName}` : null,
    pricing.customerPhone ? `GSM : ${pricing.customerPhone}` : null,
    pricing.customerEmail ? `Email : ${pricing.customerEmail}` : null,
    pricing.projectType ? `Type de projet : ${pricing.projectType}` : null,
  ].filter(Boolean) as string[];

  customerDetails.forEach((detail, index) => {
    doc.setFontSize(9);
    doc.setTextColor(75, 85, 99);
    doc.text(s(detail), 14, 65 + index * 6);
  });

  if (isCustomer && customerDiscount > 0) {
    doc.setTextColor(75, 85, 99);
    doc.setFontSize(9);
    doc.text(s(`Remise appliquee : ${customerDiscount}%`), 14, 65 + customerDetails.length * 6);
  }

  const tableStartY =
    68 +
    customerDetails.length * 6 +
    (isCustomer && customerDiscount > 0 ? 10 : 0);

  autoTable(doc, {
    startY: tableStartY,
    head: [
      isCustomer
        ? [s("Reference"), s("Produit"), s("Qte")]
        : [s("Reference"), s("Produit"), s("Qte"), s("PU HTVA"), s("Total HTVA")],
    ],
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
    columnStyles: isCustomer
      ? {
          0: { cellWidth: 34 },
          1: { cellWidth: 122 },
          2: { halign: "center", cellWidth: 22 },
        }
      : {
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

  const footerAddress = [
    issuer.addressLine1,
    issuer.addressLine2,
    [issuer.postcode, issuer.town].filter(Boolean).join(" "),
    issuer.country,
  ]
    .filter(Boolean)
    .join(" - ");
  const footerContact = [issuer.phone && `TEL: ${issuer.phone}`, issuer.email]
    .filter(Boolean)
    .join(" - ");
  const footerLines = [
    [issuer.name, footerAddress].filter(Boolean).join(" - "),
    footerContact,
    issuer.vat ? `TVA/BTW ${issuer.vat}` : null,
  ].filter(Boolean) as string[];

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

async function loadPexxaLogo() {
  const response = await fetch("/images/logo.png");
  if (!response.ok) throw new Error("Unable to load PexxaFloor logo");
  const blob = await response.blob();

  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

async function buildGuestQuotePdf(
  draft: PackQuoteDraft,
  labels: GuestPdfLabels
) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const logo = await loadPexxaLogo();

  // The neutral estimate deliberately contains no issuer, customer or legal data.
  doc.addImage(logo, "PNG", 55, 8, 100, 67);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.setTextColor(17, 24, 39);
  doc.text(s(labels.title), pageWidth / 2, 84, { align: "center" });

  const lines = draft.products.map((product) => [
    s(product.description),
    s(String(draft.quantities[product.id] ?? 1)),
  ]);

  autoTable(doc, {
    startY: 94,
    head: [[s(labels.product), s(labels.quantity)]],
    body: lines,
    margin: { left: 18, right: 18, bottom: 18 },
    styles: {
      fontSize: 9,
      cellPadding: 3.5,
      font: "helvetica",
      lineColor: [229, 231, 235],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: [17, 24, 39],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    columnStyles: {
      0: { cellWidth: 146 },
      1: { halign: "center", cellWidth: 28 },
    },
  });

  const totalHTVA = Number(draft.total || 0);
  const totalTVAC = totalHTVA * 1.21;
  const finalY = (doc as any).lastAutoTable.finalY + 12;
  const rightX = pageWidth - 18;

  doc.setFillColor(249, 250, 251);
  doc.roundedRect(pageWidth - 92, finalY - 7, 74, 26, 3, 3, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(17, 24, 39);
  doc.text(s(`${labels.totalExclVat} : ${formatPrice(totalHTVA)} EUR`), rightX, finalY, {
    align: "right",
  });
  doc.text(s(`${labels.totalInclVat} : ${formatPrice(totalTVAC)} EUR`), rightX, finalY + 8, {
    align: "right",
  });

  return doc;
}

export function PackShareQuoteModal({ open, draft, isPro, onClose }: Props) {
  const t = useTranslations("QuoteShare");
  const [pricing, setPricing] = useState<SharePricing | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customerDiscount, setCustomerDiscount] = useState(0);
  const [preview, setPreview] = useState<{
    url: string;
    filename: string;
    mode: ShareMode;
  } | null>(null);

  useEffect(() => {
    return () => {
      if (preview?.url) URL.revokeObjectURL(preview.url);
    };
  }, [preview]);

  useEffect(() => {
    if (!open) setPreview(null);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    if (!isPro) {
      setPricing(null);
      setLoading(false);
      setError(null);
      return;
    }

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
          setError(t("prepareError"));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadPricing();

    return () => {
      cancelled = true;
    };
  }, [open, draft, isPro, t]);

  const customerTotalAfterDiscount = useMemo(() => {
    if (!pricing) return 0;
    const additionalItemsTotal = pricing.lines
      .filter((line) => line.id.startsWith("additional-item:"))
      .reduce((sum, line) => sum + line.customerTotal, 0);
    return (
      (pricing.customerTotal - additionalItemsTotal) *
        (1 - customerDiscount / 100) +
      additionalItemsTotal
    );
  }, [pricing, customerDiscount]);

  const marginAfterDiscount = pricing
    ? customerTotalAfterDiscount - pricing.proTotal
    : 0;

  const handlePreview = async (mode: ShareMode) => {
    try {
      const doc = mode === "guest"
        ? await buildGuestQuotePdf(draft, {
            title: t("guestDocumentTitle"),
            product: t("product"),
            quantity: t("quantity"),
            totalExclVat: t("totalExclVat"),
            totalInclVat: t("totalInclVat"),
          })
        : pricing
          ? buildQuotePdf({ pricing, mode, customerDiscount })
          : null;
      if (!doc) return;
      const suffix = mode === "customer" ? "particulier" : mode === "pro" ? "pro" : "estimatif";
      const blob = doc.output("blob");
      setPreview({
        url: URL.createObjectURL(blob),
        filename: `devis-${suffix}.pdf`,
        mode,
      });
    } catch (err) {
      console.error(err);
      setError(t("previewError"));
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/40 px-4">
      <div className={`max-h-[94vh] w-full overflow-y-auto rounded-xl bg-white p-5 shadow-xl ${preview ? "max-w-6xl" : "max-w-2xl"}`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {preview
                ? t(preview.mode === "customer"
                    ? "previewCustomerTitle"
                    : preview.mode === "pro"
                      ? "previewProTitle"
                      : "previewGuestTitle")
                : t(isPro ? "title" : "guestTitle")}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {preview ? t("previewDescription") : t(isPro ? "description" : "guestDescription")}
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

        {preview ? (
          <div className="mt-5">
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
              <iframe
                src={preview.url}
                title={t("previewFrameTitle")}
                className="h-[68vh] w-full bg-white"
              />
            </div>

            <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => setPreview(null)}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                {t("back")}
              </button>
              <a
                href={preview.url}
                download={preview.filename}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-700"
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                {t("download")}
              </a>
            </div>
          </div>
        ) : loading && (
          <div className="mt-6 rounded-lg bg-gray-50 p-5 text-sm text-gray-500">
            {t("preparing")}
          </div>
        )}

        {!preview && error && (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {!preview && pricing && !loading && (
          <div className="mt-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t("customerDiscount")}
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
                onClick={() => handlePreview("pro")}
                className="rounded-xl border border-orange-200 bg-orange-50 p-4 text-left transition hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="block font-semibold text-orange-800">
                  {t("sharePro")}
                </span>
                <span className="mt-2 block text-sm text-gray-600">
                  {t("totalExclVat")} : {formatPrice(pricing.proTotal)} €
                </span>
              </button>

              <button
                type="button"
                onClick={() => handlePreview("customer")}
                className="rounded-xl border border-gray-200 bg-white p-4 text-left transition hover:border-orange-200 hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="block font-semibold text-gray-900">
                  {t("shareCustomer")}
                </span>
                <span className="mt-2 block text-sm text-gray-600">
                  {t("totalExclVat")} : {formatPrice(customerTotalAfterDiscount)} €
                </span>
              </button>
            </div>

            <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-600">
              {t("estimatedProfit")} :{" "}
              <span className="font-semibold text-gray-900">
                {formatPrice(marginAfterDiscount)} €
              </span>
            </div>
          </div>
        )}

        {!preview && !isPro && !loading && (
          <div className="mt-6">
            <button
              type="button"
              onClick={() => handlePreview("guest")}
              className="w-full rounded-xl border border-orange-200 bg-orange-50 p-5 text-left transition hover:bg-orange-100"
            >
              <span className="block font-semibold text-orange-800">
                {t("previewGuest")}
              </span>
              <span className="mt-2 block text-sm text-gray-600">
                {t("totalInclVat")} : {formatPrice(draft.total * 1.21)} €
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
