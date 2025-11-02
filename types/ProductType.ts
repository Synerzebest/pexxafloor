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
    product_images: { image_url: string }[];
  }
  