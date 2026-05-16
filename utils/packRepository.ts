import type { SupabaseClient } from "@supabase/supabase-js";
import type { PackDefinition, PackRule } from "@/types/PackConfigType";

const PACK_SELECT = `
  id,
  slug,
  name_fr,
  name_nl,
  name_en,
  active,
  sort_order,
  pack_items (
    id,
    pack_id,
    product_id,
    role,
    group_key,
    quantity_mode,
    quantity_value,
    multiplier,
    rounding,
    conditions,
    sort_order,
    active,
    product:products (
      id,
      name_fr,
      name_nl,
      name_en,
      price,
      reference,
      product_images!fk_product (
        id,
        image_url,
        order
      )
    )
  )
`;

function normalizePack(pack: any): PackDefinition {
  return {
    ...pack,
    sort_order: Number(pack.sort_order || 0),
    pack_items: (pack.pack_items || [])
      .filter((item: any) => item.product)
      .map((item: any): PackRule => ({
        ...item,
        quantity_value:
          item.quantity_value === null || item.quantity_value === undefined
            ? null
            : Number(item.quantity_value),
        multiplier:
          item.multiplier === null || item.multiplier === undefined
            ? null
            : Number(item.multiplier),
        sort_order: Number(item.sort_order || 0),
        product: {
          ...item.product,
          price: Number(item.product.price || 0),
          product_images: [...(item.product.product_images || [])].sort(
            (a: any, b: any) => Number(a.order || 0) - Number(b.order || 0)
          ),
        },
      }))
      .sort((a: PackRule, b: PackRule) => Number(a.sort_order || 0) - Number(b.sort_order || 0)),
  };
}

export async function fetchPackBySlug(
  supabase: SupabaseClient,
  slug: string,
  includeInactive = false
) {
  let query = supabase.from("packs").select(PACK_SELECT).eq("slug", slug);

  if (!includeInactive) {
    query = query.eq("active", true);
  }

  const { data, error } = await query.single();

  if (error || !data) {
    return { pack: null, error };
  }

  return { pack: normalizePack(data), error: null };
}

export async function fetchPacks(supabase: SupabaseClient, includeInactive = true) {
  let query = supabase.from("packs").select(PACK_SELECT).order("sort_order", { ascending: true });

  if (!includeInactive) {
    query = query.eq("active", true);
  }

  const { data, error } = await query;

  if (error || !data) {
    return { packs: [], error };
  }

  return { packs: data.map(normalizePack), error: null };
}
