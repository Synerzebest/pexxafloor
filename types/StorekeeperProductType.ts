export interface StorekeeperProduct {
    id: string;
    description: string;
    total_price: number;
    quantity_ordered: number;
  
    picked_quantity?: number;
    verified_quantity?: number;
    isPicked?: boolean;
  }
  