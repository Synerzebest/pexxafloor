import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import type { CartItem, PackItem, ProductItem } from "@/context/CartContext";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-07-30.basil",
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);


interface ShippingInfo {
  address: string;
  postalCode: string;
  city: string;
  country: string;
  locale: string;
}

interface CheckoutBody {
  items: CartItem[];
  email: string;
  user_id: string;
  locale: string;
  clientName: string;
  shipping: ShippingInfo;
}


export async function POST(req: Request) {
  const body = (await req.json()) as CheckoutBody;
  const { items, email, user_id, locale, clientName, shipping } = body;

  // Enregistrer le panier dans Supabase
  const { data: inserted, error } = await supabase
    .from("carts_temp")
    .insert({
      user_id,
      items,
      client_name: clientName,
      shipping,
    })
    .select()
    .single();

  if (error) {
    console.error("Erreur insertion panier:", error);
    return new Response("Erreur panier", { status: 500 });
  }

  // Préparation typée des line_items Stripe
  const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map(
    (item: CartItem) => {
      if (item.type === "product") {
        const unit_amount = Math.round(item.product!.price * 100);

        return {
          price_data: {
            currency: "eur",
            product_data: {
              name: item.product!.name,
            },
            unit_amount,
          },
          quantity: item.quantity,
        };
      }

      // PACKS
      const pack = item as PackItem;
      const unit_amount = Math.round(pack.total * 100);

      return {
        price_data: {
          currency: "eur",
          product_data: {
            name: `Pack ${pack.slug} (${pack.surface}m², ${pack.tuyauType})`,
          },
          unit_amount,
        },
        quantity: pack.quantity,
      };
    }
  );

  // Création de la session Stripe
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: email,
    line_items,
    metadata: {
      user_id,
      cart_id: inserted.id,
      client_name: clientName,
      address: shipping.address,
      postal_code: shipping.postalCode,
      city: shipping.city,
      country: shipping.country,
      language: shipping.locale,
    },
    success_url: `${process.env.NEXT_PUBLIC_URL}/${locale}/success`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/${locale}/cart`,
  });

  return NextResponse.json({ url: session.url });
}
