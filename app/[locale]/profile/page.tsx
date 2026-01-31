import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { createServerClient } from "@supabase/ssr";

import { Navbar, Footer, UserOrders } from "@/components";
import ProButton from "@/components/profile/ProButton";
import LogoutButton from "@/components/auth/LogoutButton";

export default async function ProfilePage() {
  const locale = await getLocale();

  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          cookieStore.delete({ name, ...options });
        }
      }
    }
  );

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
