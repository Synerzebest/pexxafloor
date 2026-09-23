import { generateOrderEmailHtml } from "@/utils/EmailTemplate";

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

const copy = {
  fr: {
    prefix: "Votre commande", button: "Voir mes commandes",
    paid: ["Commande confirmée", "Merci pour votre commande ! Votre paiement a été confirmé. Nous vous informerons dès le début de sa préparation."],
    preparing: ["Commande en préparation", "Nous commençons la préparation de votre commande. Vous serez informé de son évolution."],
    packed: ["Commande emballée", "Votre commande est emballée et vérifiée. Elle sera bientôt prête à être expédiée."],
    ready: ["Commande prête à expédier", "Votre commande est prête à quitter notre entrepôt. Nous vous informerons dès son départ."],
    delivering: ["Commande en livraison", "Votre commande a quitté notre entrepôt et est en route vers vous."],
    delivered: ["Commande livrée", "Votre commande a été livrée. Merci pour votre confiance !"],
    cancelled: ["Commande annulée", "Votre commande a été annulée. Contactez-nous pour toute question concernant votre commande ou son paiement."],
  },
  en: {
    prefix: "Your order", button: "View my orders",
    paid: ["Order confirmed", "Thank you for your order! Your payment has been confirmed. We will notify you when preparation begins."],
    preparing: ["Order being prepared", "We are starting to prepare your order and will keep you informed of its progress."],
    packed: ["Order packed", "Your order has been packed and checked. It will soon be ready to ship."],
    ready: ["Order ready to ship", "Your order is ready to leave our warehouse. We will notify you when it departs."],
    delivering: ["Order on the way", "Your order has left our warehouse and is on its way to you."],
    delivered: ["Order delivered", "Your order has been delivered. Thank you for your trust!"],
    cancelled: ["Order cancelled", "Your order has been cancelled. Please contact us with any questions about your order or payment."],
  },
  nl: {
    prefix: "Uw bestelling", button: "Mijn bestellingen bekijken",
    paid: ["Bestelling bevestigd", "Bedankt voor uw bestelling! Uw betaling is bevestigd. Wij laten u weten wanneer de voorbereiding begint."],
    preparing: ["Bestelling in voorbereiding", "We beginnen met het voorbereiden van uw bestelling en houden u op de hoogte."],
    packed: ["Bestelling ingepakt", "Uw bestelling is ingepakt en gecontroleerd. Ze is binnenkort klaar voor verzending."],
    ready: ["Bestelling klaar voor verzending", "Uw bestelling is klaar om ons magazijn te verlaten. Wij informeren u zodra ze vertrekt."],
    delivering: ["Bestelling onderweg", "Uw bestelling heeft ons magazijn verlaten en is onderweg naar u."],
    delivered: ["Bestelling geleverd", "Uw bestelling is geleverd. Bedankt voor uw vertrouwen!"],
    cancelled: ["Bestelling geannuleerd", "Uw bestelling is geannuleerd. Neem contact met ons op als u vragen hebt over uw bestelling of betaling."],
  },
};

export function buildOrderMessage(order: OrderEmailSnapshot, siteUrl: string) {
  const locale: EmailLocale = order.language === "fr" || order.language === "nl" ? order.language : "en";
  const t = copy[locale];
  const [title, mainText] = t[order.status];
  const link = new URL(`/${locale}/profile`, siteUrl).toString();
  const total = Number(order.total);
  if (!Number.isFinite(total)) throw new Error("Invalid order total");
  const steps = { paid: 0, preparing: 1, packed: 1, ready: 2, delivering: 3, delivered: 4, cancelled: -1 };
  return {
    subject: `${t.prefix} #${order.id.slice(0, 8)} — ${title}`,
    text: `${title}\n\n${mainText}\n\n${t.prefix} #${order.id.slice(0, 8)}\n${total.toFixed(2)} EUR\n\n${t.button}: ${link}`,
    html: generateOrderEmailHtml({
      orderId: order.id, orderItems: order.items, orderTotal: total.toFixed(2),
      emailTitle: title, mainText, statusBadgeText: title,
      statusBadgeBgColor: "#fff7ed", statusBadgeTextColor: "#c2410c",
      link, currentStep: steps[order.status], locale,
    }),
  };
}
