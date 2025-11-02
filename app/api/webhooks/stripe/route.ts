import Stripe from "stripe";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-07-30.basil",
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! 
);

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
  } catch (err: any) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const cartId = session.metadata?.cart_id;
    const userId = session.metadata?.user_id;
  
    // Récupérer le panier complet
    const { data: cart } = await supabase
      .from("carts_temp")
      .select("items")
      .eq("id", cartId)
      .single();
  
    if (cart) {
      await supabase.from("orders").insert({
        user_id: userId,
        status: "paid",
        total: session.amount_total! / 100,
        items: cart.items, // JSON complet
      });
  
      // Optionnel : supprimer la donnée temporaire
      await supabase.from("carts_temp").delete().eq("id", cartId);
    }
  }  

  return NextResponse.json({ received: true });
}
