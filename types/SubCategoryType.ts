import { SubSubCategory } from "./SubSubCategoryType";

export type SubCategory = {
  id: string;
  slug: string;
  name_fr: string;
  name_nl: string;
  name_en: string;
  category_id: string;
  subsubcategories: SubSubCategory[];
};