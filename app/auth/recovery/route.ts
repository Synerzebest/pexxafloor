import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

// A recovery link never uses the normal sign-in / administrator redirect.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const requestedLocale = url.searchParams.get("locale");
  const locale = requestedLocale === "en" || requestedLocale === "nl" ? requestedLocale : "fr";
  const destination = new URL(`/${locale}/update-password`, url.origin);
  const tokenHash = url.searchParams.get("token_hash");
  const code = url.searchParams.get("code");
  let valid = false;

  if (!url.searchParams.has("error") && (tokenHash || code)) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: values => {
            values.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          },
        },
      }
    );
    // TokenHash links also work when opened in another browser/device.
    // Code links support the existing Supabase ConfirmationURL template.
    const { error } = tokenHash
      ? await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "recovery" })
      : await supabase.auth.exchangeCodeForSession(code!);
    valid = !error;
  }

  if (!valid) destination.searchParams.set("recoveryError", "1");
  const response = NextResponse.redirect(destination);
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}
