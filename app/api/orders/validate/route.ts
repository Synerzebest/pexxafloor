import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { Resend } from "resend";
import { generateOrderEmailHtml } from "@/utils/EmailTemplate";

const resend = new Resend(process.env.RESEND_API_KEY);

type Locale = "fr" | "en" | "nl";

const translations = {
  fr: {
    titlePrefix: "Votre commande",
    statusPreparing: "Votre commande est en préparation 🛠️",
    statusBadgeText: "En préparation",
    nextStep: "Prête à expédier",
    mainText: (orderId: string, nextStep: string) =>
      `Nous vous remercions pour votre commande !<br><br>
      Nous allons maintenant commencer sa préparation et vous tiendrons au courant de son évolution.
      Elle passera à l'étape <b>${nextStep}</b> bientôt.`,
  },
  en: {
    titlePrefix: "Your order",
    statusPreparing: "Your order is being prepared 🛠️",
    statusBadgeText: "In preparation",
    nextStep: "Ready to ship",
    mainText: (orderId: string, nextStep: string) =>
      `Thank you for your order!<br><br>
      We are now starting its preparation and will keep you informed of its progress.
      It will move to the <b>${nextStep}</b> stage soon.`,
  },
  nl: {
    titlePrefix: "Uw bestelling",
    statusPreparing: "Uw bestelling wordt voorbereid 🛠️",
    statusBadgeText: "In voorbereiding",
    nextStep: "Klaar voor verzending",
    mainText: (orderId: string, nextStep: string) =>
      `Bedankt voor uw bestelling!<br><br>
      We beginnen nu met de voorbereiding en houden u op de hoogte van de voortgang.
      Het zal binnenkort naar de fase <b>${nextStep}</b> gaan.`,
  },
};

export async function POST(req: Request) {
  try {
    const supabase = supabaseServer;
    const body = await req.json();
    const { order_id } = body;

    if (!order_id) {
      return NextResponse.json(
        { error: "order_id required" },
        { status: 400 }
      );
    }

    console.log(`LOG: Processing PREPARING for order ${order_id}`);

    // === 0. Fetch order to get language + user_id ===
    const { data: existingOrder, error: fetchError } = await supabase
      .from("orders")
      .select("language, user_id")
      .eq("id", order_id)
      .single();

    if (fetchError || !existingOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const locale: Locale = (existingOrder.language as Locale) || "en";
    const t = translations[locale];

    // === 1. Update order status ===
    const { data: updatedOrders, error: updateError } = await supabase
      .from("orders")
      .update({
        status: "preparing",
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

    // === 2. Fetch user email ===
    const { data: userData, error: userError } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", order.user_id)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { error: "Unable to fetch user email" },
        { status: 500 }
      );
    }

    const clientEmail = userData.email;

    // === 3. Build email HTML ===
    const htmlContent = generateOrderEmailHtml({
      orderId: order_id,
      orderItems: order.items,
      orderTotal: orderTotal,
      emailTitle: t.statusPreparing,
      mainText: t.mainText(order_id, t.nextStep),
      statusBadgeText: t.statusBadgeText,
      statusBadgeBgColor: "#fff7ed",
      statusBadgeTextColor: "#c2410c",
      link: ORDER_LINK,
      currentStep: 1,
      locale,
    });

    // === 4. Send email ===
    const emailResponse = await resend.emails.send({
      from: "PexxaFloor <onboarding@resend.dev>",
      to: "cyfordunk@gmail.com",
      subject: `${t.titlePrefix} #${order_id.slice(0, 8)} - ${t.statusPreparing.replace(
        / 🛠️$/,
        ""
      )}`,
      html: htmlContent,
    });

    console.log("Resend response:", emailResponse);

    return NextResponse.json({
      message: "Order marked as preparing and email sent",
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
