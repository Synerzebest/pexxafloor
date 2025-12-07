import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { Navbar, Footer, UserOrders } from "@/components";
import ProButton from "@/components/profile/ProButton";
import LogoutButton from "@/components/auth/LogoutButton";

export default async function ProfilePage() {
  const supabase = createServerComponentClient({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const locale = await getLocale();

  if (!user) redirect(`/${locale}/login`);

  return (
    <>
      <Navbar />
      <div className="max-w-4xl mx-auto py-8 px-4">
        <ProButton userId={user?.id} locale={locale} />
        <UserOrders />
        <LogoutButton />
      </div>
      <Footer />
    </>
  );
}
