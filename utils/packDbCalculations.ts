import type {
  PackCalculationInput,
  PackCalculationResult,
  PackConditions,
  PackLineProduct,
  PackRule,
  PackRounding,
} from "@/types/PackConfigType";

function toNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function roundQuantity(value: number, rounding: PackRounding | null | undefined) {
  if (rounding === "floor") return Math.floor(value);
  if (rounding === "round") return Math.round(value);
  if (rounding === "none") return value;
  return Math.ceil(value);
}

function conditionMatches<T extends string | number>(
  actual: T,
  expected?: T | T[]
) {
  if (expected === undefined) return true;
  return Array.isArray(expected) ? expected.includes(actual) : expected === actual;
}

function matchesConditions(rule: PackRule, context: {
  tuyauType: string;
  typeAgrafe: number;
  typeIsolation: number;
  pasDePose: number;
  treillisType: string;
}) {
  const conditions = (rule.conditions || {}) as PackConditions;

  return (
    conditionMatches(context.tuyauType, conditions.tuyauType) &&
    conditionMatches(context.typeAgrafe, conditions.typeAgrafe) &&
    conditionMatches(context.typeIsolation, conditions.typeIsolation) &&
    conditionMatches(context.pasDePose, conditions.pasDePose) &&
    conditionMatches(context.treillisType, conditions.treillisType)
  );
}

function makeLine(rule: PackRule): PackLineProduct {
  const firstImage = rule.product.product_images?.[0]?.image_url;

  return {
    id: rule.id,
    pack_item_id: rule.id,
    product_id: rule.product_id,
    description: rule.product.name_fr,
    price: toNumber(rule.product.price),
    reference: rule.product.reference,
    image: firstImage,
  };
}

function addLine(
  products: PackLineProduct[],
  quantities: Record<string, number>,
  rule: PackRule,
  quantity: number
) {
  const normalized = Math.max(0, quantity);
  if (normalized <= 0) return;

  const existing = products.find((p) => p.id === rule.id);
  quantities[rule.id] = (quantities[rule.id] || 0) + normalized;

  if (existing) {
    existing.selectedQuantity = quantities[rule.id];
    return;
  }

  products.push({
    ...makeLine(rule),
    selectedQuantity: normalized,
  });
}

function sortRules(rules: PackRule[]) {
  return [...rules].sort((a, b) => {
    const order = toNumber(a.sort_order) - toNumber(b.sort_order);
    if (order !== 0) return order;
    return a.id.localeCompare(b.id);
  });
}

function groupRules(rules: PackRule[]) {
  return rules.reduce<Record<string, PackRule[]>>((acc, rule) => {
    const key = rule.group_key || rule.id;
    acc[key] = acc[key] || [];
    acc[key].push(rule);
    return acc;
  }, {});
}

function optimizeRolls(rolls: PackRule[], requiredLength: number) {
  const validRolls = sortRules(rolls)
    .map((roll) => ({
      roll,
      capacity: toNumber(roll.quantity_value),
      price: toNumber(roll.product.price),
    }))
    .filter((roll) => roll.capacity > 0);

  if (!validRolls.length || requiredLength <= 0) return [];

  const smallestCapacity = Math.min(...validRolls.map((roll) => roll.capacity));
  const maxRolls = Math.ceil(requiredLength / smallestCapacity) + 1;
  let best:
    | {
        counts: Map<string, number>;
        totalCapacity: number;
        totalPrice: number;
        totalRolls: number;
      }
    | null = null;

  function visit(index: number, counts: Map<string, number>, totalCapacity: number, totalPrice: number, totalRolls: number) {
    if (index === validRolls.length) {
      if (totalCapacity < requiredLength) return;

      if (
        !best ||
        totalCapacity < best.totalCapacity ||
        (totalCapacity === best.totalCapacity && totalPrice < best.totalPrice) ||
        (totalCapacity === best.totalCapacity &&
          totalPrice === best.totalPrice &&
          totalRolls < best.totalRolls)
      ) {
        best = {
          counts: new Map(counts),
          totalCapacity,
          totalPrice,
          totalRolls,
        };
      }
      return;
    }

    const current = validRolls[index];

    for (let count = 0; count <= maxRolls; count += 1) {
      if (count > 0) counts.set(current.roll.id, count);
      else counts.delete(current.roll.id);

      visit(
        index + 1,
        counts,
        totalCapacity + count * current.capacity,
        totalPrice + count * current.price,
        totalRolls + count
      );
    }
  }

  visit(0, new Map(), 0, 0, 0);

  if (!best) return [];

  return validRolls
    .map(({ roll }) => ({
      roll,
      count: best?.counts.get(roll.id) || 0,
    }))
    .filter((item) => item.count > 0);
}

