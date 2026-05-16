export const runtime = "nodejs";

import Stripe from "stripe";
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import type { CartItem } from "@/context/CartContext";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-07-30.basil",
});

const supabase = supabaseServer;

// ---- Types ----
interface CheckoutMetadata {
  cart_id: string;
  user_id: string;
  client_name?: string | null;
  address?: string | null;
  postal_code?: string | null;
  city?: string | null;
  country?: string | null;
  language?: string | null;
}

interface TempCart {
  items: CartItem[];
}

// ---- Handler ----
export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return new Response("Missing signature", { status: 400 });
  }

  const body = await req.text();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Signature invalide", err);
    return new Response("Invalid signature", { status: 400 });
  }

  const eventId = event.id;

  try {
    // vérifier si déjà traité
    const { data: existing } = await supabase
      .from("stripe_events")
      .select("id")
      .eq("id", eventId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ received: true });
    }

    // Enregistrer l’event (lock logique)
    await supabase.from("stripe_events").insert({
      id: eventId,
      type: event.type,
      created_at: new Date().toISOString(),
    });

    // ---- HANDLING ----
    if (
      event.type === "checkout.session.completed" ||
      event.type === "checkout.session.async_payment_succeeded"
    ) {
      const session = event.data.object as Stripe.Checkout.Session;

      // Vérifier que le paiement est OK
      if (session.payment_status !== "paid") {
        console.warn("⚠️ Session non payée:", session.id);
        return NextResponse.json({ received: true });
      }

      const metadata = session.metadata as unknown as CheckoutMetadata;

      const cartId = metadata.cart_id;
      const userId = metadata.user_id;

      // vérifier si commande déjà traitée
      const { data: existingOrder } = await supabase
        .from("orders")
        .select("id")
        .eq("stripe_session_id", session.id)
        .maybeSingle();

      if (existingOrder) {
        return NextResponse.json({ received: true });
      }

      // Récupérer le panier
      const { data: cart, error: cartError } = await supabase
        .from("carts_temp")
        .select("items")
        .eq("id", cartId)
        .single<TempCart>();

      if (cartError || !cart) {
        console.error("Panier introuvable:", cartError);
        // On ne throw pas sinon Stripe retry en boucle
        return NextResponse.json({ received: true });
      }

      // Création commande
      const { error: insertError } = await supabase.from("orders").insert({
        user_id: userId,
        stripe_session_id: session.id,
        status: "paid",
        total: session.amount_total
          ? session.amount_total / 100
          : null,
        items: cart.items,
        client_name: metadata.client_name,
        address: metadata.address,
        postal_code: metadata.postal_code,
        city: metadata.city,
        country: metadata.country,
        language: metadata.language,
        created_at: new Date().toISOString(),
      });

      if (insertError) {
        console.error("Erreur insertion commande:", insertError);
        return NextResponse.json({ received: true });
      }

      // Nettoyage panier
      await supabase.from("carts_temp").delete().eq("id", cartId);

      console.log("Commande créée:", {
        session: session.id,
        user: userId,
      });
    }

    // (optionnel)
    if (event.type === "checkout.session.async_payment_failed") {
      const session = event.data.object as Stripe.Checkout.Session;
      console.warn("Paiement échoué:", session.id);
    }

    return NextResponse.json({ received: true });

  } catch (err) {
    console.error("Erreur webhook globale:", err);

    return NextResponse.json({ received: true });
  }
}