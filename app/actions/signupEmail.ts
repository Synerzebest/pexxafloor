"use server";

import { cookies, headers } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function signupWithEmail(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const locale = String(formData.get("locale") || "fr");
  const requestedNext = String(formData.get("next") || "");
  const next =
    requestedNext.startsWith(`/${locale}/`) && !requestedNext.startsWith("//")
      ? requestedNext
      : `/${locale}/profile`;
  const cookieStore = await cookies();
  const requestHeaders = await headers();
  const origin =
    requestHeaders.get("origin") ||
    process.env.NEXT_PUBLIC_URL ||
    "http://localhost:3000";
  const callbackUrl = new URL("/auth/callback", origin);
  callbackUrl.searchParams.set("next", next);

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

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
      },
      emailRedirectTo: callbackUrl.toString(),
    }
  });

  if (error || !data.user) {
    console.error("Supabase signup failed:", {
      code: error?.code || "signup_error",
      status: error?.status,
      message: error?.message,
    });

    return {
      error: {
        code: error?.code || "signup_error",
      },
      requiresEmailConfirmation: false,
    };
  }

  return {
    error: null,
    requiresEmailConfirmation: !data.session,
  };
}