export function computeDbPackProducts({
  pack,
  surface,
  pasDePose,
  tuyauType,
  typeAgrafe,
  typeIsolation,
  selectedOptions = {},
}: PackCalculationInput): PackCalculationResult {
  const products: PackLineProduct[] = [];
  const quantities: Record<string, number> = {};

  const tubLength = (surface / pasDePose) * 100;
  const circuitsNumber = Math.ceil(tubLength / 100);
  const averagePerimeter = (surface / 2) * 1.5;
  const treillisType = pasDePose === 10 || pasDePose === 20 ? "10x10" : "15x15";

  const context = {
    tuyauType,
    typeAgrafe,
    typeIsolation,
    pasDePose,
    treillisType,
  };

  const activeRules = sortRules(
    (pack.pack_items || []).filter((rule) => rule.active && matchesConditions(rule, context))
  );

  const calculated = activeRules.filter((rule) => rule.role === "calculated");
  const grouped = groupRules(calculated);
  const handledGroups = new Set<string>();

  for (const rule of calculated) {
    const mode = rule.quantity_mode;
    const groupKey = rule.group_key || rule.id;
    const quantityValue = toNumber(rule.quantity_value, 1);
    const multiplier = toNumber(rule.multiplier, 1);

    if (mode === "capacity_match") {
      if (handledGroups.has(groupKey)) continue;
      handledGroups.add(groupKey);

      const candidates = sortRules(grouped[groupKey] || []).sort(
        (a, b) => toNumber(a.quantity_value) - toNumber(b.quantity_value)
      );
      const selected =
        candidates.find((candidate) => toNumber(candidate.quantity_value) >= circuitsNumber) ||
        candidates[candidates.length - 1];

      if (selected) addLine(products, quantities, selected, 1);
      continue;
    }

    if (mode === "roll_optimizer") {
      if (handledGroups.has(groupKey)) continue;
      handledGroups.add(groupKey);

      optimizeRolls(grouped[groupKey] || [], tubLength * multiplier).forEach(({ roll, count }) => {
        addLine(products, quantities, roll, count);
      });
      continue;
    }

    let quantity = 0;

    if (mode === "fixed") quantity = quantityValue * multiplier;
    if (mode === "per_surface") quantity = (surface * multiplier) / quantityValue;
    if (mode === "per_tube_length") quantity = (tubLength * multiplier) / quantityValue;
    if (mode === "per_circuit") quantity = circuitsNumber * multiplier;
    if (mode === "per_perimeter") quantity = (averagePerimeter * multiplier) / quantityValue;

    addLine(products, quantities, rule, roundQuantity(quantity, rule.rounding));
  }

  const included = activeRules
    .filter((rule) => rule.role === "included")
    .map((rule) => {
      const line = makeLine(rule);
      const quantity = roundQuantity(
        rule.quantity_mode === "fixed" ? toNumber(rule.quantity_value, 1) : 1,
        rule.rounding
      );
      quantities[line.id] = quantity || 1;
      return line;
    });

  const options = activeRules.filter((rule) => rule.role === "option").map(makeLine);

  let total = 0;

  products.forEach((product) => {
    total += (quantities[product.id] || 0) * product.price;
  });

  included.forEach((product) => {
    total += (quantities[product.id] || 1) * product.price;
  });

  options.forEach((option) => {
    if (selectedOptions[option.id]) {
      total += option.price;
      quantities[option.id] = quantities[option.id] || 1;
    }
  });

  return {
    products,
    quantities,
    included,
    options,
    tubLength,
    circuitsNumber,
    total: Number(total.toFixed(2)),
  };
}

export function applyPackQuantityOverrides(
  result: PackCalculationResult,
  overrides?: Record<string, number>
): PackCalculationResult {
  if (!overrides) return result;

  const quantities = { ...result.quantities };
  const products = result.products.map((product) => {
    const override = Number(overrides[product.id]);

    if (!Number.isFinite(override) || override < 1) {
      return product;
    }

    const quantity = Math.ceil(override);
    quantities[product.id] = quantity;

    return {
      ...product,
      selectedQuantity: quantity,
    };
  });

  let total = 0;

  products.forEach((product) => {
    total += (quantities[product.id] || 0) * product.price;
  });

  result.included.forEach((product) => {
    total += (quantities[product.id] || 1) * product.price;
  });

  result.options.forEach((option) => {
    if (quantities[option.id]) {
      total += (quantities[option.id] || 1) * option.price;
    }
  });

  return {
    ...result,
    products,
    quantities,
    total: Number(total.toFixed(2)),
  };
}
