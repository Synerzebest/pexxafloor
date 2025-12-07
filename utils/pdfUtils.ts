import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { sanitizeForPDF as s } from "@/utils/sanitize";
import { Order } from "@/types/OrderType";

export const addHeader = (doc: jsPDF, order: Order) => {
  const pageWidth = doc.internal.pageSize.getWidth();

  // === LOGO ===
  const logoUrl = "/images/logo.png";
  try {
    doc.addImage(logoUrl, "PNG", 14, 14, 60, 20);
  } catch {
    doc.setFontSize(22);
    doc.text(s("PexxaFloor"), 14, 28);
  }

  doc.setDrawColor(255, 128, 0);
  doc.setLineWidth(1);
  doc.line(14, 38, 80, 38);

  doc.setFontSize(11);

  // === TABLEAU DROITE ===
  const infoBody = [
    [s("Client"), s("Date"), s("Numero")],
    [
      s(order.client_name || "-"),
      s(new Date(order.created_at).toLocaleDateString("fr-BE")),
      s(order.id.slice(0, 8).toUpperCase()),
    ],
  ];

  autoTable(doc, {
    startY: 12,
    margin: { left: pageWidth - 100 },
    tableWidth: 85,
    body: [[s("BON DE LIVRAISON")]],
    styles: {
      fontSize: 12,
      fontStyle: "bold",
      halign: "center",
      font: "helvetica",
    },
    theme: "grid",
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: 0,
      lineColor: [0, 0, 0],
      lineWidth: 1,
    },
  });

  // Tableau client/date/numero
  autoTable(doc, {
    startY: 26,
    margin: { left: pageWidth - 100 },
    tableWidth: 85,
    body: infoBody,
    styles: { fontSize: 10, halign: "center", font: "helvetica" },
    theme: "grid",
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: 0,
      lineColor: [0, 0, 0],
      fontStyle: "bold",
    },
  });

  // === Adresse ===
  const addressRows = [
    [s("Adresse de livraison")],
    [
      s(
        `${order.address || ""}\n${order.postal_code || ""} ${order.city || ""}\n${order.country || ""}`
      ),
    ],
  ];

  autoTable(doc, {
    startY: 50,
    margin: { left: 14 },
    tableWidth: 95,
    body: addressRows,
    styles: { fontSize: 10, cellPadding: 3, font: "helvetica" },
    theme: "grid",
  });

  // === Champs cartons etc ===
  const rightTableData = [
    [s("Cartons :"), order.cartons],
    [s("Rouleaux :"), order.rouleaux],
    [s("Bottes :"), order.bottes],
    [s("Jour(s) de fermeture :"), s("Inconnu")],
  ];

  autoTable(doc, {
    startY: 50,
    margin: { left: pageWidth - 100 },
    tableWidth: 85,
    body: rightTableData,
    styles: { fontSize: 10, cellPadding: 3, font: "helvetica" },
    theme: "grid",
    columnStyles: {
      0: { cellWidth: 55 },
      1: { cellWidth: 30, halign: "center" },
    },
  });
};

export const addProductsTable = (doc: jsPDF, order: any) => {
  let items: any[] = [];
  try {
    items = typeof order.items === "string" ? JSON.parse(order.items) : order.items;
  } catch {
    return;
  }

  const rows: any[] = [];
  let totalHTVA = 0;

  items.forEach((item) => {
    if (item.type === "pack") {
      rows.push([
        s(`PACK - ${item.slug?.toUpperCase?.() || "-"}` +
        (item.surface ? ` (${item.surface} m2)` : "")),
        "",
        "",
        "",
        "",
      ]);

      item.products.forEach((prod: any) => {
        const qte = item.quantities?.[prod.id] ?? 1;
        const prixU = prod.unit_price ?? 0;
        const sous = prod.total_price ?? prixU * qte;

        totalHTVA += sous;

        rows.push([
          s(`- ${prod.description || "-"}`),
          s(String(qte)),
          s(`${prixU.toFixed(2)}`),
          s(`${sous.toFixed(2)}`),
          "",
        ]);
      });

      rows.push(["", "", "", "", ""]);
    } else {
      const name = s(item.name || item.product?.name || "-");
      const prixU = item.price ?? item.product?.price ?? 0;
      const qte = item.quantity ?? 1;
      const sousTotal = prixU * qte;

      totalHTVA += sousTotal;

      rows.push([
        name,
        s(String(qte)),
        s(`${prixU.toFixed(2)}`),
        s(`${sousTotal.toFixed(2)}`),
        "",
      ]);
    }
  });

  // === Création du tableau des produits ===
  autoTable(doc, {
    startY: 100,
    head: [[s("Produit"), s("Qte"), s("PU"), s("Sous-total"), ""]],
    body: rows,
    styles: { fontSize: 11, cellPadding: 3, font: "helvetica" },
    headStyles: {
      fillColor: [230, 230, 230],
      textColor: 20,
      halign: "center",
      fontStyle: "bold",
    },
    columnStyles: {
      0: { cellWidth: 90 },
      1: { halign: "center", cellWidth: 20 },
      2: { halign: "right", cellWidth: 25 },
      3: { halign: "right", cellWidth: 28 },
      4: { halign: "center", cellWidth: 12 },
    },
  });

  // === Total HTVA + TVAC ===
  const y = (doc as any).lastAutoTable.finalY + 10;

  const totalTVAC = totalHTVA * 1.21;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);

  // Aligné à droite
  const rightX = doc.internal.pageSize.width - 14;

  doc.text(s(`Total HTVA : ${totalHTVA.toFixed(2)} €`), rightX, y, {
    align: "right",
  });

  doc.text(s(`Total TVAC (21%) : ${totalTVAC.toFixed(2)} €`), rightX, y + 7, {
    align: "right",
  });
};

