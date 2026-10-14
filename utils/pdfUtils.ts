import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { isOrderPaid, type Order } from "@/types/OrderType";

// ---- Layout constants (mm, A4 portrait) ----
const MARGIN = 15;
const FOOTER_HEIGHT = 18;
const BRAND: [number, number, number] = [234, 88, 12];
const INK: [number, number, number] = [17, 24, 39];
const MUTED: [number, number, number] = [107, 114, 128];
const LINE: [number, number, number] = [229, 231, 235];
const SOFT: [number, number, number] = [249, 250, 251];
const LOGO_URL = "/images/logo-print.png"; // trimmed logo, 900 x 163 px
const LOGO_RATIO = 900 / 163;

const COMPANY_LINES = [
  "UNISIS BELGIUM SPRL · Rue du Broek 114, 1082 Berchem-Sainte-Agathe, Belgique",
  "Tél. +32 494 042 932 · info@pexxafloor.be · www.pexxafloor.be",
  "BNP Paribas Fortis BE51 0014 4682 9162 · TVA/BTW BE 0871.407.121",
];

/** Helvetica in jsPDF covers Latin-1 (accents OK) but not typographic punctuation or €. */
function pdfText(value: unknown): string {
  return String(value ?? "")
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/…/g, "...")
    .replace(/€/g, "EUR")
    .replace(/[  ]/g, " ")
    .replace(/[^\x00-\xFF]/g, "");
}

const money = (value: number) =>
  `${new Intl.NumberFormat("fr-BE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)} EUR`.replace(/[  ]/g, " ");

