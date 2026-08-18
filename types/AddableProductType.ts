export interface AddableProduct {
  id: string;
  name: string;
  unit_price: number;
  image_url: string;
  reference?: string | null;
}