export const addSignatureAndStampSection = (doc: jsPDF) => {
  const pageWidth = doc.internal.pageSize.width;
  const last = doc.lastAutoTable;
  if (!last) return;
  let y = last.finalY + 20;
  const margin = 14;

  const boxH = 28;
  const fullWidth = pageWidth - margin * 2;

  // ==== 1. 3 grands encadrés du haut ====
  const boxW1 = fullWidth * 0.33;
  const boxW2 = fullWidth * 0.34;
  const boxW3 = fullWidth * 0.33;

  doc.rect(margin, y, boxW1, boxH);
  doc.rect(margin + boxW1, y, boxW2, boxH);
  doc.rect(margin + boxW1 + boxW2, y, boxW3, boxH);

  doc.text("Details paiement :", margin + boxW1 + 4, y + 8);

  y += boxH + 8;

  // ==== 2. Cases de paiement ====
  const caseSize = 8;
  const caseColor: [number, number, number] = [120, 30, 20];

  doc.setDrawColor(...caseColor);
  doc.rect(margin + 10, y, caseSize, caseSize);              // espece
  doc.rect(margin + 10, y + 14, caseSize, caseSize);         // virement

  doc.setDrawColor(...caseColor);
  doc.rect(pageWidth / 2 + 20, y, caseSize, caseSize);       // cheque
  doc.rect(pageWidth / 2 + 20, y + 14, caseSize, caseSize);  // autre

  doc.setDrawColor(0);

  doc.text("En especes", margin + 25, y + 6);
  doc.text("Virement", margin + 25, y + 20);

  doc.text("Cheque", pageWidth / 2 + 35, y + 6);
  doc.text("Autre", pageWidth / 2 + 35, y + 20);

  // avancer sous les cases
  y += 40;

  // ==== 3. Cachet client (grosse zone gauche) ====
  const cachetW = fullWidth * 0.63;
  const cachetH = 65;

  doc.rect(margin, y, cachetW, cachetH);
  doc.setFontSize(12);
  doc.setTextColor(160);
  doc.text("Cachet client ici :", margin + 6, y + 12);
  doc.setTextColor(0);

  // ==== 4. Bloc date de livraison ====
  const dateW = fullWidth * 0.37;
  const dateH = 28;

  doc.rect(margin + cachetW, y + cachetH - dateH, dateW, dateH);
  doc.setFontSize(11);
  doc.text("Date de livraison/Enlevement:", margin + cachetW + 4, y + cachetH - dateH + 12);

  // ==== 5. Bloc signature droite ====
  const signY = y;
  const signH = cachetH - dateH;

  doc.rect(margin + cachetW, signY, dateW, signH);

  // zone pour future image (tampon + signature)
  // doc.addImage("/images/signature.png", "PNG", margin + cachetW + 4, signY + 4, dateW - 8, signH - 8);

  return y + cachetH + 10;
};


export const addFooter = (doc: jsPDF) => {
  const pageHeight = doc.internal.pageSize.height;
  const pageWidth = doc.internal.pageSize.width;

  const lignes = [
    s("UNISIS BELGIUM SPRL Brusselstraat 107 D 1702 Groot Bijgaarden"),
    s("TEL: +32 2 343 92 00 - Fax: +32 2 343 92 02 info@discoveryshop.be - www.discoveryshop.be"),
    s("BNP PARIBAS FORTIS BE51 0014 4682 9162 - TVA/BTW BE 0871.407.121"),
  ];

  doc.setFontSize(9);
  const lineHeight = 4.5;
  let y = pageHeight - lignes.length * lineHeight;

  lignes.forEach((line) => {
    const w =
      (doc.getStringUnitWidth(line) * doc.getFontSize()) /
      doc.internal.scaleFactor;
    const x = (pageWidth - w) / 2;
    doc.text(line, x, y);
    y += lineHeight;
  });
};
