import {cookies} from 'next/headers';
import {redirect} from 'next/navigation';
import {getLocale} from 'next-intl/server';
import {createServerComponentClient} from '@supabase/auth-helpers-nextjs';
import ProRequestsTable from '@/components/admin/ProRequestsTable';
import { Navbar, Footer } from "@/components";

export default async function ProRequestsAdminPage() {
  const supabase = createServerComponentClient({ cookies });
  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  const locale = await getLocale();

  if (userErr || !user) {
    redirect(`/${locale}/login`);
  }

  // Vérif ADMIN
  const { data: profile, error: profErr } = await supabase
    .from('profiles')
    .select('isadmin')
    .eq('id', user.id)
    .single();

  if (profErr || !profile || !profile.isadmin) {
    redirect(`/${locale}`); // pas admin
  }

  const columns = `
    id, created_at, status,
    first_name, last_name, email, phone,
    company_name, business_type,
    address_line1, address_line2, town, county, postcode, whatsapp, vat
  `;

  // PENDING + IN_REVIEW
  const { data: pending } = await supabase
    .from('pro_applications')
    .select(columns)
    .in('status', ['PENDING', 'IN_REVIEW'])
    .order('created_at', { ascending: true });

  // Historique récent (tout sauf PENDING et IN_REVIEW)
  const { data: recent } = await supabase
    .from('pro_applications')
    .select(columns)
    .in('status', ['VERIFIED', 'REJECTED', 'SUSPENDED', 'REVISION'])
    .order('created_at', { ascending: false })
    .limit(30);


  return (
    <>
      <Navbar />

      <ProRequestsTable
        pending={pending ?? []}
        recent={recent ?? []}
      />

      <Footer />
    </>
  );
}