async function loadImageDataUrl(url: string): Promise<string | null> {
  try {
    const blob = await (await fetch(url)).blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

const lastTableY = (doc: jsPDF) => (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;

/** Starts a new page when the next block would run into the footer. */
function ensureSpace(doc: jsPDF, y: number, needed: number) {
  const limit = doc.internal.pageSize.getHeight() - FOOTER_HEIGHT - 4;
  if (y + needed <= limit) return y;
  doc.addPage();
  return MARGIN;
}

function drawHeader(doc: jsPDF, order: Order, logo: string | null) {
  const pageWidth = doc.internal.pageSize.getWidth();

  // Logo, drawn with its real proportions
  const logoWidth = 62;
  if (logo) {
    doc.addImage(logo, "PNG", MARGIN, MARGIN, logoWidth, logoWidth / LOGO_RATIO);
  } else {
    doc.setFont("helvetica", "bold").setFontSize(20).setTextColor(...BRAND);
    doc.text("PexxaFloor", MARGIN, MARGIN + 8);
  }

  // Document title and references
  const right = pageWidth - MARGIN;
  doc.setFont("helvetica", "bold").setFontSize(18).setTextColor(...INK);
  doc.text(pdfText("BON DE LIVRAISON"), right, MARGIN + 6, { align: "right" });
  doc.setFont("helvetica", "normal").setFontSize(9.5).setTextColor(...MUTED);
  doc.text(pdfText(`N° ${order.id.slice(0, 8).toUpperCase()}`), right, MARGIN + 12, { align: "right" });
  doc.text(
    pdfText(`Commande du ${new Date(order.created_at).toLocaleDateString("fr-BE")}`),
    right,
    MARGIN + 17,
    { align: "right" }
  );

  doc.setDrawColor(...BRAND).setLineWidth(0.6);
  doc.line(MARGIN, MARGIN + 23, right, MARGIN + 23);
  return MARGIN + 30;
}

/** Rounded card with a small uppercase title; returns the y below it. */
function drawCard(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  title: string,
  draw: (innerX: number, innerY: number) => void
) {
  doc.setFillColor(...SOFT).setDrawColor(...LINE).setLineWidth(0.3);
  doc.roundedRect(x, y, width, height, 2, 2, "FD");
  doc.setFont("helvetica", "bold").setFontSize(7.5).setTextColor(...MUTED);
  doc.text(pdfText(title.toUpperCase()), x + 5, y + 6.5);
  draw(x + 5, y + 12.5);
}

function drawParties(doc: jsPDF, order: Order, y: number) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const gap = 6;
  const width = (pageWidth - MARGIN * 2 - gap) / 2;
  const height = 36;

  drawCard(doc, MARGIN, y, width, height, "Livrer à", (x, top) => {
    doc.setFont("helvetica", "bold").setFontSize(11).setTextColor(...INK);
    const name = order.company_name || order.client_name || "-";
    doc.text(pdfText(name), x, top, { maxWidth: width - 10 });
    doc.setFont("helvetica", "normal").setFontSize(9.5).setTextColor(55, 65, 81);
    const lines = [
      order.company_name && order.client_name ? order.client_name : null,
      order.address,
      [order.postal_code, order.city].filter(Boolean).join(" "),
      order.country,
    ].filter(Boolean) as string[];
    lines.forEach((line, index) => doc.text(pdfText(line), x, top + 5.5 + index * 4.6, { maxWidth: width - 10 }));
  });

  drawCard(doc, MARGIN + width + gap, y, width, height, "Colisage", (x, top) => {
    const rows: [string, string][] = [
      ["Cartons", String(order.cartons ?? "-")],
      ["Rouleaux", String(order.rouleaux ?? "-")],
      ["Bottes", String(order.bottes ?? "-")],
      ["Jour(s) de fermeture", "................................"],
    ];
    rows.forEach(([label, value], index) => {
      const rowY = top + index * 5.6;
      doc.setFont("helvetica", "normal").setFontSize(9.5).setTextColor(...MUTED);
      doc.text(pdfText(label), x, rowY);
      doc.setFont("helvetica", "bold").setTextColor(...INK);
      doc.text(pdfText(value), x + width - 10, rowY, { align: "right" });
    });
  });

  return y + height + 8;
}

type ProductRow = { label: string; reference: string; quantity: number; unitPrice: number; isPack?: boolean };

function collectRows(order: Order): ProductRow[] {
  let items: any[] = [];
  try {
    items = typeof order.items === "string" ? JSON.parse(order.items) : order.items;
  } catch {
    return [];
  }
  if (!Array.isArray(items)) return [];

  return items.flatMap((item): ProductRow[] => {
    if (item.type === "pack") {
      const packQuantity = Math.max(1, Number(item.quantity) || 1);
      const title = [
        `Pack ${String(item.slug || "").replace(/^\w/, (c: string) => c.toUpperCase())}`,
        item.surface ? `${item.surface} m²` : null,
        item.tuyauType,
        packQuantity > 1 ? `x ${packQuantity}` : null,
      ].filter(Boolean).join(" · ");
      return [
        { label: title, reference: "", quantity: 0, unitPrice: 0, isPack: true },
        ...(item.products || []).map((product: any) => ({
          label: product.description || "-",
          reference: product.reference || "",
          quantity: (item.quantities?.[product.id] ?? 1) * packQuantity,
          unitPrice: Number(product.unit_price) || 0,
        })),
      ];
    }
    return [{
      label: item.name || item.product?.name || "-",
      reference: item.reference || item.product?.reference || "",
      quantity: Number(item.quantity) || 1,
      unitPrice: Number(item.unit_price ?? item.price ?? item.product?.price) || 0,
    }];
  });
}

function drawProducts(doc: jsPDF, order: Order, y: number) {
  const rows = collectRows(order);
  const totalExclVat = rows.reduce((sum, row) => sum + row.quantity * row.unitPrice, 0);

  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN, bottom: FOOTER_HEIGHT + 4 },
    head: [["Désignation", "Réf.", "Qté", "PU HTVA", "Total HTVA", "Livré"].map(pdfText)],
    body: rows.map((row) =>
      row.isPack
        ? [{ content: pdfText(row.label), colSpan: 6 }]
        : [
            pdfText(row.label),
            pdfText(row.reference),
            String(row.quantity),
            pdfText(money(row.unitPrice)),
            pdfText(money(row.unitPrice * row.quantity)),
            "",
          ]
    ),
    theme: "plain",
    styles: { font: "helvetica", fontSize: 9, cellPadding: { top: 2.6, bottom: 2.6, left: 2.5, right: 2.5 }, textColor: INK, valign: "middle" },
    headStyles: { fillColor: INK, textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8.5 },
    columnStyles: {
      0: { cellWidth: "auto" },
      1: { cellWidth: 24, textColor: MUTED, fontSize: 8 },
      2: { cellWidth: 13, halign: "center", fontStyle: "bold" },
      3: { cellWidth: 25, halign: "right" },
      4: { cellWidth: 27, halign: "right" },
      5: { cellWidth: 13, halign: "center" },
    },
    didParseCell: (data) => {
      // Align headers with their column values
      if (data.section === "head") {
        data.cell.styles.halign = data.column.index === 2 || data.column.index === 5 ? "center" : data.column.index >= 3 ? "right" : "left";
        return;
      }
      if (data.section !== "body") return;
      const row = rows[data.row.index];
      if (row?.isPack) {
        data.cell.styles.fillColor = [255, 237, 213];
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.textColor = [154, 52, 18];
      } else if (data.row.index % 2 === 1) {
        data.cell.styles.fillColor = SOFT;
      }
      if (data.column.index >= 2 && data.column.index <= 4 && data.section === "body") {
        data.cell.styles.halign = data.column.index === 2 ? "center" : "right";
      }
      if (data.column.index === 3 || data.column.index === 4) data.cell.styles.fontSize = 8.5;
    },
    didDrawCell: (data) => {
      // Empty checkbox the driver ticks for each delivered line
      if (data.section !== "body" || data.column.index !== 5 || rows[data.row.index]?.isPack) return;
      const size = 3.6;
      doc.setDrawColor(...MUTED).setLineWidth(0.3);
      doc.rect(data.cell.x + (data.cell.width - size) / 2, data.cell.y + (data.cell.height - size) / 2, size, size);
    },
  });

  // Totals, right-aligned
  const pageWidth = doc.internal.pageSize.getWidth();
  let totalsY = ensureSpace(doc, lastTableY(doc) + 6, 26);
  const labelX = pageWidth - MARGIN - 70;
  const valueX = pageWidth - MARGIN;
  const vat = totalExclVat * 0.21;
  const lines: [string, string, boolean][] = [
    ["Total HTVA", money(totalExclVat), false],
    ["TVA 21 %", money(vat), false],
    ["Total TVAC", money(totalExclVat + vat), true],
  ];
  lines.forEach(([label, value, strong]) => {
    if (strong) {
      doc.setDrawColor(...LINE).setLineWidth(0.3).line(labelX, totalsY - 4, valueX, totalsY - 4);
      totalsY += 1.5;
    }
    doc.setFont("helvetica", strong ? "bold" : "normal").setFontSize(strong ? 11.5 : 9.5);
    doc.setTextColor(...(strong ? BRAND : MUTED));
    doc.text(pdfText(label), labelX, totalsY);
    doc.setTextColor(...(strong ? BRAND : INK));
    doc.text(pdfText(value), valueX, totalsY, { align: "right" });
    totalsY += 6;
  });
  return totalsY;
}

