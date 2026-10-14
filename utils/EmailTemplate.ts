function escapeHtml(value: unknown): string {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[char]!));
}

type Locale = "fr" | "en" | "nl";

const BRAND = "#ea580c";
const CONTACT_PHONE = "+32 494 042 932";
const CONTACT_EMAIL = "info@pexxafloor.be";

// Email clients (Gmail proxies images) must reach images over the public internet,
// so they never come from NEXT_PUBLIC_URL, which is localhost in development.
const EMAIL_ASSETS_ORIGIN = process.env.EMAIL_ASSETS_URL?.trim() || "https://www.pexxafloor.be";

const copy: Record<Locale, {
  greeting: string; orderLabel: string; recapTitle: string; noItems: string; quantity: string;
  priceNote: string; total: string; button: string; thanks: string; team: string; questions: string;
}> = {
  fr: {
    greeting: "Bonjour,", orderLabel: "Commande", recapTitle: "Récapitulatif", noItems: "Aucun article dans la commande.",
    quantity: "Qté", priceNote: "Prix des articles HTVA", total: "Total TVAC", button: "Suivre ma commande",
    thanks: "Merci pour votre confiance,", team: "L’équipe PexxaFloor", questions: "Une question ? Contactez-nous",
  },
  en: {
    greeting: "Hello,", orderLabel: "Order", recapTitle: "Summary", noItems: "No items in the order.",
    quantity: "Qty", priceNote: "Item prices excl. VAT", total: "Total incl. VAT", button: "Track my order",
    thanks: "Thank you for your trust,", team: "The PexxaFloor team", questions: "Any questions? Contact us",
  },
  nl: {
    greeting: "Hallo,", orderLabel: "Bestelling", recapTitle: "Overzicht", noItems: "Geen artikelen in de bestelling.",
    quantity: "Aantal", priceNote: "Artikelprijzen excl. btw", total: "Totaal incl. btw", button: "Mijn bestelling volgen",
    thanks: "Bedankt voor uw vertrouwen,", team: "Het PexxaFloor-team", questions: "Een vraag? Neem contact op",
  },
};

type ItemForEmail = { name: string; detail?: string; quantity: number; totalPrice: number };

function parseOrderItems(orderItems: unknown): ItemForEmail[] {
  let rawItems = orderItems;
  if (typeof rawItems === "string") {
    try {
      rawItems = JSON.parse(rawItems);
    } catch (e) {
      console.error("Erreur critique lors du JSON.parse des articles de commande:", e);
      return [];
    }
  }
  if (!Array.isArray(rawItems)) return [];

  return rawItems.flatMap((item: any): ItemForEmail[] => {
    if (!item?.type || !item.quantity) return [];
    const quantity = Number(item.quantity) || 1;

    if (item.type === "product") {
      const unitPrice = Number(item.unit_price ?? item.product?.price ?? item.price);
      if (!Number.isFinite(unitPrice)) return [];
      return [{ name: item.product?.name ?? item.name ?? item.product_id, quantity, totalPrice: unitPrice * quantity }];
    }

    if (item.type === "pack" && item.slug) {
      const packPrice = Number(item.total);
      if (!Number.isFinite(packPrice)) return [];
      const name = `Pack ${item.slug.charAt(0).toUpperCase()}${item.slug.slice(1)}`;
      const detail = [item.surface && `${item.surface} m²`, item.tuyauType].filter(Boolean).join(" · ");
      return [{ name, detail, quantity, totalPrice: packPrice * quantity }];
    }
    return [];
  });
}

const formatEuro = (value: number, locale: Locale) =>
  new Intl.NumberFormat(`${locale}-BE`, { style: "currency", currency: "EUR" }).format(value);

function itemsHtml(items: ItemForEmail[], total: number, locale: Locale) {
  const t = copy[locale];
  if (items.length === 0) {
    return `<p style="margin:0;font-size:14px;color:#6b7280;">${t.noItems}</p>`;
  }
  const rows = items.map((item) => `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #f1f1f1;font-size:14px;color:#111827;">
        <div style="font-weight:600;">${escapeHtml(item.name)}</div>
        <div style="font-size:12px;color:#6b7280;margin-top:2px;">
          ${item.detail ? `${escapeHtml(item.detail)} · ` : ""}${t.quantity} ${item.quantity}
        </div>
      </td>
      <td align="right" valign="top" style="padding:12px 0;border-bottom:1px solid #f1f1f1;font-size:14px;font-weight:600;color:#111827;white-space:nowrap;">
        ${formatEuro(item.totalPrice, locale)}
      </td>
    </tr>`).join("");

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      ${rows}
      <tr>
        <td style="padding-top:14px;font-size:15px;font-weight:700;color:#111827;">${t.total}</td>
        <td align="right" style="padding-top:14px;font-size:18px;font-weight:700;color:${BRAND};white-space:nowrap;">
          ${formatEuro(total, locale)}
        </td>
      </tr>
    </table>
    <p style="margin:6px 0 0;font-size:11px;color:#9ca3af;">${t.priceNote}</p>`;
}

// Progress through the order workflow; labels are the site's own status labels
function stepperHtml(labels: string[], currentIndex: number) {
  if (currentIndex < 0) return "";
  const width = `${(100 / labels.length).toFixed(2)}%`;
  const bars = labels.map((_, index) => `
    <td width="${width}" style="padding:0 2px;">
      <div style="height:6px;border-radius:3px;background:${index <= currentIndex ? BRAND : "#e5e7eb"};font-size:0;line-height:0;">&nbsp;</div>
    </td>`).join("");
  const names = labels.map((label, index) => `
    <td width="${width}" align="center" valign="top" style="padding:8px 2px 0;font-size:11px;line-height:1.3;
      color:${index === currentIndex ? "#111827" : index < currentIndex ? "#6b7280" : "#9ca3af"};
      font-weight:${index === currentIndex ? 700 : 400};">
      ${escapeHtml(label)}
    </td>`).join("");
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      <tr>${bars}</tr>
      <tr>${names}</tr>
    </table>`;
}

