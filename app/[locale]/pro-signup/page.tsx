import {getLocale} from 'next-intl/server';
import ProSignupForm from '@/components/pro/ProSignupForm';
import { Navbar, Footer } from "@/components"
import { createSupabaseServerAuthClient } from '@/lib/supabaseServerAuth';
import { redirect } from 'next/navigation';

export default async function ProSignupPage() {
  const locale = await getLocale();
  const supabase = await createSupabaseServerAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/${locale}/login`);

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_pro")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.is_pro === true) redirect(`/${locale}/profile`);

  const { data: existingApplication } = await supabase
    .from("pro_applications")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingApplication) redirect(`/${locale}/profile`);

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
