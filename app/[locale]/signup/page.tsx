import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { createServerClient } from "@supabase/ssr";
import SignupForm from "@/components/auth/SignupForm";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
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
          cookieStore.set({ name, value: "", ...options });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const locale = await getLocale();
  const params = await searchParams;
  const nextPath =
    params.next?.startsWith(`/${locale}/`) && !params.next.startsWith("//")
      ? params.next
      : undefined;

  if (user) redirect(nextPath || `/${locale}/profile`);

  return <SignupForm locale={locale} nextPath={nextPath} />;
}
