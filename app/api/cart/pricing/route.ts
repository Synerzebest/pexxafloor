import { supabaseServer } from "@/lib/supabaseServer";
import { NextResponse } from "next/server";
import { applyPackQuantityOverrides, computeDbPackProducts } from "@/utils/packDbCalculations";
import { fetchPackBySlug } from "@/utils/packRepository";
import { createSupabaseServerAuthClient } from "@/lib/supabaseServerAuth";
import {
  applyProDiscountToPack,
  getProPricingContext,
  resolveProDiscount,
} from "@/utils/proCategoryDiscounts";

export async function POST(req: Request) {
  try {
    const { items } = await req.json();
    const supabase = supabaseServer;
    const supabaseAuth = await createSupabaseServerAuthClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();
    const pricingContext = await getProPricingContext(supabase, user?.id);
    const isPro = pricingContext.isPro;

    // 🔒 IDs produits sécurisés
    const productIds = items
      .filter((i: any) => i.type === "product")
      .map((i: any) => i.product_id)
      .filter((id: any): id is string => typeof id === "string");

    // 🔒 Fetch produits + discount catégorie
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
          category:category_id (
            id,
            discount
          )
        )
      `)
      .in("id", productIds);

    if (error || !data) {
      console.error("Erreur produits:", error);
      return new Response("Erreur produits", { status: 500 });
    }

    const products = data as any[];

    const map = new Map(products.map((p) => [p.id, p]));

    // Calcul pricing
    const pricedItems = [];

    for (const item of items) {
      if (item.type === "product") {
        const p = map.get(item.product_id);

        if (!p) {
          throw new Error(`Produit introuvable: ${item.product_id}`);
        }

        const basePrice = Number(p.price);

        const category = p.subcategories?.category;
        const discount = resolveProDiscount(
          category?.id,
          category?.discount,
          pricingContext
        );


        let unitPrice = basePrice;

        if (isPro && discount > 0) {
          unitPrice = basePrice * (1 - discount / 100);
        }

        pricedItems.push({
          ...item,
          unit_price: Number(unitPrice.toFixed(2)),
          base_price: Number(basePrice.toFixed(2)),
          image: p.product_images?.[0]?.image_url || item.image || item.product?.image,
          reference: p.reference || null,
          product: {
            ...item.product,
            name: item.product?.name || p.name_fr,
            price: Number(unitPrice.toFixed(2)),
            image: p.product_images?.[0]?.image_url || item.product?.image || item.image,
            reference: p.reference || null,
          },
        });
        continue;
      }

      if (item.type === "pack") {
        const { pack, error: packError } = await fetchPackBySlug(supabase, item.slug);

        if (packError || !pack) {
          throw new Error(`Pack introuvable: ${item.slug}`);
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

        pricedItems.push({
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
        });
      }
    }

    return NextResponse.json({
      items: pricedItems,
      isPro,
    });

  } catch (err) {
    console.error("Erreur pricing API:", err);
    return new Response("Erreur serveur", { status: 500 });
  }
}
