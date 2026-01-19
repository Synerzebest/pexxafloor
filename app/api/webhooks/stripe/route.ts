export const runtime = "nodejs";

import Stripe from "stripe";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { CartItem } from "@/context/CartContext";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-07-30.basil",
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
  const sig = req.headers.get("stripe-signature")!;
  const body = await req.text();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: unknown) {
    const message =
      err instanceof Stripe.errors.StripeError ? err.message : "Unknown error";

    return new Response(`Webhook Error: ${message}`, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const metadata = session.metadata as unknown as CheckoutMetadata;

    const cartId = metadata.cart_id;
    const userId = metadata.user_id;

    // Récupérer le panier complet
    const { data: cart, error: cartError } = await supabase
      .from("carts_temp")
      .select("items")
      .eq("id", cartId)
      .single<TempCart>();

    if (cartError) {
      console.error("Erreur récupération panier:", cartError);
      return new Response("Erreur panier", { status: 500 });
    }

    if (cart) {
      const { error: insertError } = await supabase.from("orders").insert({
        user_id: userId,
        status: "paid",
        total: session.amount_total ? session.amount_total / 100 : null,
        items: cart.items, // typé CartItem[]
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
        return new Response("Erreur insertion commande", { status: 500 });
      }

      // Nettoyage
      await supabase.from("carts_temp").delete().eq("id", cartId);

      console.log("✅ Commande enregistrée pour l'utilisateur:", userId);
    }
  }

  return NextResponse.json({ received: true });
}
