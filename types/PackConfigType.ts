export type PackRole = "calculated" | "included" | "option";

export type PackQuantityMode =
  | "fixed"
  | "per_surface"
  | "per_tube_length"
  | "per_circuit"
  | "per_perimeter"
  | "capacity_match"
  | "roll_optimizer"
  | "manual_option";

export type PackRounding = "ceil" | "floor" | "round" | "none";

export type PackConditions = {
  tuyauType?: string | string[];
  typeAgrafe?: number | number[];
  typeIsolation?: number | number[];
  pasDePose?: number | number[];
  treillisType?: string | string[];
};

export type PackCatalogProduct = {
  id: string;
  name_fr: string;
  name_nl?: string | null;
  name_en?: string | null;
  price: number;
  reference?: string | null;
  product_images?: { id: string; image_url: string; order?: number | null }[];
};

export type PackDefinition = {
  id: string;
  slug: string;
  name_fr: string;
  name_nl: string;
  name_en: string;
  image_url?: string | null;
  installation_ease?: number | null;
  installation_speed?: number | null;
  price_level?: number | null;
  installation_height_fr?: string | null;
  installation_height_nl?: string | null;
  installation_height_en?: string | null;
  insulation_fr?: string | null;
  insulation_nl?: string | null;
  insulation_en?: string | null;
  active: boolean;
  sort_order: number;
  pack_items: PackRule[];
};

export type PackRule = {
  id: string;
  pack_id: string;
  product_id: string;
  role: PackRole;
  group_key?: string | null;
  quantity_mode: PackQuantityMode;
  quantity_value?: number | null;
  multiplier?: number | null;
  rounding?: PackRounding | null;
  conditions?: PackConditions | null;
  sort_order?: number | null;
  active: boolean;
  product: PackCatalogProduct;
};

export type PackCalculationInput = {
  pack: PackDefinition;
  surface: number;
  pasDePose: number;
  tuyauType: "PERT" | "PERT-AL-PERT";
  typeAgrafe: 40 | 60;
  typeIsolation: 0 | 15 | 30;
  selectedOptions?: Record<string, boolean>;
};

export type PackLineProduct = {
  id: string;
  pack_item_id: string;
  product_id: string;
  description: string;
  price: number;
  reference?: string | null;
  image?: string;
  selectedQuantity?: number;
};

export type PackCalculationResult = {
  products: PackLineProduct[];
  quantities: Record<string, number>;
  included: PackLineProduct[];
  options: PackLineProduct[];
  tubLength: number;
  circuitsNumber: number;
  total: number;
};
