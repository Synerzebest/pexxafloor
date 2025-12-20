import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getLocale } from 'next-intl/server';
import { createServerClient } from '@supabase/ssr';
import ProRequestsTable from '@/components/admin/ProRequestsTable';
import { Navbar, Footer } from "@/components";
import Link from "next/link";

export default async function ProRequestsAdminPage() {

  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
    error: userErr
  } = await supabase.auth.getUser();

  const locale = await getLocale();

  if (userErr || !user) {
    redirect(`/${locale}/login`);
  }

  const columns = `
    id, user_id, created_at, status,
    first_name, last_name, email, phone,
    company_name, business_type,
    address_line1, address_line2, town, county, postcode, whatsapp, vat
  `;


  // PENDING + IN_REVIEW
  const { data: pending } = await supabase
    .from('pro_applications')
    .select(columns)
    .in('status', ['PENDING', 'IN_REVIEW'])


  // Historique récent
  const { data: recent } = await supabase
    .from('pro_applications')
    .select(columns)
    .in('status', ['VERIFIED', 'REJECTED', 'SUSPENDED', 'REVISION'])


  return (
    <>
      <Navbar />

      <div className="absolute top-36 left-4">
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

      <div className="relative top-44">
        <ProRequestsTable
          pending={pending ?? []}
          recent={recent ?? []}
          locale={locale}
        />
      </div>

      <div className="relative top-32">
        <Footer />
      </div>
    </>
  );
}
