import type { SupabaseClient } from "@supabase/supabase-js";
import type { PackCalculationResult, PackDefinition } from "@/types/PackConfigType";

export type ProPricingContext = {
  isPro: boolean;
  customDiscounts: Map<string, number>;
};

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
    .select("category_id, discount_percent")
    .eq("user_id", userId);

  if (error) throw new Error(`Unable to load custom PRO discounts: ${error.message}`);

  return {
    isPro: true,
    customDiscounts: new Map(
      (data || []).map((row) => [String(row.category_id), Number(row.discount_percent)])
    ),
  };
}

export function resolveProDiscount(
  categoryId: string | null | undefined,
  generalDiscount: number | null | undefined,
  context: ProPricingContext
) {
  if (!context.isPro) return 0;
  if (categoryId && context.customDiscounts.has(categoryId)) {
    return context.customDiscounts.get(categoryId) ?? 0;
  }
  return Number(generalDiscount || 0);
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
    const category = rule?.product?.subcategory?.category;
    const discount = resolveProDiscount(category?.id, category?.discount, context);
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
