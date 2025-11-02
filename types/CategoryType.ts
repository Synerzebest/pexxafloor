import { Subcategory } from "./SubcategoryType"

export type Category = {
    id: string;
    slug: string;
    name_fr: string;
    name_nl: string;
    name_en: string;
    order: number;
    subcategories: Subcategory[];
  };