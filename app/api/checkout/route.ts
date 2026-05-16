import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseServer } from "@/lib/supabaseServer";
import type { CartItem } from "@/context/CartContext";
import { applyPackQuantityOverrides, computeDbPackProducts } from "@/utils/packDbCalculations";
import { fetchPackBySlug } from "@/utils/packRepository";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-07-30.basil",
});

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
  try {
    const body = (await req.json()) as CheckoutBody;

    const { items, email, user_id, locale, clientName, shipping } = body;
    const supabase = supabaseServer;

    // -------------------------
    // VALIDATION
    // -------------------------
    if (!items || items.length === 0) {
      return new Response("Panier vide", { status: 400 });
    }

    if (!email || !user_id) {
      return new Response("Utilisateur invalide", { status: 400 });
    }

    // -------------------------
    // 🔒 RÉCUPÉRER PROFIL (PRO ?)
    // -------------------------
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_pro")
      .eq("id", user_id)
      .single();

    const isPro = profile?.is_pro === true;

    // -------------------------
    // EXTRACTION IDS
    // -------------------------
    const productIds = items
      .filter((i) => i.type === "product")
      .map((i: any) => i.product_id)
      .filter((id): id is string => typeof id === "string" && id.length > 0);

    if (productIds.length === 0 && items.some(i => i.type === "product")) {
      return new Response("Produits invalides", { status: 400 });
    }

    // -------------------------
    // 🔒 FETCH PRODUITS + DISCOUNT
    // -------------------------
    let products: any[] = [];

    if (productIds.length > 0) {
      const { data, error } = await supabase
        .from("products")
        .select(`
          id,
          price,
          name_fr,
          subcategories (
            id,
            category_id,
            categories (
              id,
              discount
            )
          )
        `)
        .in("id", productIds);

      if (error || !data) {
        console.error("Erreur récupération produits:", error);
        return new Response("Erreur produits", { status: 500 });
      }

      products = data;
    }

    const productMap = new Map(products.map((p) => [p.id, p]));

    // -------------------------
    // 💰 RECONSTRUCTION SERVEUR
    // -------------------------
    let computedTotal = 0;

    const normalizedItems: CartItem[] = [];
    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

    for (const item of items as any[]) {
      if (item.type === "product") {
        const dbProduct = productMap.get(item.product_id);

        if (!dbProduct) {
          throw new Error(`Produit invalide: ${item.product_id}`);
        }

        // 🔥 RÉCUP DISCOUNT
        const discount =
          dbProduct.subcategories?.categories?.discount ?? 0;

        let unitPrice = Number(dbProduct.price);

        // 🔥 APPLICATION PRO
        if (isPro && discount > 0) {
          unitPrice = unitPrice * (1 - discount / 100);
        }

        const quantity = item.quantity;
        const lineTotal = unitPrice * quantity;

        computedTotal += lineTotal;

        normalizedItems.push({
          ...item,
          unit_price: Number(unitPrice.toFixed(2)),
          base_price: Number(Number(dbProduct.price).toFixed(2)),
        });

        line_items.push({
          price_data: {
            currency: "eur",
            product_data: {
              name: dbProduct.name_fr,
            },
            unit_amount: Math.round(unitPrice * 100),
          },
          quantity,
        });

        continue;
      }

      if (item.type === "pack") {
        const { pack, error } = await fetchPackBySlug(supabase, item.slug);

        if (error || !pack) {
          throw new Error(`Pack invalide: ${item.slug}`);
        }

        const computedPack = computeDbPackProducts({
          pack,
          surface: Number(item.surface),
          pasDePose: Number(item.pasDePose),
          tuyauType: item.tuyauType as "PERT" | "PERT-AL-PERT",
          typeAgrafe: Number(item.typeAgrafe) as 40 | 60,
          typeIsolation: Number(item.typeIsolation) as 0 | 15 | 30,
          selectedOptions: item.selectedOptions || {},
        });
        const result = applyPackQuantityOverrides(computedPack, item.quantities);

        const quantity = Number(item.quantity || 1);
        computedTotal += result.total * quantity;

        normalizedItems.push({
          ...item,
          pack_id: pack.id,
          quantities: result.quantities,
          products: [
            ...result.products,
            ...result.included,
            ...result.options.filter((option) => item.selectedOptions?.[option.id]),
          ].map((product) => ({
            id: product.id,
            pack_item_id: product.pack_item_id,
            product_id: product.product_id,
            description: product.description,
            unit_price: product.price,
            image: product.image,
            reference: product.reference,
            total_price: product.price * (result.quantities[product.id] ?? 1),
          })),
          total: result.total,
          quantity,
        });

        line_items.push({
            price_data: {
              currency: "eur",
              product_data: {
                name: pack.name_fr,
              },
              unit_amount: Math.round(result.total * 100),
            },
            quantity,
        });
      }
    }

    // -------------------------
    // INSERT PANIER
    // -------------------------
    const { data: inserted, error: insertError } = await supabase
      .from("carts_temp")
      .insert({
        user_id,
        items: normalizedItems,
        client_name: clientName,
        shipping,
      })
      .select()
      .single();

    if (insertError || !inserted) {
      console.error("Erreur insertion panier:", insertError);
      return new Response("Erreur panier", { status: 500 });
    }

    // -------------------------
    // STRIPE
    // -------------------------
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

  } catch (err) {
    console.error("Erreur checkout:", err);
    return new Response("Erreur serveur", { status: 500 });
  }
}
