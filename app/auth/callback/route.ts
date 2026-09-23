import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const requestedNext = url.searchParams.get("next") || "/";
  const next =
    requestedNext.startsWith("/") && !requestedNext.startsWith("//") && !requestedNext.includes("\\")
      ? requestedNext
      : "/";
  const locale = next.split("/").filter(Boolean)[0];
  const supportedLocale = ["fr", "nl", "en"].includes(locale) ? locale : "fr";

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
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      }
    }
  );

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      const errorUrl = new URL(next, url.origin);
      errorUrl.searchParams.set("recoveryError", "1");
      return NextResponse.redirect(errorUrl);
    }

    // Recovery must reach the password form, including for administrators.
    const isRecovery = "redirectType" in data && data.redirectType === "recovery";
    if (isRecovery || /^\/(fr|nl|en)\/update-password\/?$/.test(next)) {
      return NextResponse.redirect(new URL(`/${supportedLocale}/update-password`, url.origin));
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_role")
        .eq("id", user.id)
        .maybeSingle();

      if (profile?.user_role === "admin") {
        return NextResponse.redirect(
          new URL(`/${supportedLocale}/admin`, url.origin)
        );
      }
    }
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
