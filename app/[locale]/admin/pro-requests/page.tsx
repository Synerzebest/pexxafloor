import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getLocale } from 'next-intl/server';
import { createServerClient } from '@supabase/ssr';
import ProRequestsTable from '@/components/admin/ProRequestsTable';
import { Navbar, Footer } from "@/components";

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

  console.log("USER SUPABASE =>", user);

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

    console.log("pending", pending)

  // Historique récent
  const { data: recent } = await supabase
    .from('pro_applications')
    .select(columns)
    .in('status', ['VERIFIED', 'REJECTED', 'SUSPENDED', 'REVISION'])

    console.log("data", recent)

  return (
    <>
      <Navbar />

      <div className="relative top-32">
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
