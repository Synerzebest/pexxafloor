import ProRequestsTable from '@/components/admin/pro-requests/ProRequestsTable';
import { Footer } from "@/components";
import { supabaseServer } from "@/lib/supabaseServer"

export default async function ProRequestsAdminPage() {
  const columns = `
    id, user_id, created_at, status,
    first_name, last_name, email, phone,
    company_name, business_type,
    address_line1, address_line2, town, county, postcode, whatsapp, vat
  `;


  // PENDING + IN_REVIEW
  const { data: pending } = await supabaseServer
    .from('pro_applications')
    .select(columns)
    .in('status', ['PENDING', 'IN_REVIEW'])


  // Historique récent
  const { data: recent } = await supabaseServer
    .from('pro_applications')
    .select(columns)
    .in('status', ['VERIFIED', 'REJECTED', 'SUSPENDED', 'REVISION'])


  return (
    <>
      <div className="pt-8">
        <ProRequestsTable
          pending={pending ?? []}
          recent={recent ?? []}
        />
      </div>

      <Footer />
    </>
  );
}
