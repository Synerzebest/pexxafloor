import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-07-30.basil",
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const body = await req.json();
  const { items, email, user_id, locale } = body;

  // 1️⃣ Enregistrer le panier complet dans Supabase (table: carts_temp)
  const { data: inserted, error } = await supabase
    .from("carts_temp")
    .insert({
      user_id,
      items, // JSON complet ici
    })
    .select()
    .single();

  if (error) {
    console.error("Erreur insertion panier:", error);
    return new Response("Erreur panier", { status: 500 });
  }

  // 2️⃣ Créer la session Stripe avec un ID court en metadata
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: email,
    line_items: items.map((item: any) => ({
      price_data: {
        currency: "eur",
        product_data: {
          name:
            item.type === "pack"
              ? `Pack ${item.slug} (${item.surface}m², ${item.tuyauType})`
              : item.product?.name,
        },
        unit_amount: Math.round(
          item.type === "pack"
            ? item.total * 100
            : item.product?.price * 100
        ),
      },
      quantity: item.quantity,
    })),
    metadata: {
      user_id,
      cart_id: inserted.id, // ✅ on envoie juste un identifiant court
    },
    success_url: `${process.env.NEXT_PUBLIC_URL}/${locale}/success`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/${locale}/cart`,
  });

  return NextResponse.json({ url: session.url });
}
