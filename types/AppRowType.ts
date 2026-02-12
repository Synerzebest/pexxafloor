import { Status } from "./StatusType";

export type AppRow = {
    id: string;
    created_at: string;
    status: Status;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    whatsapp: string | null;
    company_name: string;
    vat: string | null;
    business_type: string;
    address_line1: string | null;
    address_line2: string | null;
    town: string | null;
    county: string | null;
    postcode: string | null;
  };