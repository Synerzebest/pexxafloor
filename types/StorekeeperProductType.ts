export interface StorekeeperProduct {
  id: string;
  description: string;
  total_price: number;
  quantity_ordered: number;
  image?: string | null;
  reference?: string | null;

  picked_quantity?: number;
  verified_quantity?: number;
  isPicked?: boolean;
}
  
