"use server";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function loginWithEmail(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

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
          cookieStore.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: any) {
          cookieStore.delete({
            name,
            ...options,
          });
        },
      },
    }
  );

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  let userRole: string | null = null;
  if (!error && data.user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("user_role")
      .eq("id", data.user.id)
      .maybeSingle();
    userRole = profile?.user_role || null;
  }

  return {
    error: error
      ? {
          code: error.code || "auth_error",
        }
      : null,
    userRole,
  };
}
