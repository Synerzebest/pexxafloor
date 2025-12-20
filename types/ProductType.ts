export interface Product {
  id: string;
  slug: string;
  name_fr: string;
  name_nl: string;
  name_en: string;
  description_fr: string;
  description_nl: string;
  description_en: string;
  price: number;
  product_images?: { image_url: string }[] | null;
  applied_discount?: number | null;
  price_after_discount?: number | null;
  reference: string;
}

export interface ProductSearchResult extends Product {
  subcategory: {
    id: string;
    slug: string;
    name_fr: string;
    name_nl: string;
    name_en: string;

    category: {
      id: string;
      slug: string;
      name_fr: string;
      name_nl: string;
      name_en: string;
    };
  } | null;

  product_images: { image_url: string }[];
}
