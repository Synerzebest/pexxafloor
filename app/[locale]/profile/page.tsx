import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";

import { Navbar, Footer, UserOrders } from "@/components";
import ProButton from "@/components/profile/ProButton";
import LogoutButton from "@/components/auth/LogoutButton";
import { createSupabaseServerAuthClient } from "@/lib/supabaseServerAuth";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ editAddress?: string }>;
}) {
  const locale = await getLocale();
  const supabase = await createSupabaseServerAuthClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    // Keep the email link's target (?editAddress=…) through the login
    const { editAddress } = await searchParams;
    const next = editAddress && /^[0-9a-f-]{36}$/i.test(editAddress)
      ? `/${locale}/profile?editAddress=${editAddress}`
      : null;
    redirect(`/${locale}/login${next ? `?next=${encodeURIComponent(next)}` : ""}`);
  }

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
