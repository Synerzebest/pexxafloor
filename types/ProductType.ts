export type ProductImage = {
  id: string;
  image_url: string;
  order?: number | null;
};

export type Product = {
  id: string;
  slug: string;

  name_fr: string;
  name_nl: string;
  name_en: string;

  description_fr?: string | null;
  description_nl?: string | null;
  description_en?: string | null;

  price: number;
  reference?: string | null;
  is_best_seller?: boolean;

  product_images?: ProductImage[];

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
      discount?: number | null;
    };
  };

  subsubcategory?: {
    id: string;
    slug: string;
    name_fr: string;
    name_nl: string;
    name_en: string;
  } | null;
};
