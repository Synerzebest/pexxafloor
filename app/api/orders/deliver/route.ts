import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { Resend } from "resend";
import { generateOrderEmailHtml } from "@/utils/EmailTemplate"; 

// Typage langues
type Locale = "fr" | "en" | "nl";

// Toutes les traductions (idéalement dans un fichier séparé)
const translations = {
  fr: {
    titlePrefix: "Votre commande",
    statusDelivering: "Votre commande est en route ! 🚚💨",
    mainText: (orderId: string) =>
      `Bonne nouvelle ! Votre commande <b>#${orderId.slice(
        0,
        8
      )}</b> a quitté notre entrepôt et est actuellement en route vers vous.<br><br>Vous serez averti dès qu’elle sera livrée ou si un suivi supplémentaire est disponible.`,
  },
  en: {
    titlePrefix: "Your order",
    statusDelivering: "Your order is on the way! 🚚💨",
    mainText: (orderId: string) =>
      `Good news! Your order <b>#${orderId.slice(
        0,
        8
      )}</b> has left our warehouse and is currently on its way to you.<br><br>You will be notified when it is delivered or if further tracking information becomes available.`,
  },
  nl: {
    titlePrefix: "Uw bestelling",
    statusDelivering: "Uw bestelling is onderweg! 🚚💨",
    mainText: (orderId: string) =>
      `Goed nieuws! Uw bestelling <b>#${orderId.slice(
        0,
        8
      )}</b> heeft ons magazijn verlaten en is momenteel onderweg naar u.<br><br>U wordt op de hoogte gebracht zodra deze is geleverd of als er verdere traceerinformatie beschikbaar is.`,
  },
};

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const body = await req.json();
    const { order_id } = body;

    if (!order_id) {
      console.error("LOG: Missing order_id in request body.");
      return NextResponse.json({ error: "order_id required" }, { status: 400 });
    }

    console.log(`LOG: Processing order ID: ${order_id}`);

    // === 0. Récupérer l'ordre pour connaître la language ===
    const { data: existingOrder, error: fetchError } = await supabase
      .from("orders")
      .select("language, user_id")
      .eq("id", order_id)
      .single();

    if (fetchError || !existingOrder) {
      console.error("LOG: Cannot fetch order language:", fetchError);
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    const locale: Locale =
      (existingOrder.language as Locale) || "en";

    const t = translations[locale];

    // === 1. Mettre à jour la commande ===
    const { data: updatedOrders, error: updateError } = await supabase
      .from("orders")
      .update({
        status: "delivering",
        validated_at: new Date().toISOString(),
      })
      .eq("id", order_id)
      .select("*");

    if (updateError || !updatedOrders?.length) {
      console.error(
        "LOG: Supabase update error:",
        updateError || "Order not found"
      );
      return NextResponse.json(
        { error: "Error while updating or order not found" },
        { status: updateError ? 500 : 404 }
      );
    }

    const order = updatedOrders[0];
    const ORDER_LINK = `https://pexxafloor.com/orders/${order_id}`;
    const orderTotal = parseFloat(order.total).toFixed(2);

    // === 2. Récupérer email client ===
    const { data: userData, error: userError } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", order.user_id)
      .single();

    if (userError || !userData) {
      console.error("LOG: User fetch error:", userError);
      return NextResponse.json(
        { error: "Unable to fetch user email" },
        { status: 500 }
      );
    }

    const clientEmail = userData.email;
    console.log("LOG: Email will be sent to:", clientEmail);

    // === 3. Construire le HTML email ===
    const htmlContent = generateOrderEmailHtml({
      orderId: order_id,
      orderItems: order.items,
      orderTotal: orderTotal,
      emailTitle: t.statusDelivering,
      mainText: t.mainText(order_id),
      statusBadgeText: t.statusDelivering.replace(/ 🚚💨$/, ""),
      statusBadgeBgColor: "#eff6ff",
      statusBadgeTextColor: "#1d4ed8",
      link: ORDER_LINK,
      currentStep: 3,
      locale,
    });

    // === 4. Envoyer l’email ===
    const emailResponse = await resend.emails.send({
      from: "PexxaFloor <onboarding@resend.dev>",
      to: "cyfordunk@gmail.com",
      subject: `${t.titlePrefix} #${order_id.slice(0, 8)} - ${t.statusDelivering.replace(
        / 🚚💨$/,
        ""
      )}`,
      html: htmlContent,
    });

    console.log("Resend response:", emailResponse);

    return NextResponse.json({
      message: "Order updated to delivering and email sent",
      order,
    });
  } catch (err) {
    console.error("LOG: Server error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
