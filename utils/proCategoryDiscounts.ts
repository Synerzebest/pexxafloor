import type { SupabaseClient } from "@supabase/supabase-js";
import type { PackCalculationResult, PackDefinition } from "@/types/PackConfigType";

export type ProPricingContext = {
  isPro: boolean;
  customDiscounts: Map<string, number>;
};

export type ProDiscountScope = {
  categoryId?: string | null;
  subcategoryId?: string | null;
  subsubcategoryId?: string | null;
  generalDiscount?: number | null;
};

export const discountScopeKey = (
  type: "category" | "subcategory" | "subsubcategory",
  id: string
) => `${type}:${id}`;

export async function getProPricingContext(
  supabase: SupabaseClient,
  userId: string | null | undefined
): Promise<ProPricingContext> {
  if (!userId) return { isPro: false, customDiscounts: new Map() };

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("is_pro")
    .eq("id", userId)
    .maybeSingle();

  if (profileError || profile?.is_pro !== true) {
    return { isPro: false, customDiscounts: new Map() };
  }

  const { data, error } = await supabase
    .from("pro_category_discounts")
    .select("category_id, subcategory_id, subsubcategory_id, discount_percent")
    .eq("user_id", userId);

  if (error) throw new Error(`Unable to load custom PRO discounts: ${error.message}`);

  return {
    isPro: true,
    customDiscounts: new Map(
      (data || []).flatMap((row) => {
        if (row.subsubcategory_id) {
          return [[discountScopeKey("subsubcategory", String(row.subsubcategory_id)), Number(row.discount_percent)] as const];
        }
        if (row.subcategory_id) {
          return [[discountScopeKey("subcategory", String(row.subcategory_id)), Number(row.discount_percent)] as const];
        }
        if (row.category_id) {
          return [[discountScopeKey("category", String(row.category_id)), Number(row.discount_percent)] as const];
        }
        return [];
      })
    ),
  };
}

export function resolveProDiscount(
  scope: ProDiscountScope,
  context: ProPricingContext
) {
  if (!context.isPro) return 0;

  const candidates: Array<["category" | "subcategory" | "subsubcategory", string | null | undefined]> = [
    ["subsubcategory", scope.subsubcategoryId],
    ["subcategory", scope.subcategoryId],
    ["category", scope.categoryId],
  ];
  for (const [type, id] of candidates) {
    if (!id) continue;
    const key = discountScopeKey(type, id);
    if (context.customDiscounts.has(key)) return context.customDiscounts.get(key) ?? 0;
  }
  return Number(scope.generalDiscount || 0);
}

export function applyProDiscountToPack(
  result: PackCalculationResult,
  pack: PackDefinition,
  context: ProPricingContext
): PackCalculationResult {
  if (!context.isPro) return result;

  const ruleById = new Map((pack.pack_items || []).map((rule) => [rule.id, rule]));
  const discountLine = (line: PackCalculationResult["products"][number]) => {
    const rule = ruleById.get(line.id);
    const subcategory = rule?.product?.subcategory;
    const category = subcategory?.category;
    const discount = resolveProDiscount({
      categoryId: category?.id,
      subcategoryId: subcategory?.id,
      subsubcategoryId: rule?.product?.subsubcategory?.id,
      generalDiscount: category?.discount,
    }, context);
    return {
      ...line,
      price: Number((line.price * (1 - discount / 100)).toFixed(2)),
    };
  };

  const products = result.products.map(discountLine);
  const options = result.options.map(discountLine);
  let total = products.reduce(
    (sum, product) => sum + (result.quantities[product.id] || 0) * product.price,
    0
  );
  total += options.reduce(
    (sum, option) =>
      sum + (result.quantities[option.id] ? result.quantities[option.id] * option.price : 0),
    0
  );

  return { ...result, products, options, total: Number(total.toFixed(2)) };
}
