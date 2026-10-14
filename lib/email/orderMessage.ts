import { generateOrderEmailHtml } from "@/utils/EmailTemplate";
import fr from "@/messages/fr.json";
import en from "@/messages/en.json";
import nl from "@/messages/nl.json";

export type EmailLocale = "fr" | "en" | "nl";
export type OrderEmailStatus = "paid" | "preparing" | "packed" | "ready" | "delivering" | "delivered" | "cancelled";
export type OrderEmailSnapshot = {
  id: string;
  user_id: string;
  language?: string;
  items: unknown;
  total: number | string;
  status: OrderEmailStatus;
};

export type ShippingAddress = {
  client_name?: string | null;
  address?: string | null;
  postal_code?: string | null;
  city?: string | null;
  country?: string | null;
};

// "packed" is an internal warehouse step: the customer is not emailed about it
export const CUSTOMER_EMAIL_STATUSES: OrderEmailStatus[] = ["paid", "preparing", "ready", "delivering", "delivered", "cancelled"];
export const sendsCustomerEmail = (status: string) =>
  (CUSTOMER_EMAIL_STATUSES as string[]).includes(status);

// Steps shown to the customer, in workflow order
const CUSTOMER_STEPS: OrderEmailStatus[] = ["paid", "preparing", "ready", "delivering", "delivered"];

// Status labels come from the site translations, so the email says exactly what the site shows
const statusLabels: Record<EmailLocale, Record<string, string>> = {
  fr: fr.Common.orderStatus,
  en: en.Common.orderStatus,
  nl: nl.Common.orderStatus,
};

type EmailCopy = { title: string; text: string };

const copy: Record<EmailLocale, { prefix: string; button: string; deliveryAddress: string } & Record<Exclude<OrderEmailStatus, "packed">, EmailCopy>> = {
  fr: {
    prefix: "Commande", button: "Suivre ma commande", deliveryAddress: "Adresse de livraison",
    paid: { title: "Votre commande est confirmée", text: "Merci pour votre commande ! Nous l’avons bien reçue et vous préviendrons dès le début de sa préparation." },
    preparing: { title: "Votre commande est en préparation", text: "Nous préparons votre commande. Vous serez informé à chaque étape." },
    ready: { title: "Votre commande est prête", text: "Votre commande est prête et va bientôt quitter notre entrepôt. Nous vous préviendrons de son départ." },
    delivering: { title: "Votre commande est en livraison", text: "Votre commande a quitté notre entrepôt et est en route vers vous." },
    delivered: { title: "Votre commande est livrée", text: "Votre commande a été livrée. Merci pour votre confiance !" },
    cancelled: { title: "Votre commande est annulée", text: "Votre commande a été annulée. Contactez-nous pour toute question concernant votre commande ou son paiement." },
  },
  en: {
    prefix: "Order", button: "Track my order", deliveryAddress: "Delivery address",
    paid: { title: "Your order is confirmed", text: "Thank you for your order! We have received it and will let you know as soon as preparation begins." },
    preparing: { title: "Your order is being prepared", text: "We are preparing your order and will keep you informed at every step." },
    ready: { title: "Your order is ready", text: "Your order is ready and will soon leave our warehouse. We will let you know when it departs." },
    delivering: { title: "Your order is out for delivery", text: "Your order has left our warehouse and is on its way to you." },
    delivered: { title: "Your order has been delivered", text: "Your order has been delivered. Thank you for your trust!" },
    cancelled: { title: "Your order has been cancelled", text: "Your order has been cancelled. Please contact us with any questions about your order or payment." },
  },
  nl: {
    prefix: "Bestelling", button: "Mijn bestelling volgen", deliveryAddress: "Leveringsadres",
    paid: { title: "Uw bestelling is bevestigd", text: "Bedankt voor uw bestelling! We hebben ze goed ontvangen en laten u weten zodra de voorbereiding begint." },
    preparing: { title: "Uw bestelling is in voorbereiding", text: "We bereiden uw bestelling voor en houden u bij elke stap op de hoogte." },
    ready: { title: "Uw bestelling is klaar", text: "Uw bestelling is klaar en verlaat binnenkort ons magazijn. We laten u weten wanneer ze vertrekt." },
    delivering: { title: "Uw bestelling is onderweg", text: "Uw bestelling heeft ons magazijn verlaten en is onderweg naar u." },
    delivered: { title: "Uw bestelling is geleverd", text: "Uw bestelling is geleverd. Bedankt voor uw vertrouwen!" },
    cancelled: { title: "Uw bestelling is geannuleerd", text: "Uw bestelling is geannuleerd. Neem contact met ons op als u vragen hebt over uw bestelling of betaling." },
  },
};

export function buildOrderMessage(order: OrderEmailSnapshot, siteUrl: string, shippingAddress?: ShippingAddress) {
  if (!sendsCustomerEmail(order.status)) throw new Error(`No customer email for status ${order.status}`);
  const status = order.status as Exclude<OrderEmailStatus, "packed">;
  const locale: EmailLocale = order.language === "fr" || order.language === "nl" ? order.language : "en";
  const t = copy[locale];
  const { title, text } = t[status];
  const statusLabel = statusLabels[locale][status] ?? status;
  const link = new URL(`/${locale}/profile`, siteUrl).toString();
  const total = Number(order.total);
  if (!Number.isFinite(total)) throw new Error("Invalid order total");
  const orderRef = `#${order.id.slice(0, 8)}`;
  const addressLines = shippingAddress
    ? [
        shippingAddress.client_name,
        shippingAddress.address,
        [shippingAddress.postal_code, shippingAddress.city].filter(Boolean).join(" "),
        shippingAddress.country,
      ].filter((line): line is string => Boolean(line && line.trim()))
    : [];

  return {
    subject: `PexxaFloor · ${title} · ${t.prefix} ${orderRef}`,
    text: [
      `${statusLabel.toUpperCase()}\n${title}`,
      text,
      addressLines.length ? `${t.deliveryAddress}:\n${addressLines.join("\n")}` : null,
      `${t.prefix} ${orderRef}\n${total.toFixed(2)} EUR`,
      `${t.button}: ${link}`,
    ].filter(Boolean).join("\n\n"),
    html: generateOrderEmailHtml({
      orderId: order.id,
      orderItems: order.items,
      orderTotal: total,
      title,
      mainText: text,
      statusLabel,
      steps: {
        labels: CUSTOMER_STEPS.map((step) => statusLabels[locale][step] ?? step),
        currentIndex: CUSTOMER_STEPS.indexOf(status),
      },
      cancelled: status === "cancelled",
      deliveryAddress: addressLines.length ? { label: t.deliveryAddress, lines: addressLines } : undefined,
      link,
      siteUrl,
      locale,
    }),
  };
}
