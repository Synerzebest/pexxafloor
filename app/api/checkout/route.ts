import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseServer } from "@/lib/supabaseServer";
import type { CartItem } from "@/context/CartContext";
import { applyPackQuantityOverrides, computeDbPackProducts } from "@/utils/packDbCalculations";
import { fetchPackBySlug } from "@/utils/packRepository";
import { createSupabaseServerAuthClient } from "@/lib/supabaseServerAuth";
import {
  applyProDiscountToPack,
  getProPricingContext,
  resolveProDiscount,
} from "@/utils/proCategoryDiscounts";

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
  locale: string;
  shipping: ShippingInfo;
  saveAddress?: boolean;
  savedAddressId?: string | null;
}

export async function POST(req: Request) {
  let cartId: string | null = null;
  let creditReservationId: string | null = null;
  let stripeSessionId: string | null = null;

  try {
    const supabaseAuth = await createSupabaseServerAuthClient();
    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser();

    if (authError || !user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as CheckoutBody;

    const { items, locale, shipping, saveAddress, savedAddressId } = body;
    const supabase = supabaseServer;

    // -------------------------
    // VALIDATION
    // -------------------------
    if (!items || items.length === 0) {
      return new Response("Panier vide", { status: 400 });
    }

    if (
      !shipping?.address?.trim() ||
      !shipping?.postalCode?.trim() ||
      !shipping?.city?.trim() ||
      !shipping?.country?.trim()
    ) {
      return NextResponse.json(
        { error: "Informations de livraison invalides" },
        { status: 400 }
      );
    }

    // -------------------------
    // 🔒 RÉCUPÉRER PROFIL (PRO ?)
    // -------------------------
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("is_pro, name, company_name")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error("Erreur récupération profil checkout:", profileError);
      return NextResponse.json({ error: "Profil introuvable" }, { status: 500 });
    }

    const clientName = String(
      profile?.company_name ||
      profile?.name ||
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email
    ).trim();

    const isPro = profile?.is_pro === true;
    const pricingContext = await getProPricingContext(supabase, user.id);

    // Une adresse n'est enregistrée que sur consentement explicite. Lorsqu'une
    // adresse existante est réutilisée, sa date d'utilisation est actualisée.
    if (savedAddressId) {
      const { error: addressUpdateError } = await supabase
        .from("shipping_addresses")
        .update({ last_used_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq("id", savedAddressId)
        .eq("user_id", user.id);

      if (addressUpdateError) throw addressUpdateError;
    } else if (saveAddress === true) {
      const now = new Date().toISOString();
      const { error: addressSaveError } = await supabase
        .from("shipping_addresses")
        .upsert(
          {
            user_id: user.id,
            address: shipping.address.trim(),
            postal_code: shipping.postalCode.trim(),
            city: shipping.city.trim(),
            country: shipping.country.trim(),
            updated_at: now,
            last_used_at: now,
          },
          { onConflict: "user_id,address,postal_code,city,country" }
        );

      if (addressSaveError) throw addressSaveError;
    }

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
          reference,
          product_images!fk_product (
            image_url
          ),
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
        const category = dbProduct.subcategories?.categories;
        const discount = resolveProDiscount(
          category?.id,
          category?.discount,
          pricingContext
        );

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
          image: dbProduct.product_images?.[0]?.image_url || item.image || item.product?.image,
          reference: dbProduct.reference || null,
          product: {
            ...item.product,
            name: item.product?.name || dbProduct.name_fr,
            price: Number(unitPrice.toFixed(2)),
            image:
              dbProduct.product_images?.[0]?.image_url ||
              item.product?.image ||
              item.image,
            reference: dbProduct.reference || null,
          },
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
        const result = applyProDiscountToPack(
          applyPackQuantityOverrides(computedPack, item.quantities),
          pack,
          pricingContext
        );

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
        user_id: user.id,
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

    cartId = inserted.id;

    const stripeSubtotalCents = line_items.reduce((sum, item) => {
      const unitAmount = Number(item.price_data?.unit_amount || 0);
      return sum + unitAmount * Number(item.quantity || 1);
    }, 0);

    let creditAmountCents = 0;

    if (isPro && stripeSubtotalCents > 50) {
      const { data: reservations, error: reservationError } =
        await supabase.rpc("reserve_pro_credit", {
          p_user_id: user.id,
          p_cart_id: inserted.id,
          // Stripe doit conserver au moins 0,50 € à payer.
          p_max_amount_cents: stripeSubtotalCents - 50,
        });

      if (reservationError) {
        throw new Error(`Réservation du crédit impossible: ${reservationError.message}`);
      }

      const reservation = reservations?.[0];
      if (reservation) {
        creditReservationId = reservation.reservation_id;
        creditAmountCents = Number(reservation.amount_cents || 0);
      }
    }

    let couponId: string | undefined;
    if (creditAmountCents > 0) {
      const coupon = await stripe.coupons.create({
        amount_off: creditAmountCents,
        currency: "eur",
        duration: "once",
        max_redemptions: 1,
        name: "Crédit de bienvenue PRO",
        metadata: {
          user_id: user.id,
          cart_id: inserted.id,
          credit_reservation_id: creditReservationId!,
        },
      });
      couponId = coupon.id;
    }

    // -------------------------
    // STRIPE
    // -------------------------
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: user.email,
      line_items,
      discounts: couponId ? [{ coupon: couponId }] : undefined,
      metadata: {
        user_id: user.id,
        cart_id: inserted.id,
        client_name: clientName,
        address: shipping.address,
        postal_code: shipping.postalCode,
        city: shipping.city,
        country: shipping.country,
        language: shipping.locale,
        credit_reservation_id: creditReservationId || "",
        credit_cents: String(creditAmountCents),
      },
      success_url: `${process.env.NEXT_PUBLIC_URL}/${locale}/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/${locale}/cart`,
    });

    stripeSessionId = session.id;

    if (creditReservationId) {
      const { error: attachError } = await supabase.rpc(
        "attach_credit_stripe_session",
        {
          p_reservation_id: creditReservationId,
          p_stripe_session_id: session.id,
        }
      );

      if (attachError) {
        throw new Error(`Session de crédit invalide: ${attachError.message}`);
      }
    }

    return NextResponse.json({
      url: session.url,
      creditAppliedCents: creditAmountCents,
    });

  } catch (err) {
    console.error("Erreur checkout:", err);

    if (stripeSessionId) {
      try {
        await stripe.checkout.sessions.expire(stripeSessionId);
      } catch (expireError) {
        console.error("Impossible d’expirer la session Stripe:", expireError);
      }
    }

    if (creditReservationId) {
      await supabaseServer.rpc("release_pro_credit", {
        p_reservation_id: creditReservationId,
        p_stripe_session_id: null,
      });
    }

    if (cartId) {
      await supabaseServer.from("carts_temp").delete().eq("id", cartId);
    }

    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
