import {cookies} from 'next/headers';
import {redirect} from 'next/navigation';
import {getLocale} from 'next-intl/server';
import {createServerComponentClient} from '@supabase/auth-helpers-nextjs';
import ProSignupForm from '@/components/pro/ProSignupForm';
import { Navbar, Footer } from "@/components"

export default async function ProSignupPage() {
  const supabase = createServerComponentClient({cookies});
  const {data: {user}} = await supabase.auth.getUser();
  const locale = await getLocale();

  if (!user) redirect(`/${locale}/login`);

  return (
      <>
        <Navbar />
        <ProSignupForm locale={locale} />
        <div className="relative top-36">
          <Footer />
        </div>
      </>
  );
}
