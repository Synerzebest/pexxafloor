import {cookies} from 'next/headers';
import {redirect} from 'next/navigation';
import {getLocale} from 'next-intl/server';
import {createServerClient} from "@supabase/ssr";
import ProSignupForm from '@/components/pro/ProSignupForm';
import { Navbar, Footer } from "@/components"

export default async function ProSignupPage() {
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
