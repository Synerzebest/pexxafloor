import { Product } from "./ProductType";

export interface ProductWithSubSub extends Product {
    subsub_id: string;
    subcategory_id: string;
  }
  