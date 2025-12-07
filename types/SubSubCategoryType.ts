import { Product } from "./ProductType";

export type SubSubCategory = {
    id: string;
    slug: string;
    name_fr: string;
    name_nl: string;
    name_en: string;
    products: Product[];
    order: number | null;
    subcategory_id: string;
  };