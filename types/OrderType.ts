export type Order = {
    id: string;
    user_id: string;
    status: string;
    total: number;
    items: any;
    client_name: string;
    created_at: string;
    address: string;
    postal_code: string;
    city: string;
    country: string;
    cartons: number;
    rouleaux: number;
    bottes: number;
    language: string;
    internal_note: string;
    internal_comment: string;
  };
  