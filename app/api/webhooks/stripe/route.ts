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
  credit_reservation_id?: string | null;
  credit_cents?: string | null;
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
      if (
        session.payment_status !== "paid" &&
        session.payment_status !== "no_payment_required"
      ) {
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
        const { error: creditError } = await supabase.rpc("consume_pro_credit", {
          p_stripe_session_id: session.id,
          p_order_id: existingOrder.id,
        });

        if (creditError) {
          await supabase.from("stripe_events").delete().eq("id", eventId);
          return NextResponse.json(
            { error: "Credit processing failed" },
            { status: 500 }
          );
        }

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
        await supabase.from("stripe_events").delete().eq("id", eventId);
        return NextResponse.json({ error: "Cart not found" }, { status: 500 });
      }

      // Création commande
      const { data: order, error: insertError } = await supabase
        .from("orders")
        .insert({
          user_id: userId,
          stripe_session_id: session.id,
          status: "paid",
          total:
            session.amount_total !== null && session.amount_total !== undefined
              ? session.amount_total / 100
              : 0,
          items: cart.items,
          client_name: metadata.client_name,
          address: metadata.address,
          postal_code: metadata.postal_code,
          city: metadata.city,
          country: metadata.country,
          language: metadata.language,
          created_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (insertError || !order) {
        console.error("Erreur insertion commande:", insertError);
        await supabase.from("stripe_events").delete().eq("id", eventId);
        return NextResponse.json(
          { error: "Order creation failed" },
          { status: 500 }
        );
      }

      const { error: creditError } = await supabase.rpc("consume_pro_credit", {
        p_stripe_session_id: session.id,
        p_order_id: order.id,
      });

      if (creditError) {
        console.error("Erreur consommation crédit:", creditError);
        await supabase.from("stripe_events").delete().eq("id", eventId);
        return NextResponse.json(
          { error: "Credit processing failed" },
          { status: 500 }
        );
      }

      // Nettoyage panier
      await supabase.from("carts_temp").delete().eq("id", cartId);

      console.log("Commande créée:", {
        session: session.id,
        user: userId,
      });
    }

    if (
      event.type === "checkout.session.async_payment_failed" ||
      event.type === "checkout.session.expired"
    ) {
      const session = event.data.object as Stripe.Checkout.Session;
      const { error: releaseError } = await supabase.rpc("release_pro_credit", {
        p_stripe_session_id: session.id,
        p_reservation_id: null,
      });

      if (releaseError) {
        console.error("Erreur restitution crédit:", releaseError);
        await supabase.from("stripe_events").delete().eq("id", eventId);
        return NextResponse.json(
          { error: "Credit release failed" },
          { status: 500 }
        );
      }

      const metadata = session.metadata as unknown as CheckoutMetadata;
      if (metadata?.cart_id) {
        await supabase.from("carts_temp").delete().eq("id", metadata.cart_id);
      }

      console.warn("Paiement échoué ou session expirée:", session.id);
    }

    return NextResponse.json({ received: true });

  } catch (err) {
    console.error("Erreur webhook globale:", err);
    await supabase.from("stripe_events").delete().eq("id", eventId);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
