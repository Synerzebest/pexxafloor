import { Product } from "./ProductType";

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  order: number | null;
  created_at: string;
}

export interface ProductWithSubSub extends Product {
    subsub_id: string;
    subcategory_id: string;
    product_images: ProductImage[];
  }
  