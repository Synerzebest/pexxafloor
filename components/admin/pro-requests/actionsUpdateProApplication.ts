'use server';

import { supabaseServer } from "@/lib/supabaseServer";
import { requireAdmin } from "@/lib/requireRole";

// Fields an admin may correct on an application. Status changes go through the dedicated RPCs.
const EDITABLE_FIELDS = [
  "first_name", "last_name", "email", "phone", "whatsapp", "company_name", "vat",
  "business_type", "address_line1", "address_line2", "town", "county", "postcode",
] as const;

type EditableField = (typeof EDITABLE_FIELDS)[number];

// profiles.company_name / vat follow automatically (trigger pro_applications_sync_profile_company)
export async function updateProApplication(
  id: string,
  data: Partial<Record<EditableField, string | null>>
) {
  // Server actions are public endpoints: check the caller every time
  const auth = await requireAdmin();
  if (!auth.ok) throw new Error("Forbidden");

  const update = Object.fromEntries(
    EDITABLE_FIELDS.filter((field) => field in data).map((field) => [field, data[field] ?? null])
  );

  const { error } = await supabaseServer
    .from("pro_applications")
    .update(update)
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  return true;
}
