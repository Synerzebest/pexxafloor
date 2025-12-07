import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { Resend } from "resend";
import { generateOrderEmailHtml } from "@/utils/EmailTemplate";

const resend = new Resend(process.env.RESEND_API_KEY);

type Locale = "fr" | "en" | "nl";

// Traductions
const translations = {
  fr: {
    titlePrefix: "Votre commande",
    statusDelivered: "Votre commande a été livrée 📦",
    mainText: (date: string) =>
      `Votre commande a été livrée avec succès.<br><br><b>Date de livraison :</b> ${date}<br><br>Nous espérons qu’elle vous apportera entière satisfaction.`,
  },
  en: {
    titlePrefix: "Your order",
    statusDelivered: "Your order has been delivered 📦",
    mainText: (date: string) =>
      `Your order has been delivered successfully.<br><br><b>Delivery Date:</b> ${date}<br><br>We hope it brings you complete satisfaction.`,
  },
  nl: {
    titlePrefix: "Uw bestelling",
    statusDelivered: "Uw bestelling is geleverd 📦",
    mainText: (date: string) =>
      `Uw bestelling is succesvol geleverd.<br><br><b>Leveringsdatum:</b> ${date}<br><br>We hopen dat u er veel plezier van zult hebben.`,
  },
};

export async function POST(req: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const body = await req.json();

    const { order_id } = body;

    if (!order_id) {
      return NextResponse.json({ error: "order_id required" }, { status: 400 });
    }

    console.log(`LOG: Processing delivered for order ${order_id}`);

    // === 0. Fetch order to get language + user_id ===
    const { data: existingOrder, error: fetchError } = await supabase
      .from("orders")
      .select("language, user_id")
      .eq("id", order_id)
      .single();

    if (fetchError || !existingOrder) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // Locale provenant de la DB
    const locale: Locale = (existingOrder.language as Locale) || "en";
    const t = translations[locale];

    // === 1. Format date ===
    const deliveredAt = new Date();
    const deliveredAtFormatted = new Intl.DateTimeFormat(locale, {
      dateStyle: "full",
      timeStyle: "short",
    }).format(deliveredAt);

    // === 2. Update order ===
    const { data: updatedOrders, error: updateError } = await supabase
      .from("orders")
      .update({
        status: "delivered",
        validated_at: deliveredAt.toISOString(),
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

    // === 3. Fetch user email ===
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

    // Build main text with formatted date
    const mainText = t.mainText(deliveredAtFormatted);

    // === 4. Generate HTML ===
    const htmlContent = generateOrderEmailHtml({
      orderId: order_id,
      orderItems: order.items,
      orderTotal: orderTotal,
      emailTitle: t.statusDelivered,
      mainText: mainText,
      statusBadgeText: t.statusDelivered.replace(/ 📦$/, ""),
      statusBadgeBgColor: "#f0fdf4",
      statusBadgeTextColor: "#166534",
      link: ORDER_LINK,
      currentStep: 4,
      locale: locale,
    });

    // === 5. Send Email ===
    const emailResponse = await resend.emails.send({
      from: "PexxaFloor <onboarding@resend.dev>",
      to: "cyfordunk@gmail.com",
      subject: `${t.titlePrefix} #${order_id.slice(0, 8)} - ${t.statusDelivered.replace(
        / 📦$/,
        ""
      )}`,
      html: htmlContent,
    });

    console.log("Resend:", emailResponse);

    return NextResponse.json({
      message: "Order delivered and email sent",
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
