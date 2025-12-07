import { SubCategory } from "./SubCategoryType"

export type Category = {
  id: string;
  slug: string;
  name_fr: string;
  name_nl: string;
  name_en: string;
  subcategories: SubCategory[];
};