import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";

import { Navbar, Footer, UserOrders } from "@/components";
import ProButton from "@/components/profile/ProButton";
import LogoutButton from "@/components/auth/LogoutButton";
import { createSupabaseServerAuthClient } from "@/lib/supabaseServerAuth";

export default async function ProfilePage() {
  const locale = await getLocale();
  const supabase = await createSupabaseServerAuthClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect(`/${locale}/login`);

  return (
    <>
      <Navbar />
      <div className="max-w-4xl mx-auto py-8 px-4 relative top-24">
        <ProButton userId={user.id} locale={locale} />
        <UserOrders />
        <LogoutButton />
      </div>
      <Footer />
    </>
  );
}
