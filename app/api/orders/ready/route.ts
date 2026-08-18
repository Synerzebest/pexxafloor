import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { Resend } from "resend";
import { generateOrderEmailHtml } from "@/utils/EmailTemplate";
import { requireRole } from "@/lib/requireRole";

const resend = new Resend(process.env.RESEND_API_KEY);

type Locale = "fr" | "en" | "nl";

const translations = {
  fr: {
    titlePrefix: "Votre commande",
    statusReady: "Votre commande est prête à être expédiée 🚚✨",
    statusBadgeText: "Prête à être expédiée",
    mainText: (orderId: string) =>
      `Nous vous informons que votre commande <b>#${orderId.slice(
        0,
        8
      )}</b> a été préparée et est prête à quitter notre entrepôt.<br><br>Elle sera expédiée dans les plus brefs délais. Vous recevrez une notification dès que le colis sera pris en charge par le transporteur.`,
  },
  en: {
    titlePrefix: "Your order",
    statusReady: "Your order is ready to ship 🚚✨",
    statusBadgeText: "Ready to ship",
    mainText: (orderId: string) =>
      `We inform you that your order <b>#${orderId.slice(
        0,
        8
      )}</b> has been prepared and is ready to leave our warehouse.<br><br>It will be shipped as soon as possible. You will receive a tracking notification once the package is picked up by the carrier.`,
  },
  nl: {
    titlePrefix: "Uw bestelling",
    statusReady: "Uw bestelling is klaar voor verzending 🚚✨",
    statusBadgeText: "Klaar voor verzending",
    mainText: (orderId: string) =>
      `Wij informeren u dat uw bestelling <b>#${orderId.slice(
        0,
        8
      )}</b> is voorbereid en klaar is om ons magazijn te verlaten.<br><br>Het wordt zo snel mogelijk verzonden. U ontvangt een trackingmelding zodra het pakket door de vervoerder wordt opgehaald.`,
  },
};

export async function POST(req: Request) {
  const auth = await requireRole(["admin", "storekeeper"]);
  if (!auth.ok) return auth.response;

  try {
    const supabase = supabaseServer;
    const body = await req.json();
    const { order_id } = body;

    if (!order_id) {
      return NextResponse.json({ error: "order_id required" }, { status: 400 });
    }

    console.log(`LOG: Processing ready for order ${order_id}`);

    // === 0. Récupérer langue + user_id ===
    const { data: existingOrder, error: fetchError } = await supabase
      .from("orders")
      .select("language, user_id")
      .eq("id", order_id)
      .eq("status", "packed")
      .single();

    if (fetchError || !existingOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const locale: Locale = (existingOrder.language as Locale) || "en";
    const t = translations[locale];

    // === 1. Mettre à jour le statut ===
    const { data: updatedOrders, error: updateError } = await supabase
      .from("orders")
      .update({
        status: "ready",
        validated_at: new Date().toISOString(),
      })
      .eq("id", order_id)
      .select("*");

    if (updateError || !updatedOrders?.length) {
      console.error("Update error:", updateError);
      return NextResponse.json(
        { error: "Error updating order" },
        { status: 500 }
      );
    }

    const order = updatedOrders[0];
    const ORDER_LINK = `https://pexxafloor.com/orders/${order_id}`;
    const orderTotal = parseFloat(order.total).toFixed(2);

    // === 2. Récupérer l’email du client ===
    const { data: userData, error: userError } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", order.user_id)
      .single();

    if (userError || !userData) {
      console.error("User fetch error:", userError);
      return NextResponse.json(
        { error: "Unable to fetch user email" },
        { status: 500 }
      );
    }

    const clientEmail = userData.email;

    // === 3. Générer l’email HTML ===
    const htmlContent = generateOrderEmailHtml({
      orderId: order_id,
      orderItems: order.items,
      orderTotal: orderTotal,
      emailTitle: t.statusReady,
      mainText: t.mainText(order_id),
      statusBadgeText: t.statusBadgeText,
      statusBadgeBgColor: "#ecfdf5",
      statusBadgeTextColor: "#047857",
      link: ORDER_LINK,
      currentStep: 2,
      locale,
    });

    // === 4. Envoyer l’email ===
    const emailResponse = await resend.emails.send({
      from: "PexxaFloor <onboarding@resend.dev>",
      to: "cyfordunk@gmail.com",
      subject: `${t.titlePrefix} #${order_id.slice(0, 8)} - ${t.statusReady.replace(
        / 🚚✨$/,
        ""
      )}`,
      html: htmlContent,
    });

    console.log("Resend response:", emailResponse);

    return NextResponse.json({
      message: "Order marked as ready and email sent",
      order,
    });
  } catch (err) {
    console.error("Server error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
