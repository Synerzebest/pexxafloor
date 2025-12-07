export interface ProApplication {
    id: string;
    user_id: string;
    company_name: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    whatsapp: string | null;
    business_type: string;
    vat: string;
  
    address_line1: string;
    address_line2: string | null;
    postcode: string;
    town: string;
    county: string | null;
  
    status: "PENDING" | "IN_REVIEW" | "VERIFIED" | "REJECTED" | "SUSPENDED" | "REVISION";
  
    created_at: string;
    verified_at: string | null;
  }
  