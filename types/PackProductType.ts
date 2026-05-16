export type PackProduct = {
    id: string;
    pack_item_id?: string;
    product_id?: string;
    description: string;
    unit_price: number;
    image?: string;
    reference?: string | null;
    total_price?: number;
  };
  