function drawSignature(doc: jsPDF, order: Order, y: number) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const fullWidth = pageWidth - MARGIN * 2;
  const paid = isOrderPaid(order);
  const boxHeight = 28;
  // label + payment line(s) + boxes, kept together on one page
  y = ensureSpace(doc, y, 5 + (paid ? 8 : 13) + boxHeight);

  // Payment: already paid, or how it was collected on delivery
  doc.setFont("helvetica", "bold").setFontSize(7.5).setTextColor(...MUTED);
  doc.text(pdfText("PAIEMENT"), MARGIN, y);
  y += 5;
  if (paid) {
    doc.setFillColor(220, 252, 231).roundedRect(MARGIN, y - 3.8, 42, 6, 1.5, 1.5, "F");
    doc.setFont("helvetica", "bold").setFontSize(9).setTextColor(21, 128, 61);
    doc.text(pdfText("Commande déjà payée"), MARGIN + 3, y);
    y += 8;
  } else {
    const options = ["Espèces", "Virement", "Chèque", "Autre"];
    const step = fullWidth / options.length;
    doc.setFont("helvetica", "normal").setFontSize(9.5).setTextColor(...INK);
    options.forEach((option, index) => {
      const x = MARGIN + index * step;
      doc.setDrawColor(...MUTED).setLineWidth(0.3).rect(x, y - 3.2, 3.8, 3.8);
      doc.text(pdfText(option), x + 6, y);
    });
    y += 6;
    doc.setTextColor(...MUTED).setFontSize(9);
    doc.text(pdfText("Montant reçu : ......................................"), MARGIN, y);
    y += 7;
  }

  // Delivery date, customer signature and stamp
  const gap = 6;
  const boxWidth = (fullWidth - gap) / 2;
  const boxes = [
    { x: MARGIN, title: "Date de livraison / enlèvement" },
    { x: MARGIN + boxWidth + gap, title: "Nom, signature et cachet du client" },
  ];
  boxes.forEach(({ x, title }) => {
    doc.setDrawColor(...LINE).setLineWidth(0.3).roundedRect(x, y, boxWidth, boxHeight, 2, 2, "S");
    doc.setFont("helvetica", "bold").setFontSize(7.5).setTextColor(...MUTED);
    doc.text(pdfText(title.toUpperCase()), x + 4, y + 6);
  });
  return y + boxHeight;
}

function drawFooters(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  for (let page = 1; page <= pageCount; page++) {
    doc.setPage(page);
    const top = pageHeight - FOOTER_HEIGHT + 2;
    doc.setDrawColor(...LINE).setLineWidth(0.3).line(MARGIN, top - 3, pageWidth - MARGIN, top - 3);
    doc.setFont("helvetica", "normal").setFontSize(7.5).setTextColor(...MUTED);
    COMPANY_LINES.forEach((line, index) => doc.text(pdfText(line), pageWidth / 2, top + index * 3.6, { align: "center" }));
    if (pageCount > 1) {
      doc.text(`${page} / ${pageCount}`, pageWidth - MARGIN, top + 7.2, { align: "right" });
    }
  }
}

/** Builds the delivery note (bon de livraison) for an order. */
export async function generateDeliveryNote(order: Order): Promise<jsPDF> {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const logo = await loadImageDataUrl(LOGO_URL);

  let y = drawHeader(doc, order, logo);
  y = drawParties(doc, order, y);
  y = drawProducts(doc, order, y);
  drawSignature(doc, order, y + 2);
  drawFooters(doc);
  return doc;
}