export interface EmailParams {
  orderId: string;
  orderItems: unknown;
  orderTotal: number;
  title: string;
  mainText: string;
  statusLabel: string;
  steps: { labels: string[]; currentIndex: number };
  cancelled: boolean;
  /** Shown for the "out for delivery" email */
  deliveryAddress?: { label: string; lines: string[] };
  link: string;
  siteUrl: string;
  locale: Locale;
}

export function generateOrderEmailHtml({
  orderId, orderItems, orderTotal, title, mainText, statusLabel, steps, cancelled, deliveryAddress, link, siteUrl, locale,
}: EmailParams): string {
  const t = copy[locale];
  const logoUrl = new URL("/images/logo-email.png", EMAIL_ASSETS_ORIGIN).toString();
  const homeUrl = new URL(`/${locale}`, siteUrl).toString();
  const badgeBg = cancelled ? "#fef2f2" : "#fff7ed";
  const badgeColor = cancelled ? "#b91c1c" : "#c2410c";

  return `<!DOCTYPE html>
<html lang="${locale}">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="color-scheme" content="light">
    <title>${escapeHtml(title)}</title>
    <style>
      @media only screen and (max-width: 600px) {
        .card { padding: 24px 18px !important; }
        .title { font-size: 22px !important; }
      }
    </style>
  </head>
  <body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;">${escapeHtml(mainText)}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;">
      <tr>
        <td align="center" style="padding:28px 12px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

            <!-- Logo -->
            <tr>
              <td align="center" style="padding-bottom:18px;">
                <a href="${escapeHtml(homeUrl)}" style="text-decoration:none;">
                  <img src="${escapeHtml(logoUrl)}" width="200" height="36" alt="PexxaFloor" style="display:block;width:200px;max-width:200px;height:auto;border:0;">
                </a>
              </td>
            </tr>

            <!-- Card -->
            <tr>
              <td class="card" style="background:#ffffff;border-radius:16px;padding:36px 32px;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td>
                      <span style="display:inline-block;background:${badgeBg};color:${badgeColor};padding:5px 12px;border-radius:999px;font-size:12px;font-weight:700;letter-spacing:0.3px;text-transform:uppercase;">
                        ${escapeHtml(statusLabel)}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td class="title" style="padding-top:14px;font-size:26px;line-height:1.25;font-weight:700;color:#111827;">
                      ${escapeHtml(title)}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding-top:6px;font-size:13px;color:#6b7280;">
                      ${t.orderLabel} <span style="font-family:Menlo,Consolas,monospace;color:#374151;">#${escapeHtml(orderId.slice(0, 8))}</span>
                    </td>
                  </tr>

                  ${steps.currentIndex >= 0 ? `
                  <tr>
                    <td style="padding-top:26px;">${stepperHtml(steps.labels, steps.currentIndex)}</td>
                  </tr>` : ""}

                  <tr>
                    <td style="padding-top:26px;font-size:15px;line-height:1.6;color:#374151;">
                      ${t.greeting}<br>${escapeHtml(mainText)}
                    </td>
                  </tr>

                  ${deliveryAddress ? `
                  <tr>
                    <td style="padding-top:22px;">
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1px solid #f1f1f1;border-radius:12px;">
                        <tr>
                          <td style="padding:16px 18px;">
                            <div style="font-size:12px;font-weight:700;letter-spacing:0.6px;text-transform:uppercase;color:#9ca3af;padding-bottom:6px;">
                              ${escapeHtml(deliveryAddress.label)}
                            </div>
                            <div style="font-size:14px;line-height:1.55;color:#111827;">
                              ${deliveryAddress.lines.map((line, index) => index === 0 ? `<strong>${escapeHtml(line)}</strong>` : escapeHtml(line)).join("<br>")}
                            </div>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>` : ""}

                  <tr>
                    <td align="center" style="padding-top:26px;">
                      <a href="${escapeHtml(link)}" style="display:inline-block;background:${BRAND};color:#ffffff;padding:13px 26px;border-radius:10px;font-size:15px;font-weight:600;text-decoration:none;">
                        ${t.button}
                      </a>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding-top:32px;">
                      <div style="font-size:12px;font-weight:700;letter-spacing:0.6px;text-transform:uppercase;color:#9ca3af;padding-bottom:4px;">
                        ${t.recapTitle}
                      </div>
                      ${itemsHtml(parseOrderItems(orderItems), orderTotal, locale)}
                    </td>
                  </tr>

                  <tr>
                    <td style="padding-top:30px;border-bottom:1px solid #f1f1f1;font-size:0;line-height:0;">&nbsp;</td>
                  </tr>
                  <tr>
                    <td style="padding-top:20px;font-size:14px;line-height:1.5;color:#374151;">
                      ${t.thanks}<br><strong>${t.team}</strong>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td align="center" style="padding:20px 12px 0;font-size:12px;line-height:1.6;color:#9ca3af;">
                ${t.questions} :
                <a href="tel:${CONTACT_PHONE.replace(/\s/g, "")}" style="color:#6b7280;text-decoration:none;">${CONTACT_PHONE}</a>
                ·
                <a href="mailto:${CONTACT_EMAIL}" style="color:#6b7280;text-decoration:none;">${CONTACT_EMAIL}</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
