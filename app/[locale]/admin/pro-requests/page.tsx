import { getLocale } from 'next-intl/server';
import ProRequestsTable from '@/components/admin/pro-requests/ProRequestsTable';
import { Footer } from "@/components";
import Link from "next/link";
import { supabaseServer } from "@/lib/supabaseServer"

export default async function ProRequestsAdminPage() {
  const locale = await getLocale();

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
      <div className="px-4 pt-6">
        <Link
          href={`/${locale}/admin`}
          className="inline-flex items-center gap-2 text-orange-500 font-medium hover:text-orange-600 transition"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Retour au panneau d’administration
        </Link>
      </div>

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
